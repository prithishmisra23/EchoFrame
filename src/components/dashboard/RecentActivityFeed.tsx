'use client';

import React, { useState } from 'react';
import { useEchoFrame } from '@/lib/store';
import { 
  Activity, 
  PhoneCall, 
  ShieldAlert, 
} from 'lucide-react';

export function RecentActivityFeed() {
  const { activityLogs, setActiveApprovalTask, tasks, setActiveTab } = useEchoFrame();
  const [filter, setFilter] = useState<'all' | 'calls' | 'approvals' | 'tasks'>('all');

  const filteredLogs = activityLogs.filter((log) => {
    if (filter === 'calls') return log.type.includes('call');
    if (filter === 'approvals') return log.type.includes('approval');
    if (filter === 'tasks') return log.type === 'task_created' || log.type === 'alert';
    return true;
  });

  const filters = [
    { id: 'all' as const, label: `All (${activityLogs.length})` },
    { id: 'calls' as const, label: 'Calls' },
    { id: 'approvals' as const, label: 'Approvals' },
  ];

  return (
    <div className="surface-card p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="status-dot status-dot-live" />
            <h3 className="text-subheading">Activity Stream</h3>
          </div>
          <p className="text-caption mt-0.5">
            Real-time agent telemetry, telephony sessions, and supervisor actions.
          </p>
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-2.5 py-1 rounded-md transition-default"
              style={{
                fontSize: '11px',
                fontWeight: filter === f.id ? 600 : 500,
                background: filter === f.id ? 'var(--accent)' : 'var(--bg-surface-2)',
                color: filter === f.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f.id ? 'var(--accent)' : 'var(--border-default)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="mt-3 max-h-[360px] overflow-y-auto space-y-0.5">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-caption">
            No activity logs match the selected filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCall = log.type.includes('call');
            const isApproval = log.type.includes('approval');
            const isAlert = log.type === 'alert';

            const iconColor = isCall
              ? '#2dd4bf'
              : isApproval
              ? '#fbbf24'
              : isAlert
              ? '#f87171'
              : 'var(--accent)';

            const iconBg = isCall
              ? 'rgba(45, 212, 191, 0.08)'
              : isApproval
              ? 'rgba(251, 191, 36, 0.08)'
              : isAlert
              ? 'rgba(248, 113, 113, 0.08)'
              : 'var(--accent-subtle)';

            return (
              <div
                key={log.id}
                className="py-2.5 flex items-start justify-between gap-3 rounded-lg px-2 transition-default"
                style={{ cursor: 'default' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-0)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                    style={{ background: iconBg, color: iconColor }}
                  >
                    {isCall ? (
                      <PhoneCall className="h-3 w-3" />
                    ) : isApproval ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : (
                      <Activity className="h-3 w-3" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {log.agentName}
                      </span>
                      {log.projectTitle && (
                        <span className="badge badge-neutral" style={{ fontSize: '9px', padding: '0 5px' }}>
                          {log.projectTitle}
                        </span>
                      )}
                      <span className="text-caption" style={{ fontSize: '9px' }}>
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="mt-0.5 text-caption" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {log.message}
                    </p>

                    {log.details && (
                      <div
                        className="mt-1 text-caption font-mono px-2 py-1 rounded inline-block"
                        style={{
                          background: 'var(--bg-surface-0)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '10px',
                        }}
                      >
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>

                {log.type === 'approval_requested' && (
                  <button
                    onClick={() => {
                      const relatedTask = tasks.find((t) => t.status === 'awaiting_approval');
                      if (relatedTask) {
                        setActiveApprovalTask(relatedTask);
                        setActiveTab('operations');
                      }
                    }}
                    className="flex-shrink-0 badge badge-warning cursor-pointer transition-default"
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    Review
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
