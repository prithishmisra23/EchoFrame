'use client';

import React from 'react';
import { Task, TaskPriority } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  PhoneCall, 
  Calendar, 
  Mail, 
  Database, 
  ShieldAlert, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TaskItemCardProps {
  task: Task;
  onReviewApproval: (task: Task) => void;
  onInspectExecution: (task: Task) => void;
}

export function TaskItemCard({ task, onReviewApproval, onInspectExecution }: TaskItemCardProps) {
  const { agents } = useEchoFrame();
  const agent = agents.find((a) => a.id === task.assignedAgentId);

  const isAwaitingApproval = task.status === 'awaiting_approval';
  const isInProgress = task.status === 'in_progress';
  const isCompleted = task.status === 'completed';

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'badge-danger';
      case 'high':
        return 'badge-warning';
      case 'medium':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  const getActionIcon = () => {
    switch (task.actionPayload?.actionType) {
      case 'voice_call':
        return <PhoneCall className="h-3 w-3 text-emerald-400" />;
      case 'calendar_shift':
        return <Calendar className="h-3 w-3 text-blue-400" />;
      case 'email_outreach':
        return <Mail className="h-3 w-3 text-purple-400" />;
      default:
        return <Database className="h-3 w-3 text-zinc-400" />;
    }
  };

  return (
    <div
      className={`rounded-lg p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
        isAwaitingApproval
          ? 'ring-1 ring-amber-500/30 shadow-sm'
          : ''
      }`}
      style={{
        background: isAwaitingApproval
          ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, var(--bg-surface-2) 100%)'
          : isInProgress
          ? 'var(--bg-surface-2)'
          : 'var(--bg-surface-1)',
        border: `1px solid ${
          isAwaitingApproval
            ? 'rgba(245, 158, 11, 0.3)'
            : isInProgress
            ? 'var(--border-strong)'
            : 'var(--border-subtle)'
        }`,
      }}
    >
      <div>
        {/* Top Header: Priority, Action Type & Project */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`badge ${getPriorityBadge(task.priority)} uppercase`} style={{ fontSize: '9px', padding: '1px 6px' }}>
              {task.priority}
            </span>

            {task.actionPayload && (
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                style={{
                  background: 'var(--bg-surface-0)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {getActionIcon()}
                <span className="capitalize">{task.actionPayload.actionType.replace('_', ' ')}</span>
              </span>
            )}
          </div>

          <span className="text-[10px] text-zinc-500 truncate max-w-[90px] font-mono">
            {task.projectTitle}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="text-xs font-medium text-white leading-snug line-clamp-2">
          {task.title}
        </h4>

        {/* Description snippet */}
        <p className="mt-1 text-[11px] line-clamp-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {task.description}
        </p>

        {/* Dependencies badge if task is blocked or waiting */}
        {task.dependsOn && task.dependsOn.length > 0 && (
          <div
            className="mt-2 flex items-center gap-1.5 text-[10px] rounded px-2 py-1"
            style={{
              background: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ color: 'var(--status-warning)' }}>⚡</span>
            <span>
              {task.status === 'completed'
                ? 'Prerequisites satisfied'
                : `Blocked by ${task.dependsOn.length} dependency`}
            </span>
          </div>
        )}

        {/* Action Payload highlight if awaiting approval */}
        {isAwaitingApproval && task.actionPayload && (
          <div
            className="mt-2.5 rounded-md p-2 text-[11px]"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fef3c7',
            }}
          >
            <div className="font-medium flex items-center gap-1 mb-0.5" style={{ color: 'var(--status-warning)' }}>
              <ShieldAlert className="h-3 w-3" />
              <span>Requires Human Approval</span>
            </div>
            <div className="line-clamp-2 font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {task.actionPayload.recipient && `${task.actionPayload.recipient} • `}
              {task.actionPayload.messageContent}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Assigned Agent & Actions */}
      <div
        className="pt-2 flex items-center justify-between gap-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        {/* Assigned Agent */}
        {agent && (
          <div className="flex items-center gap-1.5" title={`Assigned to ${agent.name}`}>
            <span className="text-sm">{agent.avatar}</span>
            <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[80px]">
              {agent.name.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Action button */}
        {isAwaitingApproval ? (
          <button
            onClick={() => onReviewApproval(task)}
            className="flex items-center gap-1 rounded font-medium transition-all"
            style={{
              background: 'var(--status-warning)',
              color: '#000',
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <span>Review</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <button
            onClick={() => onInspectExecution(task)}
            className="text-[11px] text-zinc-400 hover:text-white font-medium transition-colors"
          >
            Logs ({task.executionLog.length})
          </button>
        )}
      </div>
    </div>
  );
}
