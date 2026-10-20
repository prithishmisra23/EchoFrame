'use client';

import React, { useState, useEffect } from 'react';
import { useEchoFrame } from '@/lib/store';
import { WorkflowPlan } from '@/lib/types';
import { AudioWaveform } from './AudioWaveform';
import { WorkflowPlanner } from './WorkflowPlanner';
import { speechService } from '@/lib/speech-service';
import { 
  Mic, 
  MicOff, 
  CornerDownLeft, 
  AlertCircle,
} from 'lucide-react';

export function VoiceCommandCenter() {
  const { agents, projects, executeWorkflowPlan } = useEchoFrame();

  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<WorkflowPlan | null>(null);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [speechFeedback, setSpeechFeedback] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const suggestionChips = [
    'Create an AI conference with speaker coordination and schedule tasks',
    'Set up a podcast episode with guest research, soundcheck, and production',
    'Verify speaker presentations & call unconfirmed keynotes',
    'Deploy 24/7 attendee voice concierge on venue hotline',
  ];

  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setErrorMessage(null);
      setIsListening(true);
      speechService.startListening({
        onStart: () => setIsListening(true),
        onResult: (transcript, isFinal) => {
          setPrompt(transcript);
          if (isFinal) {
            speechService.stopListening();
            setIsListening(false);
            handleInterpretPrompt(transcript);
          }
        },
        onError: (err) => {
          setIsListening(false);
          setErrorMessage(`Speech recognition: ${err}. You can type instructions directly.`);
        },
        onEnd: () => setIsListening(false),
      });
    }
  };

  const handleInterpretPrompt = async (inputPrompt?: string) => {
    const textToRun = inputPrompt || prompt;
    if (!textToRun.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToRun,
          agents,
          projects,
        }),
      });

      const data = await res.json();

      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
        setCreatedProject(data.createdProject || null);
        setSpeechFeedback(data.speechFeedback || '');

        if (data.speechFeedback) {
          speechService.speak(data.speechFeedback, { pitch: 1.05, rate: 1.0 });
        }
      } else {
        setErrorMessage(data.error || 'Failed to interpret workflow.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with orchestrator.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeployCurrentPlan = async () => {
    if (!currentPlan) return;
    await executeWorkflowPlan(currentPlan, createdProject);
    setCurrentPlan(null);
    setCreatedProject(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Voice Interface Card */}
      <div
        className="relative rounded-xl p-8 text-center overflow-hidden"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: isListening
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(52, 211, 153, 0.04) 0%, transparent 70%)',
            transition: 'background 0.5s ease',
          }}
        />

        {/* Header */}
        <div className="badge badge-accent mx-auto" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>
          VOICE COMMAND & ORCHESTRATION
        </div>

        <h1 className="text-display mt-4" style={{ fontSize: '1.5rem' }}>
          Talk to <span style={{ color: 'var(--accent)' }}>EchoFrame</span>
        </h1>
        <p className="text-body mt-2 max-w-md mx-auto">
          Issue natural voice instructions to mobilize AI agents across speaker management, scheduling, and Bolna telephony.
        </p>

        {/* Waveform */}
        <div className="my-6">
          <AudioWaveform isActive={isListening || isProcessing} />
        </div>

        {/* Mic Button */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleToggleListening}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300"
            style={{
              background: isListening
                ? 'var(--status-error)'
                : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
              color: isListening ? 'white' : 'var(--text-inverse)',
              boxShadow: isListening
                ? '0 4px 20px rgba(239, 68, 68, 0.3)'
                : '0 4px 20px rgba(52, 211, 153, 0.2)',
              transform: isListening ? 'scale(1.05)' : 'scale(1)',
            }}
            title={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}

            {/* Outer ring */}
            <span
              className="absolute -inset-2 rounded-full"
              style={{
                border: `2px solid ${isListening ? 'rgba(239, 68, 68, 0.3)' : 'var(--accent-border)'}`,
                opacity: isListening ? 1 : 0,
                animation: isListening ? 'voicePulse 1.5s ease-in-out infinite' : 'none',
                transition: 'opacity 0.3s ease',
              }}
            />
          </button>

          <span className="mt-3 text-caption">
            {isListening ? (
              <span className="flex items-center gap-1.5" style={{ color: 'var(--status-error)' }}>
                <span className="status-dot" style={{ background: 'var(--status-error)', animation: 'statusPulse 1s infinite' }} />
                Listening… speak now
              </span>
            ) : (
              'Click microphone or type below'
            )}
          </span>
        </div>

        {/* Text Input */}
        <div className="mt-6 max-w-xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInterpretPrompt();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Call unconfirmed speakers for tomorrow's keynote..."
              className="input-field pr-28"
              style={{ borderRadius: 'var(--radius-lg)' }}
            />
            <button
              type="submit"
              disabled={isProcessing || !prompt.trim()}
              className="btn-primary absolute right-1.5"
              style={{ borderRadius: '10px', padding: '7px 14px' }}
            >
              <span>{isProcessing ? 'Processing…' : 'Orchestrate'}</span>
              <CornerDownLeft className="h-3 w-3" />
            </button>
          </form>
        </div>

        {/* Error */}
        {errorMessage && (
          <div
            className="mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-lg max-w-md mx-auto"
            style={{
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              fontSize: '11px',
              color: '#fbbf24',
            }}
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Suggestions */}
        <div className="mt-6 max-w-xl mx-auto text-left">
          <span className="text-label block mb-2">Suggested Commands</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(chip);
                  handleInterpretPrompt(chip);
                }}
                className="text-left text-caption px-2.5 py-1.5 rounded-md transition-default"
                style={{
                  background: 'var(--bg-surface-0)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '10.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                &ldquo;{chip}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Plan */}
      {currentPlan && (
        <WorkflowPlanner
          plan={currentPlan}
          speechFeedback={speechFeedback}
          onDeploy={handleDeployCurrentPlan}
          onDiscard={() => setCurrentPlan(null)}
        />
      )}
    </div>
  );
}
