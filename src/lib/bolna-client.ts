import { BolnaCallPayload, BolnaExecutionResult } from './types';

export interface BolnaSettings {
  apiKey: string;
  baseUrl: string;
  sandboxMode: boolean;
}

export const DEFAULT_BOLNA_SETTINGS: BolnaSettings = {
  apiKey: '',
  baseUrl: 'https://api.bolna.ai',
  sandboxMode: true,
};

export class BolnaClientService {
  private settings: BolnaSettings;

  constructor(settings?: Partial<BolnaSettings>) {
    this.settings = { ...DEFAULT_BOLNA_SETTINGS, ...settings };
  }

  updateSettings(settings: Partial<BolnaSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  isConfigured(): boolean {
    return Boolean(this.settings.apiKey && this.settings.apiKey.trim().length > 0);
  }

  async testConnection(customApiKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number; isSandbox?: boolean }> {
    try {
      const response = await fetch('/api/bolna/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: customApiKey || this.settings.apiKey,
          baseUrl: this.settings.baseUrl,
        }),
      });

      const data = await response.json();
      return {
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
        isSandbox: data.isSandbox,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Network error reaching Bolna test route: ${error.message}`,
      };
    }
  }

  async triggerCall(payload: BolnaCallPayload, agentName = 'Agent'): Promise<BolnaExecutionResult> {
    const res = await fetch('/api/bolna/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: payload.agent_id,
        recipientPhone: payload.recipient_phone_number,
        recipientName: payload.recipient_name,
        contextData: payload.context_data,
        agentName,
        overrideApiKey: this.settings.apiKey || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      // NEVER silently convert production call failure into mock success!
      throw new Error(data.error || `Bolna telephony execution failed with status ${res.status}`);
    }

    return data.execution as BolnaExecutionResult;
  }
}

export const bolnaService = new BolnaClientService();
