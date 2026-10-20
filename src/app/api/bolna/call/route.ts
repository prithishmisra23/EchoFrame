import { NextResponse } from 'next/server';
import { executeBolnaCall } from '@/lib/server/bolna';
import { BolnaCallPayload } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentId, recipientPhone, recipientName, contextData, agentName, overrideApiKey } = body;

    if (!recipientPhone) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    const payload: BolnaCallPayload = {
      agent_id: agentId || 'bolna_agt_default',
      recipient_phone_number: recipientPhone,
      recipient_name: recipientName,
      context_data: contextData || {},
    };

    const result = await executeBolnaCall(payload, agentName || 'Agent', overrideApiKey);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch call to Bolna telephony provider.',
          is_sandbox: result.isSandbox,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      execution: result.execution,
      is_sandbox: result.isSandbox,
      provider: result.execution?.provider,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Internal server error dispatching call: ${err.message}` },
      { status: 500 }
    );
  }
}
