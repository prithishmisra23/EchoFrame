'use client';

import React from 'react';
import { useEchoFrame } from '@/lib/store';
import { 
  Calendar, 
  Headphones, 
  Bot, 
  PhoneCall, 
  AlertOctagon, 
  TrendingUp
} from 'lucide-react';

export function StatCards() {
  const { projects, agents, tasks, setActiveTab, setActiveApprovalTask } = useEchoFrame();

  const events = projects.filter((p) => p.type === 'event');
  const podcasts = projects.filter((p) => p.type === 'podcast');
  const totalCalls = agents.reduce((acc, a) => acc + a.totalCallsCompleted, 0);
  const pendingApprovals = tasks.filter((t) => t.status === 'awaiting_approval');
  const totalAttendees = events.reduce((acc, e) => acc + (e.metrics.registeredAttendeesCount || 0), 0);

  const cards = [
    {
      label: 'Events',
      value: events.length,
      sub: `${totalAttendees.toLocaleString()} attendees`,
      icon: Calendar,
      color: 'var(--accent)',
      bg: 'var(--accent-subtle)',
      borderColor: 'var(--accent-border)',
      onClick: () => setActiveTab('projects'),
    },
    {
      label: 'Podcasts',
      value: podcasts.length,
      sub: 'Active shows',
      icon: Headphones,
      color: '#a78bfa',
      bg: 'rgba(167, 139, 250, 0.08)',
      borderColor: 'rgba(167, 139, 250, 0.15)',
      onClick: () => setActiveTab('projects'),
    },
    {
      label: 'Agents',
      value: agents.length,
      sub: 'Bolna synced',
      icon: Bot,
      color: 'var(--accent)',
      bg: 'var(--accent-subtle)',
      borderColor: 'var(--accent-border)',
      onClick: () => setActiveTab('agents'),
    },
    {
      label: 'Voice Calls',
      value: totalCalls,
      sub: 'Sub-200ms latency',
      icon: PhoneCall,
      color: '#2dd4bf',
      bg: 'rgba(45, 212, 191, 0.08)',
      borderColor: 'rgba(45, 212, 191, 0.15)',
      onClick: () => setActiveTab('operations'),
    },
    {
      label: 'Approvals',
      value: pendingApprovals.length,
      sub: pendingApprovals.length > 0 ? 'Action needed' : 'All clear',
      icon: AlertOctagon,
      color: pendingApprovals.length > 0 ? '#fbbf24' : 'var(--text-tertiary)',
      bg: pendingApprovals.length > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface-2)',
      borderColor: pendingApprovals.length > 0 ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-default)',
      onClick: () => {
        setActiveTab('operations');
        if (pendingApprovals.length > 0) setActiveApprovalTask(pendingApprovals[0]);
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.label}
            onClick={card.onClick}
            className="surface-card-interactive p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-caption">{card.label}</span>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: card.bg, color: card.color, border: `1px solid ${card.borderColor}` }}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {card.value}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {card.label === 'Voice Calls' && (
                  <TrendingUp className="h-3 w-3" style={{ color: card.color }} />
                )}
                {card.label === 'Agents' && (
                  <span className="status-dot status-dot-live" />
                )}
                <span className="text-caption" style={{ color: card.color !== 'var(--text-tertiary)' ? card.color : undefined }}>
                  {card.sub}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
