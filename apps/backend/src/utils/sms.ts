/**
 * SMS OTP delivery utility.
 *
 * Provider is selected by the SMS_PROVIDER environment variable:
 *   twilio    → Twilio Messages API  (needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 *   msg91     → MSG91 OTP API v5     (needs MSG91_AUTHKEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID)
 *   fast2sms  → Fast2SMS bulk OTP    (needs FAST2SMS_API_KEY)
 *   2factor   → 2Factor.in OTP API   (needs TWOFACTOR_API_KEY) — 1000 free OTPs/month, no DLT needed
 *
 * When SMS_PROVIDER is absent (local dev / CI), the OTP is only printed to
 * the console and the call succeeds — no SMS is sent.
 */

export type SmsResult = { success: boolean; error?: string };

export async function sendOtpSms(phoneNumber: string, otp: string): Promise<SmsResult> {
  const provider = (process.env.SMS_PROVIDER ?? '').toLowerCase();

  try {
    if (provider === 'twilio')    return await sendViaTwilio(phoneNumber, otp);
    if (provider === 'msg91')     return await sendViaMSG91(phoneNumber, otp);
    if (provider === '2factor')   return await sendVia2Factor(phoneNumber, otp);
    if (provider === 'fast2sms')  return await sendViaFast2SMS(phoneNumber, otp);

    // No provider configured — dev / test mode
    console.log(`[SMS-dev] OTP ${otp} → ${phoneNumber}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS:${provider || 'dev'}] Uncaught error:`, msg);
    return { success: false, error: msg };
  }
}

// ── Twilio Messages API ───────────────────────────────────────────────────────
// Sign up at https://twilio.com — get a trial phone number and fill in:
//   TWILIO_ACCOUNT_SID  (starts with AC…)
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER (your Twilio number, e.g. +12015551234)
async function sendViaTwilio(to: string, otp: string): Promise<SmsResult> {
  const sid   = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from  = process.env.TWILIO_PHONE_NUMBER!;

  const creds = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To:   to,
        From: from,
        Body: `${otp} is your BrokerSaab OTP. Valid for 5 minutes. Do not share with anyone.`,
      }),
    },
  );

  if (!res.ok) {
    const d = await res.json() as { message?: string };
    return { success: false, error: d.message ?? `Twilio HTTP ${res.status}` };
  }
  return { success: true };
}

// ── MSG91 OTP API v5 ──────────────────────────────────────────────────────────
// Sign up at https://msg91.com — complete DLT registration, create an OTP
// template, and fill in:
//   MSG91_AUTHKEY      (your API auth key)
//   MSG91_TEMPLATE_ID  (DLT-approved OTP template ID)
//   MSG91_SENDER_ID    (6-char sender ID, e.g. BRKRSB)
async function sendViaMSG91(to: string, otp: string): Promise<SmsResult> {
  const authkey    = process.env.MSG91_AUTHKEY!;
  const templateId = process.env.MSG91_TEMPLATE_ID!;
  const senderId   = process.env.MSG91_SENDER_ID ?? 'BRKRSB';

  // MSG91 expects mobile without leading '+'
  const mobile = to.replace(/^\+/, '');

  const params = new URLSearchParams({
    authkey,
    mobile,
    otp,
    template_id: templateId,
    sender:      senderId,
  });

  const res  = await fetch(`https://api.msg91.com/api/v5/otp?${params.toString()}`);
  const data = await res.json() as { type?: string; message?: string };

  if (data.type === 'success') return { success: true };
  return { success: false, error: data.message ?? 'MSG91 error' };
}

// ── Fast2SMS ──────────────────────────────────────────────────────────────────
// Sign up at https://www.fast2sms.com — get free credits on signup, fill in:
//   FAST2SMS_API_KEY  (your API key from dashboard)
// Uses route 'q' (Quick SMS) — sends plain SMS, no DLT registration required,
// no voice call fallback. The 'otp' route triggers Voice OTP when DLT is absent.
async function sendViaFast2SMS(to: string, otp: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY!;
  // Fast2SMS needs 10-digit Indian mobile (no country code)
  const mobile = to.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '').slice(-10);

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method:  'POST',
    headers: {
      authorization:  apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route:    'q',
      message:  `${otp} is your BrokerSaab OTP. Valid for 5 minutes. Do not share with anyone.`,
      language: 'english',
      flash:    0,
      numbers:  mobile,
    }),
  });

  const data = await res.json() as { return?: boolean; message?: string[] };
  if (data.return) return { success: true };
  return { success: false, error: data.message?.[0] ?? 'Fast2SMS error' };
}

// ── 2Factor.in ────────────────────────────────────────────────────────────────
// Sign up at https://2factor.in — free plan: 1000 OTPs/month, no DLT needed.
//   TWOFACTOR_API_KEY  (API key from 2factor.in dashboard)
async function sendVia2Factor(to: string, otp: string): Promise<SmsResult> {
  const apiKey = process.env.TWOFACTOR_API_KEY!;
  // 2Factor needs 10-digit Indian mobile (no country code)
  const mobile = to.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '').slice(-10);

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${otp}/OTP1`;
  const res  = await fetch(url);
  const data = await res.json() as { Status?: string; Details?: string };

  if (data.Status === 'Success') return { success: true };
  return { success: false, error: data.Details ?? '2Factor error' };
}
