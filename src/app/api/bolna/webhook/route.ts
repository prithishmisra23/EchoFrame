import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * POST /api/bolna/webhook?token=<BOLNA_WEBHOOK_SECRET>
 *
 * Security scheme (documented limitations noted below):
 *   1. Secret token in query string — compared in constant time via timingSafeEqual.
 *   2. IP allowlist — Bolna server IP 13.203.39.153, plus x-forwarded-for check.
 *      NOTE: On Vercel's Edge Network, the direct client IP is always Vercel's proxy;
 *      x-forwarded-for is Bolna's actual IP. Both are checked. In future, configure
 *      Vercel Trusted Proxies or use Bolna's IP allowlist feature.
 *   3. Idempotency — bolna_execution_id deduplication in-memory (resets on cold start).
 *      For production, store processed IDs in Supabase or Redis.
 *
 * LIMITATIONS (honest documentation per project guidelines):
 *   - In-memory idempotency store is lost on cold start / redeployment.
 *   - x-forwarded-for can be spoofed if the deployment proxy isn't trusted.
 *   - Bolna does not document a HMAC signature scheme; if they add one, use it instead.
 */

// Bolna's documented outbound IP
const BOLNA_ALLOWED_IPS = new Set([
  '13.203.39.153',
  // Add additional IPs here if Bolna expands their server pool
]);

// In-memory idempotency set — prevents double-processing same execution
const processedExecutionIds = new Set<string>();
const MAX_IDEMPOTENCY_CACHE = 5000; // prevent unbounded growth

function isAllowedIp(req: NextRequest): boolean {
  // On Vercel, real client IP is in x-forwarded-for (last hop)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  const ipCandidates: string[] = [];

  if (forwarded) {
    // x-forwarded-for: client, proxy1, proxy2 — first entry is originating IP
    const parts = forwarded.split(',').map((s) => s.trim());
    ipCandidates.push(...parts);
  }
  if (realIp) ipCandidates.push(realIp.trim());

  // Check if BOLNA_IP_CHECK is disabled (for local dev)
  if (process.env.BOLNA_SKIP_IP_CHECK === 'true') {
    return true;
  }

  return ipCandidates.some((ip) => BOLNA_ALLOWED_IPS.has(ip));
}

function constantTimeTokenMatch(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // --- 1. Secret token check ---
  const expectedToken = process.env.BOLNA_WEBHOOK_SECRET || '';
  if (!expectedToken) {
    // No secret configured — reject to prevent misconfigured deployments from accepting noise
    console.error('[bolna-webhook] BOLNA_WEBHOOK_SECRET is not set. Rejecting all webhook requests.');
    return NextResponse.json(
      { error: 'Webhook not configured on this server.' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const providedToken = searchParams.get('token') || '';

  if (!constantTimeTokenMatch(expectedToken, providedToken)) {
    console.warn('[bolna-webhook] Invalid token in webhook request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- 2. IP allowlist check ---
  if (!isAllowedIp(req)) {
    const forwarded = req.headers.get('x-forwarded-for') || 'unknown';
    console.warn(`[bolna-webhook] Blocked request from IP: ${forwarded}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // --- 3. Parse body ---
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const executionId: string | undefined = body?.execution_id || body?.bolna_execution_id;
  const callStatus: string | undefined = body?.status;

  console.log('[bolna-webhook] Received:', { executionId, callStatus });

  // --- 4. Idempotency check ---
  if (executionId) {
    if (processedExecutionIds.has(executionId)) {
      console.log(`[bolna-webhook] Duplicate execution_id ${executionId} — skipping`);
      return NextResponse.json({ ok: true, skipped: true, reason: 'duplicate' });
    }

    // Add to idempotency cache; evict oldest if too large (simple strategy)
    if (processedExecutionIds.size >= MAX_IDEMPOTENCY_CACHE) {
      const first = processedExecutionIds.values().next().value;
      if (first) processedExecutionIds.delete(first);
    }
    processedExecutionIds.add(executionId);
  }

  // --- 5. Process event based on status ---
  try {
    await handleWebhookEvent(executionId, callStatus, body);
  } catch (err: any) {
    console.error('[bolna-webhook] Handler error:', err?.message);
    // Return 200 to prevent Bolna from retrying (event already recorded in idempotency cache)
    return NextResponse.json(
      { ok: false, error: 'Internal processing error — event acknowledged, not retried' },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, execution_id: executionId || null });
}

async function handleWebhookEvent(
  executionId: string | undefined,
  callStatus: string | undefined,
  body: Record<string, any>
): Promise<void> {
  /**
   * Lifecycle states from Bolna:
   *   queued → ringing → in_progress → completed | failed
   *
   * For production: update the `call_logs` / `executions` Supabase table here.
   * For now, we log the structured event and return. The front-end polls via
   * /api/bolna/execution/:id for manual status checking.
   */

  const summary: Record<string, any> = {
    execution_id: executionId,
    status: callStatus,
    agent_id: body?.agent_id,
    recipient: body?.recipient_phone_number || body?.recipient,
    duration_seconds: body?.call_duration_seconds,
    summary: body?.summary,
    sentiment: body?.sentiment,
    transcript_lines: Array.isArray(body?.transcript) ? body.transcript.length : 0,
    received_at: new Date().toISOString(),
  };

  // Structured log for observability (visible in Vercel function logs)
  console.log('[bolna-webhook] Event processed:', JSON.stringify(summary, null, 2));

  // TODO (Brick 7): Persist to Supabase `call_logs` table and trigger Realtime channel update
  // const { client } = getSupabaseServerClient();
  // if (client && executionId) {
  //   await client.from('call_logs').upsert({ id: executionId, ...summary });
  // }
}
