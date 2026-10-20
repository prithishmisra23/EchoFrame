'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BolnaExecutionResult, Task } from '@/lib/types';
import { 
  X, 
  PhoneCall, 
  Play, 
  Square, 
  RotateCw,
} from 'lucide-react';
import { speechService } from '@/lib/speech-service';
import { useEchoFrame } from '@/lib/store';

interface ExecutionDetailModalProps {
  execution: BolnaExecutionResult | null;
  task?: Task | null;
  onClose: () => void;
}

const DEFAULT_EXEC_TRANSCRIPT: { speaker: 'agent' | 'user'; text: string; timestamp: string }[] = [
  { speaker: 'agent', text: 'Hello, this is Aria Vance calling from Global AI Summit.', timestamp: '00:02' },
  { speaker: 'user', text: 'Hi Aria! Confirming our slide presentation has been uploaded in 4K.', timestamp: '00:10' },
  { speaker: 'agent', text: 'Recorded and verified with the main stage A/V console. See you tomorrow!', timestamp: '00:22' },
];

export function ExecutionDetailModal({ execution, task, onClose }: ExecutionDetailModalProps) {
  // --- Derived values (safe with null/undefined props) ---
  const executionId = execution?.execution_id || task?.bolnaExecutionId || 'exec_simulated';
  const sentiment = execution?.sentiment || 'positive';
  const isLiveBolna = Boolean(execution && !execution.is_sandbox && !executionId.startsWith('sandbox_') && executionId !== 'exec_simulated');

  // --- ALL hooks called unconditionally ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [callStatus, setCallStatus] = useState<string>(execution?.status || 'completed');
  const [duration, setDuration] = useState<number>(execution?.call_duration_seconds || 35);
  const [transcript, setTranscript] = useState(execution?.transcript || DEFAULT_EXEC_TRANSCRIPT);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setLastChecked] = useState<string>('Just now');

  const { updateTask } = useEchoFrame();

  const pollStatus = useCallback(async () => {
    if (!isLiveBolna) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/bolna/execution?id=${encodeURIComponent(executionId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.status) setCallStatus(data.status);
        const rawDuration = data.data?.call_duration_seconds || data.data?.duration || data.data?.conversation_time;
        if (typeof rawDuration === 'number') setDuration(Math.round(rawDuration));

        let currentParsedTranscript = transcript;
        const rawTranscript = data.data?.transcript;
        if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
          currentParsedTranscript = rawTranscript.map((t: any, idx: number) => ({
            speaker: (t.speaker === 'agent' || t.role === 'assistant') ? ('agent' as const) : ('user' as const),
            text: t.text || t.content || t.message || String(t),
            timestamp: t.timestamp || `00:${idx * 8 < 10 ? '0' : ''}${idx * 8}`,
          }));
          setTranscript(currentParsedTranscript);
        } else if (typeof rawTranscript === 'string' && rawTranscript.trim().length > 0) {
          const lines = rawTranscript.split('\n').map((l: string) => l.trim()).filter(Boolean);
          const parsed = lines.map((line: string, idx: number) => {
            const isAgent = /^agent:|^assistant:/i.test(line);
            const cleanText = line.replace(/^(agent|assistant|user|human):\s*/i, '');
            return {
              speaker: isAgent ? ('agent' as const) : ('user' as const),
              text: cleanText,
              timestamp: `00:${idx * 8 < 10 ? '0' : ''}${idx * 8}`,
            };
          });
          if (parsed.length > 0) {
            currentParsedTranscript = parsed;
            setTranscript(parsed);
          }
        }

        // Keep task updated in store with real provider status
        if (task && data.status) {
          const isDone = data.status === 'completed';
          const isFailed = ['failed', 'canceled', 'no-answer', 'busy', 'balance-low', 'stopped', 'error'].includes(data.status);
          const mappedStatus = isDone ? 'completed' : isFailed ? 'failed' : 'in_progress';
          const mappedLifecycle = isDone ? 'succeeded' : isFailed ? 'failed' : 'executing';

          if (task.status !== mappedStatus || task.lifecycleState !== mappedLifecycle) {
            updateTask({
              ...task,
              status: mappedStatus,
              lifecycleState: mappedLifecycle,
              completedAt: isDone ? 'Just now' : task.completedAt,
              result: {
                ...task.result,
                execution_id: executionId,
                agent_id: task.assignedAgentId,
                status: data.status,
                call_duration_seconds: typeof rawDuration === 'number' ? Math.round(rawDuration) : duration,
                transcript: currentParsedTranscript,
                summary: `Bolna carrier status updated to ${data.status}.`,
                sentiment: 'positive',
                created_at: task.result?.created_at || new Date().toISOString(),
                is_sandbox: false,
                provider: 'bolna_cloud',
              },
              executionLog: [
                ...task.executionLog,
                {
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  message: `Bolna carrier status updated to ${data.status.toUpperCase()}.`,
                  level: isDone ? ('success' as const) : isFailed ? ('warning' as const) : ('action' as const),
                },
              ],
            });
          }
        }
        setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }, [executionId, isLiveBolna, task, duration, transcript, updateTask]);

  useEffect(() => {
    if (!isLiveBolna) return;
    pollStatus();
    if (callStatus === 'queued' || callStatus === 'ringing' || callStatus === 'initiated' || callStatus === 'in-progress' || callStatus === 'in_progress') {
      const timer = setInterval(pollStatus, 4000);
      return () => clearInterval(timer);
    }
  }, [callStatus, isLiveBolna, pollStatus]);

  // --- Safe early return AFTER all hooks ---
  if (!execution && !task) return null;

  const handlePlayTranscriptAudio = () => {
    if (isPlayingAudio) {
      speechService.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const fullText = transcript.map((t) => `${t.speaker}: ${t.text}`).join('. ');
      speechService.speak(fullText, {
        pitch: 1.0,
        rate: 1.05,
        onEnd: () => setIsPlayingAudio(false),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div
          className="flex items-center gap-3 pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <PhoneCall className="h-5 w-5" />
          </div>

          <div className="pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`badge ${
                  execution?.is_sandbox || executionId.startsWith('sandbox_')
                    ? 'badge-warning'
                    : 'badge-accent'
                }`}
                style={{ fontSize: '10px' }}
              >
                {execution?.is_sandbox || executionId.startsWith('sandbox_')
                  ? 'Labelled Sandbox'
                  : 'Live Bolna Cloud'}
              </span>

              {/* Real Call Telephony Status */}
              <span
                className={`badge text-[10px] flex items-center gap-1.5 ${
                  callStatus === 'completed'
                    ? 'badge-accent'
                    : callStatus === 'failed'
                    ? 'badge-danger'
                    : 'badge-warning animate-pulse'
                }`}
              >
                <span
                  className="status-dot"
                  style={{
                    background:
                      callStatus === 'completed'
                        ? '#10b981'
                        : callStatus === 'failed'
                        ? '#ef4444'
                        : callStatus === 'ringing' || callStatus === 'in-progress' || callStatus === 'in_progress'
                        ? '#06b6d4'
                        : '#f59e0b',
                  }}
                />
                Status: {callStatus.toUpperCase()}
              </span>

              {isLiveBolna && (
                <button
                  onClick={pollStatus}
                  disabled={isRefreshing}
                  className="btn-secondary text-[10px] flex items-center gap-1"
                  style={{ padding: '2px 8px' }}
                  title="Check live status from Bolna"
                >
                  <RotateCw className={`h-2.5 w-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Checking…' : 'Refresh'}</span>
                </button>
              )}

              <span className="text-[11px] font-mono text-zinc-500">{executionId}</span>
            </div>
            <h2 className="mt-1 text-subheading" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              {task?.title || 'Voice AI Telephony Execution Session'}
            </h2>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div
            className="rounded-lg p-2.5"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Call Duration</div>
            <div className="font-semibold text-white mt-0.5">{duration}s</div>
          </div>
          <div
            className="rounded-lg p-2.5"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Sentiment</div>
            <div className="font-semibold uppercase mt-0.5" style={{ color: 'var(--accent)' }}>{sentiment}</div>
          </div>
          <div
            className="rounded-lg p-2.5"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Audio Latency</div>
            <div className="font-semibold text-white mt-0.5">185ms</div>
          </div>
        </div>

        {/* Audio Player Bar */}
        <div
          className="mt-4 rounded-lg p-3 flex items-center justify-between gap-3"
          style={{
            background: 'var(--bg-surface-0)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={handlePlayTranscriptAudio}
            className="btn-primary flex items-center gap-2"
            style={{ padding: '6px 14px', fontSize: '11px' }}
          >
            {isPlayingAudio ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isPlayingAudio ? 'Stop Audio' : 'Play Audio Session'}</span>
          </button>

          {/* Audio bar waveform visualization */}
          <div className="flex-1 flex items-center gap-1 h-5 px-2">
            {[20, 50, 80, 40, 95, 60, 30, 75, 90, 45, 85, 35, 70, 55, 65].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-200"
                style={{
                  height: `${h}%`,
                  background: isPlayingAudio ? 'var(--accent)' : 'var(--bg-surface-3)',
                }}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-zinc-500">
            00:{duration < 10 ? `0${duration}` : duration}
          </span>
        </div>

        {/* Summary */}
        {execution?.summary && (
          <div
            className="mt-3.5 rounded-lg p-3 text-xs"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="font-medium" style={{ color: 'var(--accent)' }}>Summary: </span>
            {execution.summary}
          </div>
        )}

        {/* Conversational Transcript Box */}
        <div className="mt-3.5 flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Conversation Audio Transcript
          </div>

          <div className="space-y-2">
            {transcript.map((item, idx) => {
              const isAgent = item.speaker === 'agent';

              return (
                <div
                  key={idx}
                  className="flex flex-col p-2.5 rounded-lg text-xs"
                  style={{
                    background: isAgent ? 'var(--bg-surface-2)' : 'var(--bg-surface-0)',
                    border: `1px solid ${isAgent ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                    marginLeft: isAgent ? '1.5rem' : '0',
                    marginRight: isAgent ? '0' : '1.5rem',
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span
                      className="font-medium uppercase tracking-wider"
                      style={{ color: isAgent ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      {isAgent ? '🎙️ EchoFrame Agent' : '👤 Participant / Guest'}
                    </span>
                    <span className="font-mono text-zinc-500">{item.timestamp}</span>
                  </div>
                  <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task execution log if provided */}
        {task && task.executionLog.length > 0 && (
          <div
            className="mt-3 pt-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Execution Trace ({task.executionLog.length} Events)
            </div>
            <div
              className="space-y-1 max-h-20 overflow-y-auto font-mono text-[10px] p-2 rounded"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {task.executionLog.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-500">{log.timestamp}</span>
                  <span style={{ color: log.level === 'success' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-4 pt-3 flex justify-end"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => {
              speechService.stopSpeaking();
              onClose();
            }}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '11px' }}
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
}
