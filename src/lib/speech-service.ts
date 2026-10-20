// Browser Web Speech API & Audio Context Helpers for EchoFrame Voice Operations

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class BrowserSpeechService {
  private recognition: any = null;
  private isListening = false;
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  startListening(handlers: SpeechRecognitionHandlers) {
    if (!this.recognition) {
      handlers.onError?.('Speech recognition is not supported in this browser. Please use Chrome/Edge or text input.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const combined = finalTranscript || interimTranscript;
      handlers.onResult?.(combined, Boolean(finalTranscript));
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      handlers.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      handlers.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      handlers.onError?.(err.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
    this.stopAudioAnalysis();
  }

  speak(text: string, options?: { pitch?: number; rate?: number; onEnd?: () => void }) {
    if (!this.synth) return;

    this.synth.cancel(); // Stop prior audio

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.rate = options?.rate ?? 1.0;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Audio Context stream for real-time visualizer
  async initAudioAnalysis(onFrequencyData: (data: Uint8Array) => void): Promise<() => void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return () => {};
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let animationFrameId: number;

      const renderFrame = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        onFrequencyData(dataArray);
        animationFrameId = requestAnimationFrame(renderFrame);
      };

      renderFrame();

      return () => {
        cancelAnimationFrame(animationFrameId);
        this.stopAudioAnalysis();
      };
    } catch (err) {
      console.warn('Microphone access denied or audio context failed:', err);
      return () => {};
    }
  }

  private stopAudioAnalysis() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
  }
}

export const speechService = new BrowserSpeechService();
