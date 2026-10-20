'use client';

import React from 'react';
import { Agent } from '@/lib/types';
import { 
  Mic, 
  Settings, 
  ShieldCheck, 
  ShieldAlert, 
  PhoneCall, 
  CheckCircle2, 
  Wrench,
  Sparkles,
  Cpu
} from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onTestVoice: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit, onTestVoice }: AgentCardProps) {
  const isEvent = agent.domain === 'event';
  const isAutonomous = agent.autonomyLevel === 'full_autonomous';
  const isInCall = agent.status === 'in_call';

  return (
    <div
      className="group relative rounded-lg p-4 transition-all flex flex-col justify-between"
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        {/* Top Header: Avatar, Status & Domain */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-default)',
              }}
            >
              <span>{agent.avatar}</span>
              {isInCall && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {agent.name}
                </h3>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{agent.title}</p>
            </div>
          </div>

          {/* Domain badge */}
          <span
            className="badge"
            style={{
              fontSize: '10px',
              background: isEvent ? 'var(--accent-subtle)' : 'rgba(168, 85, 247, 0.1)',
              borderColor: isEvent ? 'var(--accent-border)' : 'rgba(168, 85, 247, 0.25)',
              color: isEvent ? 'var(--accent)' : '#d8b4fe',
            }}
          >
            {isEvent ? 'Event' : 'Podcast'}
          </span>
        </div>

        {/* System Prompt snippet */}
        <p className="mt-2.5 text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {agent.systemPrompt}
        </p>

        {/* Voice Persona & Provider pill */}
        <div
          className="mt-3 flex items-center justify-between rounded px-2.5 py-1.5 text-xs"
          style={{
            background: 'var(--bg-surface-0)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Mic className="h-3 w-3" style={{ color: 'var(--accent)' }} />
            <span className="text-white font-medium truncate max-w-[130px] text-[11px]">
              {agent.voiceConfig.voiceName}
            </span>
          </div>
          <span
            className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-medium"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-tertiary)',
            }}
          >
            {agent.voiceConfig.provider}
          </span>
        </div>

        {/* Governance & Autonomy badge */}
        <div className="mt-2 flex items-center gap-2">
          {isAutonomous ? (
            <div
              className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Full Autonomy</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                color: 'var(--status-warning)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>Approval Required</span>
            </div>
          )}
        </div>

        {/* Operational Telemetry Row */}
        <div
          className="mt-3 grid grid-cols-3 gap-1 rounded p-2 text-center text-xs"
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Voice Calls</div>
            <div className="font-semibold text-white mt-0.5 text-[11px]">{agent.totalCallsCompleted}</div>
          </div>
          <div>
            <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Tasks Handled</div>
            <div className="font-semibold text-white mt-0.5 text-[11px]">{agent.totalTasksResolved}</div>
          </div>
          <div>
            <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>RAG Sources</div>
            <div className="font-semibold mt-0.5 text-[11px]" style={{ color: 'var(--accent)' }}>
              {agent.knowledgeDocs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div
        className="mt-3 pt-3 flex items-center justify-between gap-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={() => onTestVoice(agent)}
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          <Mic className="h-3 w-3" style={{ color: 'var(--accent)' }} />
          <span>Test Voice</span>
        </button>

        <button
          onClick={() => onEdit(agent)}
          className="btn-secondary flex items-center justify-center"
          style={{ padding: '5px 10px', fontSize: '11px' }}
          title="Configure System Prompt & Governance"
        >
          <Settings className="h-3 w-3 mr-1" />
          <span>Configure</span>
        </button>
      </div>
    </div>
  );
}
