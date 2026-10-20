import { NextResponse } from 'next/server';
import { pingBolnaServer, getBolnaServerConfig } from '@/lib/server/bolna';

export async function GET() {
  try {
    const serverResult = await pingBolnaServer();
    return NextResponse.json({
      status: serverResult.configured ? 'authenticated' : 'unconfigured',
      success: serverResult.configured,
      isSandbox: serverResult.isSandbox,
      message: serverResult.message,
      latencyMs: serverResult.latencyMs,
      user: serverResult.user,
      agentsCount: 1,
      wallet: { balance: 500.0 },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: 'error', error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey, baseUrl } = body;

    // If custom API key was passed from UI, test with that key
    if (apiKey && apiKey.trim().length > 0) {
      const endpoint = baseUrl || 'https://api.bolna.ai';
      const startTime = Date.now();
      try {
        const res = await fetch(`${endpoint}/user/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({
            success: true,
            isSandbox: false,
            message: 'Successfully authenticated with Bolna Voice AI Cloud!',
            latencyMs,
            user: { email: data.email, concurrency: data.concurrency },
          });
        } else {
          const errDetail = await res.text();
          return NextResponse.json({
            success: false,
            isSandbox: false,
            message: `Bolna API responded with status ${res.status}: ${errDetail || 'Authentication failed'}`,
            latencyMs,
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          isSandbox: false,
          message: `Network error connecting to Bolna: ${err.message}`,
        });
      }
    }

    // Otherwise test using server environment variables
    const serverResult = await pingBolnaServer();
    return NextResponse.json({
      success: serverResult.configured,
      isSandbox: serverResult.isSandbox,
      message: serverResult.message,
      latencyMs: serverResult.latencyMs,
      user: serverResult.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Server error testing Bolna: ${err.message}` },
      { status: 500 }
    );
  }
}
