/**
 * RazorpayX Payouts integration — three-step flow:
 *   1. POST /v1/contacts             → get/create contact_id for advisor
 *   2. POST /v1/fund_accounts        → get/create fund_account_id (bank details)
 *   3. POST /v1/payouts              → initiate IMPS/NEFT transfer
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

export interface AdvisorBankProfile {
  advisorId:             string;
  fullName:              string;
  email:                 string;
  phoneNumber:           string;
  bankAccountNumber:     string;
  bankIfsc:              string;
  bankAccountHolder:     string;
  razorpayContactId?:    string | null;
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

// ── Step 1: Contact ────────────────────────────────────────────────────────────

async function ensureContact(advisor: AdvisorBankProfile): Promise<string> {
  if (advisor.razorpayContactId) {
    console.log(`[RzpX] Reusing contact ${advisor.razorpayContactId} for advisor ${advisor.advisorId}`);
    return advisor.razorpayContactId;
  }

  const phone = advisor.phoneNumber.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

  const contact = await rzpX<{ id: string }>('POST', '/contacts', {
    name:    advisor.bankAccountHolder || advisor.fullName,
    email:   advisor.email,
    contact: phone,
    type:    'vendor',
    notes:   { advisorId: advisor.advisorId, platform: 'BrokerSaab' },
  });

  console.log(`[RzpX] Created contact ${contact.id} for advisor ${advisor.advisorId}`);

  // Persist so we never create duplicates
  await prisma.advisor.update({
    where: { id: advisor.advisorId },
    data:  { razorpayContactId: contact.id },
  });

  return contact.id;
}

// ── Step 2: Fund Account ───────────────────────────────────────────────────────

async function ensureFundAccount(contactId: string, advisor: AdvisorBankProfile): Promise<string> {
  if (advisor.razorpayFundAccountId) {
    console.log(`[RzpX] Reusing fund_account ${advisor.razorpayFundAccountId} for advisor ${advisor.advisorId}`);
    return advisor.razorpayFundAccountId;
  }

  const fa = await rzpX<{ id: string }>('POST', '/fund_accounts', {
    contact_id:   contactId,
    account_type: 'bank_account',
    bank_account: {
      name:           advisor.bankAccountHolder || advisor.fullName,
      ifsc:           advisor.bankIfsc.toUpperCase(),
      account_number: advisor.bankAccountNumber,
    },
  });

  console.log(`[RzpX] Created fund_account ${fa.id} for advisor ${advisor.advisorId}`);

  await prisma.advisor.update({
    where: { id: advisor.advisorId },
    data:  { razorpayFundAccountId: fa.id },
  });

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
 * `ticketId` is used as the idempotency key (`payout_ticket_<id>`) so that
 * retries always produce the same payout — no duplicate transfers.
 *
 * Set DUMMY_PAYOUTS=true in env to short-circuit for dev/staging.
 */
export async function initiatePayout(
  advisor:     AdvisorBankProfile,
  amountPaise: number,
  ticketId:    string,
): Promise<PayoutInitResult> {
  const idempotencyKey = `payout_ticket_${ticketId}`;

  if (process.env.DUMMY_PAYOUTS === 'true') {
    const dummyId = `dummy_payout_${ticketId}_${Date.now()}`;
    console.log(`[RzpX] DUMMY mode — skipping real transfer. id=${dummyId}`);
    return {
      success:          true,
      razorpayPayoutId: dummyId,
      rzpStatus:        'queued',
      mode:             'DUMMY',
    };
  }

  try {
    const contactId     = await ensureContact(advisor);
    const fundAccountId = await ensureFundAccount(contactId, advisor);
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
    console.error(`[RzpX] Payout failed for ticket ${ticketId}:`, message);
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
