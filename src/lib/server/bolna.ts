import { BolnaCallPayload, BolnaExecutionResult } from '@/lib/types';

export interface BolnaServerConfig {
  apiKey: string;
  baseUrl: string;
  isSandbox: boolean;
}

export function getBolnaServerConfig(): BolnaServerConfig {
  const apiKey = process.env.BOLNA_API_KEY || '';
  const baseUrl = process.env.BOLNA_BASE_URL || 'https://api.bolna.ai';
  // If no API key is provided, default to sandbox mode. If sandbox mode is explicitly false, require API key.
  const sandboxEnv = process.env.ECHOFRAME_SANDBOX_MODE;
  const isSandbox = sandboxEnv === 'true' || !apiKey || apiKey.trim().length === 0;

  return { apiKey, baseUrl, isSandbox };
}

export async function pingBolnaServer(): Promise<{
  configured: boolean;
  isSandbox: boolean;
  message: string;
  latencyMs?: number;
  user?: any;
}> {
  const config = getBolnaServerConfig();

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    return {
      configured: false,
      isSandbox: true,
      message: 'Running in Labelled Sandbox Simulation Mode (BOLNA_API_KEY not configured).',
    };
  }

  const startTime = Date.now();
  try {
    const res = await fetch(`${config.baseUrl}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      return {
        configured: true,
        isSandbox: false,
        message: 'Successfully verified live connection to Bolna Voice AI Cloud.',
        latencyMs,
        user: { email: data.email, concurrency: data.concurrency },
      };
    } else {
      const errorText = await res.text();
      return {
        configured: false,
        isSandbox: false,
        message: `Bolna API authentication failed (HTTP ${res.status}): ${errorText || 'Unauthorized'}`,
        latencyMs,
      };
    }
  } catch (err: any) {
    return {
      configured: false,
      isSandbox: false,
      message: `Failed to reach Bolna endpoint: ${err.message}`,
    };
  }
}

export async function executeBolnaCall(
  payload: BolnaCallPayload,
  agentName = 'Agent',
  overrideApiKey?: string,
  overrideSandbox?: boolean
): Promise<{
  success: boolean;
  execution?: BolnaExecutionResult;
  isSandbox: boolean;
  error?: string;
}> {
  const config = getBolnaServerConfig();
  const effectiveKey = overrideApiKey || config.apiKey;
  const effectiveSandbox = overrideSandbox !== undefined ? overrideSandbox : config.isSandbox;

  // Real production execution
  if (!effectiveSandbox && effectiveKey) {
    try {
      const defaultAgentId = process.env.BOLNA_DEFAULT_AGENT_ID || 'bde59659-8472-4bf9-ae84-819e9326ed41';
      let targetAgentId = (payload.agent_id || '').trim();

      // Resolve human-readable slug, placeholder IDs, or defaults to the verified live Bolna agent UUID
      if (
        !targetAgentId ||
        targetAgentId === 'yellow-thomas-5037' ||
        targetAgentId === 'bolna_default' ||
        targetAgentId.startsWith('bolna_agt_') ||
        targetAgentId.startsWith('bolna_agent_')
      ) {
        targetAgentId = defaultAgentId;
      }
      if (targetAgentId === 'yellow-thomas-5037') {
        targetAgentId = 'bde59659-8472-4bf9-ae84-819e9326ed41';
      }

      const cleanPhone = (payload.recipient_phone_number || '').trim().replace(/[\s\-\(\)]/g, '');
      if (!cleanPhone.startsWith('+') || !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
        return {
          success: false,
          isSandbox: false,
          error: `Invalid recipient phone number ("${payload.recipient_phone_number}"). Bolna requires international E.164 format with country code (e.g., +91XXXXXXXXXX or +1XXXXXXXXXX).`,
        };
      }

      const res = await fetch(`${config.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: targetAgentId,
          recipient_phone_number: cleanPhone,
          user_data: payload.context_data || {},
        }),
      });

      if (!res.ok) {
        const errDetail = await res.text();
        let message = errDetail || res.statusText;
        try {
          const parsed = JSON.parse(errDetail);
          if (parsed.message) message = parsed.message;
        } catch {}

        if (message.includes('verified phone numbers')) {
          message = `${message} — To test live calls on a Bolna trial account, verify this phone number on https://platform.bolna.ai/ or enter the number you verified during Bolna sign-up.`;
        }

        return {
          success: false,
          isSandbox: false,
          error: `Bolna provider call failed (HTTP ${res.status}): ${message}`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        isSandbox: false,
        execution: {
          execution_id: data.execution_id || `bolna_exec_${Date.now()}`,
          agent_id: payload.agent_id,
          status: 'queued',
          call_duration_seconds: 0,
          transcript: [
            {
              speaker: 'agent',
              text: `Outbound call queued with Bolna Telephony to ${payload.recipient_phone_number}.`,
              timestamp: '00:00',
            },
          ],
          summary: `Live Bolna telephony session initiated. Remote Execution ID: ${data.execution_id}`,
          sentiment: 'neutral',
          created_at: new Date().toISOString(),
          is_sandbox: false,
          provider: 'bolna_cloud',
        },
      };
    } catch (err: any) {
      // Return real failure, DO NOT mask with mock
      return {
        success: false,
        isSandbox: false,
        error: `Network error dispatching call to Bolna: ${err.message}`,
      };
    }
  }

  // Explicitly labelled Sandbox Simulation
  const recipient = payload.recipient_name || 'Speaker / Guest';
  const mockExecutionId = `sandbox_exec_${Math.random().toString(36).substring(2, 9)}`;

  const isPodcast = agentName.toLowerCase().includes('talia') || agentName.toLowerCase().includes('guest');

  const transcript = isPodcast
    ? [
        { speaker: 'agent' as const, text: `[SANDBOX SIMULATION] Hello ${recipient}, Talia from EchoFrame podcast operations calling for remote soundcheck.`, timestamp: '00:03' },
        { speaker: 'user' as const, text: `Hi Talia, checking in. My Shure microphone audio levels are dialed in.`, timestamp: '00:09' },
        { speaker: 'agent' as const, text: `Acoustics sound clean with sub-180ms latency. Riverside invite confirmed for tomorrow.`, timestamp: '00:18' },
        { speaker: 'user' as const, text: `Sounds great, talk soon!`, timestamp: '00:23' },
      ]
    : [
        { speaker: 'agent' as const, text: `[SANDBOX SIMULATION] Hello ${recipient}, this is ${agentName} calling on behalf of event coordination.`, timestamp: '00:03' },
        { speaker: 'user' as const, text: `Hi ${agentName}, I am available. Slide deck is uploaded in 16:9 format.`, timestamp: '00:10' },
        { speaker: 'agent' as const, text: `Technical rider confirmed: wireless lavalier mic reserved on main stage.`, timestamp: '00:19' },
        { speaker: 'user' as const, text: `Confirmed. Thank you for the coordination.`, timestamp: '00:26' },
      ];

  return {
    success: true,
    isSandbox: true,
    execution: {
      execution_id: mockExecutionId,
      agent_id: payload.agent_id,
      status: 'completed',
      call_duration_seconds: 28,
      transcript,
      summary: `[LABELLED SANDBOX] Simulated call executed with ${recipient} (${payload.recipient_phone_number}). All verification checkpoints passed.`,
      sentiment: 'positive',
      created_at: new Date().toISOString(),
      is_sandbox: true,
      provider: 'bolna_sandbox',
    },
  };
}

export async function getBolnaExecutionStatus(executionId: string): Promise<{
  success: boolean;
  status: string;
  data?: any;
  error?: string;
}> {
  const config = getBolnaServerConfig();
  if (config.isSandbox || !executionId || executionId.startsWith('sandbox_')) {
    return {
      success: true,
      status: 'completed',
      data: {
        execution_id: executionId,
        status: 'completed',
        is_sandbox: true,
      },
    };
  }

  try {
    const res = await fetch(`${config.baseUrl}/executions/${executionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        success: false,
        status: 'unknown',
        error: `Bolna API error (HTTP ${res.status}): ${err}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      status: data.status || 'in-progress',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'unknown',
      error: err.message,
    };
  }
}

