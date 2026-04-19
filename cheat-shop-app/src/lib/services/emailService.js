import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  initTransporter() {
    if (this.transporter) {
      return; // Already initialized
    }

    try {
      console.log('[EMAIL] Initializing SMTP with config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        secure: process.env.SMTP_SECURE === 'true'
      });

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // false for TLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      console.log('[EMAIL] SMTP transporter initialized');
    } catch (error) {
      console.error('[EMAIL] Failed to initialize SMTP transporter:', error);
    }
  }

  async sendOrderCompletedEmail(orderData) {
    this.initTransporter(); // Ensure transporter is initialized
    
    if (!this.transporter) {
      console.error('[EMAIL] SMTP transporter not initialized');
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      const { email, orderId, productName, keys, totalAmount, currency } = orderData;

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Order #${orderId} - Your purchase is ready!`,
        html: this.generateOrderEmailTemplate(orderData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('[EMAIL] Order completion email sent:', {
        orderId,
        email,
        messageId: result.messageId
      });

      return { 
        success: true, 
        messageId: result.messageId 
      };

    } catch (error) {
      console.error('[EMAIL] Failed to send order completion email:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  generateOrderEmailTemplate(orderData) {
    const { orderId, productName, keys, totalAmount, currency, email } = orderData;
    
    // Format keys for display
    const keysList = Array.isArray(keys) ? keys : [keys];
    const keysHtml = keysList.map(key => `<li style="margin: 5px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; font-family: monospace;">${key}</li>`).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Completed - AtomCheats</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          
          <!-- Header -->
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9;">
            <h1 style="color: #0ea5e9; margin: 0; font-size: 28px;">AtomCheats</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Premium Gaming Solutions</p>
          </div>

          <!-- Order Success -->
          <div style="padding: 30px 0; text-align: center;">
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">✅ Order Completed!</h2>
            </div>
            <p style="font-size: 16px; color: #333; margin: 0;">Your purchase has been processed successfully.</p>
          </div>

          <!-- Order Details -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Order ID:</td>
                <td style="padding: 8px 0; color: #333;">#${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Product:</td>
                <td style="padding: 8px 0; color: #333;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; color: #333;">${totalAmount} ${currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${email}</td>
              </tr>
            </table>
          </div>

          <!-- Product Keys -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">🔑 Your Product Keys</h3>
            <p style="color: #856404; margin: 0 0 10px 0; font-size: 14px;">Please save these keys in a secure location:</p>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${keysHtml}
            </ul>
          </div>

          <!-- Instructions -->
          <div style="background: #e3f2fd; border: 1px solid #90caf9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 18px;">📋 Next Steps</h3>
            <ol style="color: #1565c0; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Download and install the product using the keys above</li>
              <li style="margin: 8px 0;">Follow the setup instructions provided with your purchase</li>
              <li style="margin: 8px 0;">Contact support if you need any assistance</li>
            </ol>
          </div>

          <!-- Support -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e5e5; margin-top: 30px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">Need Help?</h3>
            <p style="color: #666; margin: 0 0 15px 0;">Our support team is here to help you 24/7</p>
            <div style="margin: 15px 0;">
              <a href="https://atomcheats.com/support" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">Contact Support</a>
              <a href="https://atomcheats.com/faq" style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">View FAQ</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px 0; color: #666; font-size: 12px; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0;">© 2024 AtomCheats. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This email was sent to ${email}</p>
          </div>

        </div>
      </body>
      </html>
    `;
  }

  async testConnection() {
    this.initTransporter(); // Ensure transporter is initialized
    
    if (!this.transporter) {
      return { success: false, error: 'SMTP transporter not initialized' };
    }

    try {
      await this.transporter.verify();
      console.log('[EMAIL] SMTP connection test successful');
      return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
      console.error('[EMAIL] SMTP connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;