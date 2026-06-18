/**
 * Redis-backed OTP store with transparent in-memory fallback.
 *
 * When REDIS_URL is set and reachable the OTPs survive server restarts and
 * work across multiple instances. When Redis is unavailable (local dev, no
 * env var, or connection failure) the module falls back to an in-memory Map
 * so nothing breaks — it just isn't restart-proof.
 */

import { createClient, RedisClientType } from 'redis';

// ── In-memory fallback ────────────────────────────────────────────────────────
const mem = new Map<string, { v: string; exp: number }>();

// ── Redis client ──────────────────────────────────────────────────────────────
let redisReady = false;
let client: RedisClientType | null = null;

if (process.env.REDIS_URL) {
  client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;

  client.on('error', (err: Error) => {
    // Demote to fallback on any connection error — don't crash the server
    if (redisReady) {
      console.warn('[Redis] Connection error, falling back to in-memory OTP store:', err.message);
      redisReady = false;
    }
  });

  client.on('ready', () => {
    redisReady = true;
    console.log('[Redis] Connected — OTP store is Redis-backed');
  });

  client.connect().catch((err: Error) => {
    console.warn('[Redis] Could not connect, OTPs will use in-memory fallback:', err.message);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function otpSet(phone: string, otp: string, ttlSec: number): Promise<void> {
  if (redisReady && client) {
    await client.setEx(`otp:${phone}`, ttlSec, otp);
    return;
  }
  mem.set(phone, { v: otp, exp: Date.now() + ttlSec * 1000 });
}

export async function otpGet(phone: string): Promise<string | null> {
  if (redisReady && client) {
    return client.get(`otp:${phone}`);
  }
  const entry = mem.get(phone);
  if (!entry) return null;
  if (entry.exp < Date.now()) { mem.delete(phone); return null; }
  return entry.v;
}

export async function otpDel(phone: string): Promise<void> {
  if (redisReady && client) {
    await client.del(`otp:${phone}`);
    return;
  }
  mem.delete(phone);
}
