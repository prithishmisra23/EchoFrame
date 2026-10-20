export interface SarvamTtsOptions {
  text: string;
  language_code?: string;
  speaker?: string;
  pace?: number;
  speech_sample_rate?: number;
  model?: string;
  overrideApiKey?: string;
}

export interface SarvamTtsResult {
  success: boolean;
  audioBase64?: string;
  audioDataUri?: string;
  requestId?: string;
  provider: 'sarvam_ai' | 'simulation';
  isConfigured: boolean;
  error?: string;
}

export async function synthesizeSarvamSpeech(options: SarvamTtsOptions): Promise<SarvamTtsResult> {
  const apiKey = options.overrideApiKey || process.env.SARVAM_API_KEY || '';
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  if (!isConfigured) {
    return {
      success: false,
      provider: 'simulation',
      isConfigured: false,
      error: 'Sarvam API key is not configured. Set SARVAM_API_KEY in environment or Settings.',
    };
  }

  const endpoint = 'https://api.sarvam.ai/text-to-speech';
  const languageCode = options.language_code || 'en-IN';
  let speaker = options.speaker || 'shubh_en_narration';

  const VALID_SPEAKERS = new Set([
    'aayan_hi_conversational', 'amit_hi_conversational', 'ashutosh_hi_conversational', 'kabir_hi_conversational',
    'kavya_hi_conversational', 'manan_hi_conversational', 'rahul_hi_conversational', 'sumit_hi_conversational',
    'aditi_en_stories', 'aparna_en_companion', 'ashwin_en_sports', 'dev_en_conversational', 'ishita_en_customer',
    'neha_en_customer', 'ritu_en_edtech', 'roopa_en_conversational', 'sanchita_en_companion', 'shubh_en_narration',
    'simran_en_narration', 'simran_en_conversation', 'aditya_hi_conversational', 'aparna_hi_customer',
    'mohit_hi_conversational', 'priya_hi_recovery', 'ritu_hi_conversation', 'roopa_hi_companion',
    'sanchita_hi_assistant', 'shubh_hi_customer', 'simran_hi_conversation', 'chaitra_kn_conversation',
    'gokul_ta_narration', 'aravind_ta_ads', 'vijay_ta_narration', 'kavitha_te_conversation'
  ]);

  if (!VALID_SPEAKERS.has(speaker)) {
    if (languageCode === 'hi-IN') speaker = 'simran_hi_conversation';
    else if (languageCode === 'ta-IN') speaker = 'gokul_ta_narration';
    else speaker = 'shubh_en_narration';
  }

  const model = options.model || 'bulbul:v4-flash';
  const pace = options.pace || 1.0;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: options.text,
        language_code: languageCode,
        model,
        speaker,
        pace,
        speech_sample_rate: options.speech_sample_rate || 22050,
        output_audio_codec: 'wav',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        provider: 'sarvam_ai',
        isConfigured: true,
        error: `Sarvam API error (HTTP ${res.status}): ${errText || res.statusText}`,
      };
    }

    const data = await res.json();
    const audioBase64 = data.audios?.[0];

    if (!audioBase64) {
      return {
        success: false,
        provider: 'sarvam_ai',
        isConfigured: true,
        error: 'Sarvam API succeeded but returned an empty audio payload.',
      };
    }

    return {
      success: true,
      audioBase64,
      audioDataUri: `data:audio/wav;base64,${audioBase64}`,
      requestId: data.request_id,
      provider: 'sarvam_ai',
      isConfigured: true,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'sarvam_ai',
      isConfigured: true,
      error: `Network error reaching Sarvam TTS: ${err.message}`,
    };
  }
}
