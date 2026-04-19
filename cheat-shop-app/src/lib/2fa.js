import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate 2FA secret for admin
 */
export function generate2FASecret(adminLogin) {
  const secret = speakeasy.generateSecret({
    name: `AtomCheats Admin (${adminLogin})`,
    issuer: 'AtomCheats',
    length: 32
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url
  };
}

/**
 * Generate QR code for 2FA setup
 */
export async function generateQRCode(otpauthUrl) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataURL;
  } catch (error) {
    console.error('[2FA] QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  });
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}