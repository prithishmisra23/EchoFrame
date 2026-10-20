'use client';

import React from 'react';
import { WorkflowPlan } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  Sparkles, 
  ShieldAlert, 
  Zap,
  Volume2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { speechService } from '@/lib/speech-service';

interface WorkflowPlannerProps {
  plan: WorkflowPlan;
  speechFeedback?: string;
  onDeploy: () => void;
  onDiscard: () => void;
}

export function WorkflowPlanner({ plan, speechFeedback, onDeploy, onDiscard }: WorkflowPlannerProps) {
  const { agents, isExecutingWorkflow } = useEchoFrame();

  const handleSpeakSummary = () => {
    if (speechFeedback) {
      speechService.speak(speechFeedback, { pitch: 1.05, rate: 1.0 });
    } else {
      speechService.speak(`Deploying workflow: ${plan.summary}`, { pitch: 1.05, rate: 1.0 });
    }
  };

  return (
    <div
      className="rounded-xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="text-caption font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Coordinated Workflow Plan
            </span>
            <span className="text-caption text-zinc-500">•</span>
            <span className="text-caption text-zinc-400 font-mono uppercase">{plan.domain}</span>
          </div>

          <h3 className="mt-1 text-subheading" style={{ fontSize: '1rem', fontWeight: 600 }}>
            {plan.summary}
          </h3>

          <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Target Project: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{plan.projectTitle}</span>
          </p>
        </div>

        {/* Audio response player */}
        {speechFeedback && (
          <button
            onClick={handleSpeakSummary}
            className="btn-secondary self-start sm:self-auto flex items-center gap-1.5"
            style={{ padding: '6px 12px', fontSize: '11px' }}
            title="Listen to Orchestrator Voice"
          >
            <Volume2 className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            <span>Voice Response</span>
          </button>
        )}
      </div>

      {/* Voice feedback quote if provided */}
      {speechFeedback && (
        <div
          className="rounded-lg p-3 text-xs flex items-start gap-2.5 italic"
          style={{
            background: 'var(--bg-surface-0)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="font-serif text-base leading-none" style={{ color: 'var(--accent)' }}>“</span>
          <span>{speechFeedback}</span>
        </div>
      )}

      {/* Steps Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Execution Sequence ({plan.steps.length} Steps)
          </span>
          <span className="text-caption text-zinc-500">Autonomous & Human-in-Loop</span>
        </div>

        <div className="space-y-2">
          {plan.steps.map((step, idx) => {
            const agent = agents.find((a) => a.id === step.agentId);

            return (
              <div
                key={step.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg p-3 transition-colors"
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Step Number */}
                  <div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded font-mono text-[11px] font-semibold"
                    style={{
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-medium text-white">{step.title}</h4>
                      {step.requiresHumanApproval && (
                        <span className="badge badge-warning flex items-center gap-1" style={{ fontSize: '10px' }}>
                          <ShieldAlert className="h-3 w-3" />
                          Approval Required
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Assigned Agent Pill */}
                {agent && (
                  <div
                    className="flex items-center gap-2 self-start sm:self-auto rounded px-2.5 py-1.5 flex-shrink-0"
                    style={{
                      background: 'var(--bg-surface-0)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span className="text-sm">{agent.avatar}</span>
                    <div className="text-left">
                      <div className="text-[11px] font-medium text-white truncate max-w-[120px]">
                        {agent.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 truncate max-w-[120px]">
                        {agent.title}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center justify-end gap-3 pt-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={onDiscard}
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: '12px' }}
        >
          Discard
        </button>

        <button
          onClick={onDeploy}
          disabled={isExecutingWorkflow}
          className="btn-primary flex items-center gap-2"
          style={{ padding: '8px 18px', fontSize: '12px' }}
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>{isExecutingWorkflow ? 'Deploying to Agents…' : 'Deploy to Live Operations'}</span>
        </button>
      </div>
    </div>
  );
}
