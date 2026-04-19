import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import productVariantService from "@/lib/services/productVariantService";
import revenueService from "@/lib/services/revenueService";
import { sendDiscordWebhook } from "@/lib/services/webhookService";
import emailService from "@/lib/services/emailService";

// Проверка подписи: strtoupper(md5(OutSum + ":" + InvId + ":" + apiToken))
function verifySignature(OutSum, InvId, SignatureValue, apiToken) {
  const hash = crypto
    .createHash("md5")
    .update(`${OutSum}:${InvId}:${apiToken}`)
    .digest("hex")
    .toUpperCase();
  return hash === SignatureValue?.toUpperCase();
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let params;

    if (contentType.includes("application/json")) {
      params = await request.json();
    } else {
      const rawBody = await request.text();
      params = Object.fromEntries(new URLSearchParams(rawBody));
    }

    console.log("=== PAYPALICH WEBHOOK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Params:", JSON.stringify(params, null, 2));
    console.log("==================================");

    const { Status, InvId, Commission, CurrencyIn, OutSum, TrsId, custom, SignatureValue } = params;

    if (!Status || !InvId) {
      console.error("Missing required fields: Status or InvId");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Проверяем подпись если задан токен
    const apiToken = process.env.PAYPALICH_API_TOKEN;
    if (apiToken && SignatureValue) {
      const valid = verifySignature(OutSum, InvId, SignatureValue, apiToken);
      if (!valid) {
        console.error("Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    } else {
      console.warn("Signature check skipped - PAYPALICH_API_TOKEN not set or no SignatureValue");
    }

    if (Status === "SUCCESS") {
      const order_id = InvId;

      const order = await prisma.order.findUnique({
        where: { id: order_id },
        include: {
          product: { include: { translations: true } },
          variant: true,
        },
      });

      if (!order) {
        console.error("Order not found:", order_id);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status === "completed") {
        console.log("Order already completed:", order_id);
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      const hasKeys = await productVariantService.checkAvailableKeys(
        order.variantId,
        order.quantity || 1
      );

      if (!hasKeys) {
        console.error("No available keys for order:", order_id);
        await prisma.order.update({
          where: { id: order_id },
          data: { status: "failed", paymentStatus: "failed" },
        });
        return NextResponse.json({ error: "No available keys" }, { status: 400 });
      }

      const keys = await productVariantService.getKeysForOrder(
        order.variantId,
        order.quantity || 1
      );

      if (!keys || keys.length === 0) {
        console.error("Failed to get keys for order:", order_id);
        await prisma.order.update({
          where: { id: order_id },
          data: { status: "failed", paymentStatus: "failed" },
        });
        return NextResponse.json({ error: "Failed to get keys" }, { status: 500 });
      }

      await prisma.order.update({
        where: { id: order_id },
        data: {
          status: "completed",
          paymentStatus: "completed",
          paidAt: new Date(),
          paymentData: JSON.stringify({
            provider: "paypalich",
            trsId: TrsId,
            outSum: OutSum,
            commission: Commission,
            currencyIn: CurrencyIn,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      if (order.userId) {
        await prisma.userPurchase.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            productId: order.productId,
            variantId: order.variantId,
            price: order.totalUsd || order.totalRub,
            currency: order.totalUsd > 0 ? "usd" : "rub",
            keys: keys.join(", "),
            quantity: order.quantity || 1,
            instruction: order.variant?.instructions || "",
            couponCode: order.couponCode,
            couponDiscount: order.couponDiscount,
          },
        });
        console.log("Keys added to user profile:", order.userId);
      }

      await sendDiscordWebhook(order);

      try {
        const revenueAmount = order.totalUsd > 0 ? order.totalUsd : order.totalRub;
        const revenueCurrency = order.totalUsd > 0 ? "USD" : "RUB";
        await revenueService.recordRevenue(revenueAmount, revenueCurrency);
      } catch (revenueError) {
        console.error("Failed to record revenue:", revenueError);
      }

      const ruTranslation = order.product?.translations?.find((t) => t.language === "ru");
      const productName = ruTranslation?.name || order.product?.translations?.[0]?.name || "Unknown Product";
      const variantName = order.variant?.daysLabelRu || order.variant?.name || "Unknown Variant";

      if (order.email) {
        try {
          await emailService.sendOrderCompletedEmail({
              email: order.email,
              orderId: order.id,
              productName,
              keys,
              totalAmount: order.totalUsd > 0 ? order.totalUsd : order.totalRub,
              currency: order.totalUsd > 0 ? 'USD' : 'RUB'
            });
          console.log("Confirmation email sent to:", order.email);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }

      const couponLog = order.couponCode ? `, Coupon=${order.couponCode} (${order.couponDiscount}%)` : "";
      await prisma.log.create({
        data: {
          user: order.email,
          timestamp: BigInt(Date.now()),
          description: `Paypalich оплата: ID=${order.id}, Product="${productName}", Variant="${variantName}", Price=$${order.totalUsd}/₽${order.totalRub}, TrsId=${TrsId}, Status=completed, Email=${order.email}${couponLog}`,
        },
      });

      console.log("Order completed successfully:", order_id);
    } else if (Status === "FAIL") {
      console.log("Payment failed for order:", InvId);
      await prisma.order.update({
        where: { id: InvId },
        data: { status: "failed", paymentStatus: "failed" },
      }).catch((e) => console.error("Failed to update order status:", e));
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("Paypalich webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Paypalich webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
