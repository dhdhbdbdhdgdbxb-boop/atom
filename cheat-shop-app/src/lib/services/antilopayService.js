import crypto from 'crypto';

const ANTILOPAY_API_URL = 'https://lk.antilopay.com/api/v1';

/**
 * Создать подпись запроса для Antilopay
 * Алгоритм: RSA-SHA256 с приватным ключом PKCS8
 */
function createSignature(bodyString, secretKey) {
  // Ключ приходит в base64 PKCS8 формате — оборачиваем в PEM если нужно
  let pemKey = secretKey;
  if (!secretKey.includes('-----BEGIN')) {
    pemKey = `-----BEGIN PRIVATE KEY-----\n${secretKey.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
  }
  return crypto
    .createSign('RSA-SHA256')
    .update(bodyString)
    .sign(pemKey, 'base64');
}

/**
 * Создать платёж через Antilopay API
 */
export async function createAntilopayPayment({
  orderId,
  amount,
  productName,
  email,
  successUrl,
  failUrl,
  preferMethods = null,
  merchantExtra = null
}) {
  const secretId = process.env.ANTILOPAY_SECRET_ID;
  const secretKey = process.env.ANTILOPAY_SECRET_KEY;
  const projectId = process.env.ANTILOPAY_PROJECT_ID;
  const signVersion = process.env.ANTILOPAY_SIGN_VERSION || '1';

  if (!secretId || !secretKey || !projectId) {
    throw new Error('Antilopay не настроен: отсутствуют ANTILOPAY_SECRET_ID, ANTILOPAY_SECRET_KEY или ANTILOPAY_PROJECT_ID');
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atomcheats.com';

  const payload = {
    project_identificator: projectId,
    amount: parseFloat(amount),
    order_id: orderId.toString().substring(0, 100),
    currency: 'RUB',
    product_name: productName.substring(0, 255),
    product_type: 'goods',
    description: productName.substring(0, 255),
    customer: {
      email: email
    },
    success_url: successUrl || `${baseUrl}/payment/success`,
    fail_url: failUrl || `${baseUrl}/payment/fail`
  };

  if (preferMethods) {
    payload.prefer_methods = preferMethods;
  }

  if (merchantExtra) {
    payload.merchant_extra = merchantExtra.substring(0, 255);
  }

  const bodyString = JSON.stringify(payload);
  const signature = createSignature(bodyString, secretKey);

  const response = await fetch(`${ANTILOPAY_API_URL}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Apay-Secret-Id': secretId,
      'X-Apay-Sign': signature,
      'X-Apay-Sign-Version': signVersion
    },
    body: bodyString
  });

  const data = await response.json();

  console.log('Antilopay create payment response:', JSON.stringify(data, null, 2));

  if (data.code !== 0) {
    throw new Error(`Antilopay error ${data.code}: ${data.error || 'Unknown error'}`);
  }

  return {
    success: true,
    paymentId: data.payment_id,
    paymentUrl: data.payment_url
  };
}

/**
 * Верификация подписи входящего вебхука от Antilopay (RSA-SHA256 публичным ключом)
 * Если публичный ключ не задан — пропускаем верификацию
 */
export function verifyAntilopayWebhook(bodyString, signature) {
  try {
    const publicKey = process.env.ANTILOPAY_PUBLIC_KEY;
    if (!publicKey) return true; // пропускаем если ключ не задан

    let pemKey = publicKey;
    if (!publicKey.includes('-----BEGIN')) {
      pemKey = `-----BEGIN PUBLIC KEY-----\n${publicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
    }

    return crypto
      .createVerify('RSA-SHA256')
      .update(bodyString)
      .verify(pemKey, signature, 'base64');
  } catch (error) {
    console.error('Antilopay webhook signature verification error:', error);
    return false;
  }
}
