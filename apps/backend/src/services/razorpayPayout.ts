/**
 * RazorpayX Payouts integration — three-step flow:
 *   1. POST /v1/contacts             → get/create contact_id for the recipient
 *   2. POST /v1/fund_accounts        → get/create fund_account_id (bank details)
 *   3. POST /v1/payouts              → initiate IMPS/NEFT transfer
 *
 * Used for both advisor earnings payouts and client wallet-balance withdrawals —
 * the recipient can be either an Advisor or a User (client), distinguished by
 * `PayoutRecipient.recipientType`.
 *
 * Auth  : HTTP Basic (key_id:key_secret) — same credentials as standard Razorpay.
 * Idempotency: X-Payout-Idempotency header prevents duplicate transfers on retry.
 *
 * Env vars required:
 *   RAZORPAY_KEY_ID            — your Razorpay key id
 *   RAZORPAY_KEY_SECRET        — your Razorpay key secret
 *   RAZORPAY_X_ACCOUNT_NUMBER  — BrokerSaab's RazorpayX current-account number
 *   DUMMY_PAYOUTS=true         — skip real API calls (dev/staging)
 */

import https from 'https';
import prisma from '../config/db';

// ── Raw HTTPS client ───────────────────────────────────────────────────────────

function rzpX<T>(
  method: 'POST' | 'GET' | 'PATCH',
  path:   string,
  body?:  Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const auth    = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const payload = body ? JSON.stringify(body) : undefined;

    const options: https.RequestOptions = {
      hostname: 'api.razorpay.com',
      port:     443,
      path:     `/v1${path}`,
      method,
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': String(Buffer.byteLength(payload)) } : {}),
        ...extraHeaders,
      },
    };

    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        let parsed: any;
        try { parsed = JSON.parse(raw); } catch { reject(new Error(`RazorpayX: unparseable response — ${raw}`)); return; }

        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) {
          resolve(parsed as T);
        } else {
          const desc = parsed?.error?.description ?? parsed?.error?.code ?? raw;
          reject(new Error(`RazorpayX ${method} ${path} → HTTP ${status}: ${desc}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type RecipientType = 'ADVISOR' | 'CLIENT';

export interface PayoutRecipient {
  recipientType:          RecipientType;
  recipientId:            string;   // Advisor.id or User.id
  fullName:               string;
  email:                  string;
  phoneNumber:            string;
  bankAccountNumber:      string;
  bankIfsc:               string;
  bankAccountHolder:      string;
  razorpayContactId?:     string | null;
  razorpayFundAccountId?: string | null;
}

// RazorpayX payout lifecycle: queued → pending → processing → processed | rejected | reversed | cancelled
export type RzpPayoutStatus = 'queued' | 'pending' | 'processing' | 'processed' | 'rejected' | 'reversed' | 'cancelled';

export interface PayoutInitResult {
  success:          boolean;
  razorpayPayoutId?: string;
  rzpStatus?:       RzpPayoutStatus;
  utr?:             string;
  mode?:            string;
  error?:           string;
}

// ── Persist Razorpay contact/fund-account ids back onto the recipient row ──────

async function persistRazorpayIds(
  recipient: PayoutRecipient,
  ids: { razorpayContactId?: string; razorpayFundAccountId?: string },
): Promise<void> {
  if (recipient.recipientType === 'ADVISOR') {
    await prisma.advisor.update({ where: { id: recipient.recipientId }, data: ids });
  } else {
    await prisma.user.update({ where: { id: recipient.recipientId }, data: ids });
  }
}

// ── Step 1: Contact ────────────────────────────────────────────────────────────

async function ensureContact(recipient: PayoutRecipient): Promise<string> {
  if (recipient.razorpayContactId) {
    console.log(`[RzpX] Reusing contact ${recipient.razorpayContactId} for ${recipient.recipientType.toLowerCase()} ${recipient.recipientId}`);
    return recipient.razorpayContactId;
  }

  const phone = recipient.phoneNumber.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

  const contact = await rzpX<{ id: string }>('POST', '/contacts', {
    name:    recipient.bankAccountHolder || recipient.fullName,
    email:   recipient.email,
    contact: phone,
    type:    recipient.recipientType === 'ADVISOR' ? 'vendor' : 'customer',
    notes:   { recipientId: recipient.recipientId, recipientType: recipient.recipientType, platform: 'BrokerSaab' },
  });

  console.log(`[RzpX] Created contact ${contact.id} for ${recipient.recipientType.toLowerCase()} ${recipient.recipientId}`);

  // Persist so we never create duplicates
  await persistRazorpayIds(recipient, { razorpayContactId: contact.id });

  return contact.id;
}

// ── Step 2: Fund Account ───────────────────────────────────────────────────────

async function ensureFundAccount(contactId: string, recipient: PayoutRecipient): Promise<string> {
  if (recipient.razorpayFundAccountId) {
    console.log(`[RzpX] Reusing fund_account ${recipient.razorpayFundAccountId} for ${recipient.recipientType.toLowerCase()} ${recipient.recipientId}`);
    return recipient.razorpayFundAccountId;
  }

  const fa = await rzpX<{ id: string }>('POST', '/fund_accounts', {
    contact_id:   contactId,
    account_type: 'bank_account',
    bank_account: {
      name:           recipient.bankAccountHolder || recipient.fullName,
      ifsc:           recipient.bankIfsc.toUpperCase(),
      account_number: recipient.bankAccountNumber,
    },
  });

  console.log(`[RzpX] Created fund_account ${fa.id} for ${recipient.recipientType.toLowerCase()} ${recipient.recipientId}`);

  await persistRazorpayIds(recipient, { razorpayFundAccountId: fa.id });

  return fa.id;
}

// ── Step 3: Payout ─────────────────────────────────────────────────────────────

interface RzpPayoutResponse {
  id:           string;
  status:       RzpPayoutStatus;
  utr?:         string;
  mode:         string;
  reference_id: string;
}

async function createPayout(
  fundAccountId:  string,
  amountPaise:    number,
  idempotencyKey: string,
  mode:           'IMPS' | 'NEFT' | 'RTGS' = 'IMPS',
): Promise<RzpPayoutResponse> {
  const xAccount = process.env.RAZORPAY_X_ACCOUNT_NUMBER;
  if (!xAccount) throw new Error('RAZORPAY_X_ACCOUNT_NUMBER env var is not set');

  console.log(`[RzpX] Creating payout — fund_account=${fundAccountId} amount_paise=${amountPaise} idempotency=${idempotencyKey}`);

  return rzpX<RzpPayoutResponse>(
    'POST',
    '/payouts',
    {
      account_number:       xAccount,
      fund_account_id:      fundAccountId,
      amount:               amountPaise,
      currency:             'INR',
      mode,
      purpose:              'payout',
      queue_if_low_balance: true,
      reference_id:         idempotencyKey,
      narration:            `BrokerSaab-${idempotencyKey}`,
    },
    {
      // Prevents duplicate transfers if the request is retried due to network issues
      'X-Payout-Idempotency': idempotencyKey,
    },
  );
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Full RazorpayX payout flow: Contact → Fund Account → Payout.
 *
 * `idempotencyKey` must be unique per payout *event* (not per ticket/recipient) —
 * callers should pass something like `payout_<PayoutRow.id>` or
 * `withdrawal_<ClientWithdrawalRow.id>`, so that two different partial releases
 * for the same ticket (or two different withdrawals for the same client) never
 * collide at Razorpay's idempotency layer.
 *
 * Set DUMMY_PAYOUTS=true in env to short-circuit for dev/staging.
 */
export async function initiatePayout(
  recipient:      PayoutRecipient,
  amountPaise:    number,
  idempotencyKey: string,
): Promise<PayoutInitResult> {
  if (process.env.DUMMY_PAYOUTS === 'true') {
    const dummyId = `dummy_payout_${idempotencyKey}_${Date.now()}`;
    console.log(`[RzpX] DUMMY mode — skipping real transfer. id=${dummyId}`);
    return {
      success:          true,
      razorpayPayoutId: dummyId,
      rzpStatus:        'queued',
      mode:             'DUMMY',
    };
  }

  try {
    const contactId     = await ensureContact(recipient);
    const fundAccountId = await ensureFundAccount(contactId, recipient);
    const payout        = await createPayout(fundAccountId, amountPaise, idempotencyKey);

    console.log(`[RzpX] Payout initiated — id=${payout.id} status=${payout.status} utr=${payout.utr ?? 'pending'}`);

    return {
      success:          true,
      razorpayPayoutId: payout.id,
      rzpStatus:        payout.status,
      utr:              payout.utr,
      mode:             payout.mode,
    };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error(`[RzpX] Payout failed for ${idempotencyKey}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Maps RazorpayX payout status to our TransactionStatus.
 * Pending/in-flight states remain PENDING until webhook confirms settlement.
 */
export function mapRzpStatus(rzpStatus?: RzpPayoutStatus): 'PENDING' | 'SUCCESS' | 'FAILED' {
  if (!rzpStatus) return 'FAILED';
  if (rzpStatus === 'processed')                                       return 'SUCCESS';
  if (rzpStatus === 'rejected' || rzpStatus === 'reversed' || rzpStatus === 'cancelled') return 'FAILED';
  return 'PENDING'; // queued | pending | processing
}
