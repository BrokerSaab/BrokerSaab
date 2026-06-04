import crypto from 'crypto';

const SALT = process.env.AADHAAR_HASH_SALT || 'brokersaab_aadhaar_dev_salt_change_in_prod';

export function validateAadhaar(num: string): boolean {
  return /^[2-9][0-9]{11}$/.test(num.replace(/\D/g, ''));
}

export function maskAadhaar(num: string): string {
  const d = num.replace(/\D/g, '');
  return `XXXX-XXXX-${d.slice(-4)}`;
}

export function hashAadhaar(num: string): string {
  return crypto
    .createHmac('sha256', SALT)
    .update(num.replace(/\D/g, ''))
    .digest('hex');
}
