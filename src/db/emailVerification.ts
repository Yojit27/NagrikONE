import crypto from 'crypto';
import { db } from './index.ts';
import { emailVerifications } from './schema.ts';
import { eq } from 'drizzle-orm';

const SALT = process.env.APPLET_ID || 'nagrik-one-secure-salt-2026';
const EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

// In-memory fallback cache for fast lookups and high-resilience
interface CachedVerification {
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  verified: number;
  verifiedAt: Date | null;
  lastSentAt: Date;
  sendCountThisHour: number;
  hourWindowStart: Date;
}

const memoryStore = new Map<string, CachedVerification>();

/**
 * Computes SHA-256 hash of verification code with server salt.
 */
function hashCode(code: string, email: string): string {
  return crypto
    .createHash('sha256')
    .update(`${code.trim()}:${email.toLowerCase().trim()}:${SALT}`)
    .digest('hex');
}

/**
 * Constant-time hash comparison to prevent timing attacks.
 */
function safeCompareHashes(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure 6-digit random code.
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Records a new verification code request.
 * Enforces:
 * 1. 60-second resend cooldown.
 * 2. Max 5 send requests per hour.
 * 3. Invalidation of previous codes.
 * 4. Storing SHA-256 hash in PostgreSQL email_verifications table.
 */
export async function createVerificationAttempt(email: string, code: string): Promise<{
  success: boolean;
  cooldownRemaining?: number;
  error?: string;
}> {
  const cleanEmail = email.toLowerCase().trim();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_MINUTES * 60 * 1000);
  const codeHash = hashCode(code, cleanEmail);

  // Check rate limit and cooldown from memory store first
  const cached = memoryStore.get(cleanEmail);
  if (cached) {
    const diffSeconds = Math.floor((now.getTime() - cached.lastSentAt.getTime()) / 1000);
    if (diffSeconds < RESEND_COOLDOWN_SECONDS) {
      const remaining = RESEND_COOLDOWN_SECONDS - diffSeconds;
      return {
        success: false,
        cooldownRemaining: remaining,
        error: `Please wait ${remaining} seconds before requesting a new code.`,
      };
    }

    // Check hourly send quota (max 5 per hour)
    const hourDiff = (now.getTime() - cached.hourWindowStart.getTime()) / (60 * 60 * 1000);
    if (hourDiff < 1) {
      if (cached.sendCountThisHour >= 5) {
        return {
          success: false,
          error: 'Rate limit reached. Maximum 5 verification codes per hour. Please try again later.',
        };
      }
      cached.sendCountThisHour += 1;
    } else {
      cached.sendCountThisHour = 1;
      cached.hourWindowStart = now;
    }

    // Overwrite previous code (immediately invalidating it)
    cached.codeHash = codeHash;
    cached.attempts = 0;
    cached.expiresAt = expiresAt;
    cached.lastSentAt = now;
    // Note: Do not revert verified status if they are already verified, unless explicitly re-verifying
  } else {
    memoryStore.set(cleanEmail, {
      email: cleanEmail,
      codeHash,
      attempts: 0,
      expiresAt,
      verified: 0,
      verifiedAt: null,
      lastSentAt: now,
      sendCountThisHour: 1,
      hourWindowStart: now,
    });
  }

  // Persist to Cloud SQL PostgreSQL email_verifications table
  try {
    const existing = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(emailVerifications)
        .set({
          codeHash,
          attempts: 0,
          expiresAt,
          lastSentAt: now,
        })
        .where(eq(emailVerifications.email, cleanEmail));
    } else {
      await db.insert(emailVerifications).values({
        email: cleanEmail,
        codeHash,
        attempts: 0,
        expiresAt,
        verified: 0,
        lastSentAt: now,
      });
    }
  } catch (err) {
    console.warn('Cloud SQL email_verifications update warning (memory fallback active):', err);
  }

  return { success: true };
}

/**
 * Validates a submitted verification code.
 * Enforces:
 * 1. Code matches SHA-256 hash.
 * 2. Code has not expired.
 * 3. Max attempts not exceeded (anti-brute-force).
 * 4. Invalidates code upon successful validation.
 * 5. Marks verified in database and memory.
 */
export async function verifySubmittedCode(email: string, inputCode: string): Promise<{
  success: boolean;
  verified: boolean;
  message: string;
  verifiedCitizenId?: string;
  remainingAttempts?: number;
}> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = inputCode.trim();
  const now = new Date();

  // Basic format check
  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      verified: false,
      message: 'Please enter a valid 6-digit numeric verification code.',
    };
  }

  // 1. Fetch record from Cloud SQL or Memory
  let record: {
    codeHash: string;
    attempts: number;
    expiresAt: Date;
    verified: number;
  } | null = null;

  try {
    const dbRows = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, cleanEmail))
      .limit(1);

    if (dbRows.length > 0) {
      const r = dbRows[0];
      record = {
        codeHash: r.codeHash,
        attempts: r.attempts,
        expiresAt: new Date(r.expiresAt),
        verified: r.verified,
      };
    }
  } catch (err) {
    console.warn('Cloud SQL query warning during verify, checking memory cache:', err);
  }

  // Check memory store if DB had no record
  if (!record) {
    const mem = memoryStore.get(cleanEmail);
    if (mem) {
      record = {
        codeHash: mem.codeHash,
        attempts: mem.attempts,
        expiresAt: mem.expiresAt,
        verified: mem.verified,
      };
    }
  }

  if (!record || !record.codeHash) {
    return {
      success: false,
      verified: false,
      message: 'No active verification code found for this email. Please request a new code.',
    };
  }

  // Check if code has expired
  if (now.getTime() > record.expiresAt.getTime()) {
    return {
      success: false,
      verified: false,
      message: 'Invalid or expired code. Please request a new verification code.',
    };
  }

  // Check brute force attempts
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      success: false,
      verified: false,
      message: 'Maximum verification attempts exceeded. Code has been invalidated. Please request a new code.',
    };
  }

  // Verify hash
  const inputHash = hashCode(cleanCode, cleanEmail);
  const isMatch = safeCompareHashes(record.codeHash, inputHash);

  if (!isMatch) {
    const newAttempts = record.attempts + 1;
    const remaining = Math.max(0, MAX_VERIFY_ATTEMPTS - newAttempts);

    // Update attempts in DB & memory
    try {
      await db
        .update(emailVerifications)
        .set({ attempts: newAttempts })
        .where(eq(emailVerifications.email, cleanEmail));
    } catch {}

    const mem = memoryStore.get(cleanEmail);
    if (mem) mem.attempts = newAttempts;

    if (remaining === 0) {
      return {
        success: false,
        verified: false,
        message: 'Invalid code. Maximum attempts reached. This code is now invalid. Please request a new code.',
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      verified: false,
      message: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Verification succeeded!
  // Invalidate code hash so it cannot be used again
  const citizenId = `CITIZEN-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    await db
      .update(emailVerifications)
      .set({
        verified: 1,
        verifiedAt: now,
        codeHash: 'USED', // Code invalidated
        attempts: 0,
      })
      .where(eq(emailVerifications.email, cleanEmail));
  } catch (err) {
    console.warn('Cloud SQL mark verified warning:', err);
  }

  const mem = memoryStore.get(cleanEmail);
  if (mem) {
    mem.verified = 1;
    mem.verifiedAt = now;
    mem.codeHash = 'USED';
    mem.attempts = 0;
  }

  return {
    success: true,
    verified: true,
    verifiedCitizenId: citizenId,
    message: 'Email verified successfully.',
  };
}

/**
 * Checks whether an email address is currently verified.
 */
export async function checkEmailVerified(email: string): Promise<{
  verified: boolean;
  email: string;
  verifiedAt: string | null;
}> {
  const cleanEmail = email.toLowerCase().trim();

  // Try DB
  try {
    const dbRows = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, cleanEmail))
      .limit(1);

    if (dbRows.length > 0 && dbRows[0].verified === 1) {
      return {
        verified: true,
        email: cleanEmail,
        verifiedAt: dbRows[0].verifiedAt ? dbRows[0].verifiedAt.toISOString() : null,
      };
    }
  } catch (err) {
    console.warn('DB checkEmailVerified fallback to memory:', err);
  }

  // Try memory
  const mem = memoryStore.get(cleanEmail);
  if (mem && mem.verified === 1) {
    return {
      verified: true,
      email: cleanEmail,
      verifiedAt: mem.verifiedAt ? mem.verifiedAt.toISOString() : null,
    };
  }

  return {
    verified: false,
    email: cleanEmail,
    verifiedAt: null,
  };
}
