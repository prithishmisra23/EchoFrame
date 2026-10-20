'use client';

import React, { useState, useEffect } from 'react';
import { Agent } from '@/lib/types';
import { speechService } from '@/lib/speech-service';
import { 
  X, 
  Mic, 
  Play, 
  Square
} from 'lucide-react';

interface VoicePreviewModalProps {
  agent: Agent;
  onClose: () => void;
}

export function VoicePreviewModal({ agent, onClose }: VoicePreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [samplePhrase, setSamplePhrase] = useState('');

  const defaultPhrase = agent.domain === 'event'
    ? `Hello, I am ${agent.name}, ${agent.title} for EchoFrame. I am currently monitoring the main stage run-of-show, coordinating technical riders, and ready to place verification calls via Bolna telephony.`
    : `Hey there, I am ${agent.name}, ${agent.title} on The Synthetic Frontier podcast. I'm testing our studio acoustics and preparing our guest interview dossiers. How can I assist with episode production today?`;

  useEffect(() => {
    setSamplePhrase(defaultPhrase);
    return () => {
      speechService.stopSpeaking();
    };
  }, [agent, defaultPhrase]);

  const handlePlayVoice = () => {
    if (isPlaying) {
      speechService.stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speechService.speak(samplePhrase, {
        pitch: agent.voiceConfig.pitch,
        rate: agent.voiceConfig.speed,
        onEnd: () => setIsPlaying(false),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            speechService.stopSpeaking();
            onClose();
          }}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          title="Close preview"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Agent Info Header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-default)',
            }}
          >
            {agent.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-subheading" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {agent.name}
              </h2>
              <span
                className="badge badge-accent uppercase font-mono"
                style={{ fontSize: '9px' }}
              >
                {agent.voiceConfig.provider} Engine
              </span>
            </div>
            <p className="text-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{agent.title}</p>
          </div>
        </div>

        {/* Animated Audio Waveform Box */}
        <div
          className="mt-5 rounded-lg p-5 flex flex-col items-center justify-center"
          style={{
            background: 'var(--bg-surface-0)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-center gap-1.5 h-14 w-full">
            {[40, 65, 85, 30, 95, 50, 75, 45, 90, 60, 35, 80, 55, 70].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-200"
                style={{
                  height: isPlaying ? `${Math.max(12, h)}%` : '6px',
                  background: isPlaying ? 'var(--accent)' : 'var(--bg-surface-3)',
                }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className="status-dot"
              style={{
                background: isPlaying ? 'var(--accent)' : 'var(--text-tertiary)',
                animation: isPlaying ? 'statusPulse 1s infinite' : 'none',
              }}
            />
            <span style={{ color: isPlaying ? 'var(--accent)' : 'var(--text-tertiary)' }}>
              {isPlaying ? 'Synthesizing voice stream…' : 'Synthesizer ready'}
            </span>
          </div>
        </div>

        {/* Voice Parameters Badge */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div
            className="rounded-lg p-2"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Profile</div>
            <div className="font-medium text-white truncate mt-0.5 text-[11px]">{agent.voiceConfig.voiceName}</div>
          </div>
          <div
            className="rounded-lg p-2"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Pitch Ratio</div>
            <div className="font-medium mt-0.5 text-[11px]" style={{ color: 'var(--accent)' }}>{agent.voiceConfig.pitch}x</div>
          </div>
          <div
            className="rounded-lg p-2"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Rate</div>
            <div className="font-medium text-white mt-0.5 text-[11px]">{agent.voiceConfig.speed}x</div>
          </div>
        </div>

        {/* Sample Voice Script textarea */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5 text-caption">
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Spoken Test Script:</span>
            <span style={{ color: 'var(--text-tertiary)' }}>Editable Preview</span>
          </div>
          <textarea
            value={samplePhrase}
            onChange={(e) => setSamplePhrase(e.target.value)}
            rows={3}
            className="input-field w-full text-xs resize-none leading-relaxed"
            style={{ borderRadius: 'var(--radius-md)' }}
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handlePlayVoice}
            className={`flex-1 flex items-center justify-center gap-2 ${
              isPlaying ? 'btn-secondary text-amber-300' : 'btn-primary'
            }`}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isPlaying ? 'Stop Playback' : 'Speak Voice Persona'}</span>
          </button>

          <button
            onClick={() => {
              speechService.stopSpeaking();
              onClose();
            }}
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '12px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
