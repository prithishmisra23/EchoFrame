import { NextResponse } from 'next/server';
import { synthesizeSarvamSpeech } from '@/lib/server/sarvam';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, language_code, speaker, pace, apiKey } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text prompt is required for TTS synthesis.' },
        { status: 400 }
      );
    }

    const result = await synthesizeSarvamSpeech({
      text: text.trim(),
      language_code: language_code || 'en-IN',
      speaker: speaker || 'shubh',
      pace: typeof pace === 'number' ? pace : 1.0,
      overrideApiKey: apiKey,
    });

    if (!result.success && result.isConfigured) {
      return NextResponse.json(
        { success: false, error: result.error, isConfigured: true },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Internal server error: ${err.message}` },
      { status: 500 }
    );
  }
}
