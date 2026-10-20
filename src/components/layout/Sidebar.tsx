'use client';

import React from 'react';
import { useEchoFrame } from '@/lib/store';
import { EchoFrameTab } from '@/lib/types';
import { 
  LayoutDashboard, 
  Bot, 
  Mic2, 
  Activity, 
  CalendarRange, 
  Sliders, 
  PhoneCall, 
  Sparkles,
  Radio,
  Users,
} from 'lucide-react';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const { activeTab, setActiveTab, tasks, agents, projects } = useEchoFrame();

  if (!isOpen) return null;

  const pendingApprovalsCount = tasks.filter((t) => t.status === 'awaiting_approval').length;
  const inCallCount = agents.filter((a) => a.status === 'in_call').length;
  const bharatProject = projects.find((p) => p.id === 'proj-bharat-2026') || projects[0];
  const attendeeCount = bharatProject?.attendees?.length || 8;

  const navItems = [
    {
      id: 'operator',
      label: 'Event Operator',
      icon: Sparkles,
      highlight: true,
      description: 'Conversational Planner',
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Activity,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
      badgeColor: 'warning',
      description: 'Tasks & approvals',
    },
    {
      id: 'stage-host',
      label: 'AI Stage Host',
      icon: Radio,
      description: 'Live emcee & sessions',
    },
    {
      id: 'attendees',
      label: 'Personal AI & Roster',
      icon: Users,
      badge: `${attendeeCount}`,
      badgeColor: 'neutral',
      description: 'Attendee AI Companion',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & KPIs',
    },
    {
      id: 'agents',
      label: 'Agent Studio',
      icon: Bot,
      badge: `${agents.length}`,
      description: 'Roles & voice config',
    },
    {
      id: 'command',
      label: 'Voice Command',
      icon: Mic2,
      description: 'Natural language control',
    },
    {
      id: 'projects',
      label: 'Events & Podcasts',
      icon: CalendarRange,
      description: 'Projects & schedules',
    },
    {
      id: 'settings',
      label: 'Integrations',
      icon: Sliders,
      description: 'Bolna & Supabase',
    },
  ];

  return (
    <aside
      className="w-56 flex-shrink-0 hidden md:flex flex-col justify-between"
      style={{
        background: 'var(--bg-surface-0)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Navigation */}
      <div className="px-3 py-4 space-y-0.5">
        <div className="text-label px-3 pb-3">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as EchoFrameTab)}
              className="w-full group flex items-center justify-between rounded-lg px-3 py-2 text-left transition-default"
              style={{
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-default"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}
                    >
                      {item.label}
                    </span>
                    {item.highlight && (
                      <Sparkles className="h-2.5 w-2.5" style={{ color: 'var(--accent)', opacity: 0.7 }} />
                    )}
                  </div>
                  <span className="text-caption" style={{ fontSize: '10px' }}>
                    {item.description}
                  </span>
                </div>
              </div>

              {/* Badge */}
              {item.badge && (
                <span
                  className={`badge ${
                    item.badgeColor === 'warning' ? 'badge-warning' : 'badge-neutral'
                  }`}
                  style={{ fontSize: '9px', padding: '1px 6px' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div
          className="rounded-lg p-3"
          style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption flex items-center gap-1.5">
              <PhoneCall className="h-3 w-3" style={{ color: 'var(--accent)' }} />
              Telephony
            </span>
            <span
              className="badge badge-accent"
              style={{ fontSize: '8px', padding: '1px 5px' }}
            >
              BOLNA
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-caption">Active:</span>
            <span className="text-caption font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              {inCallCount > 0 && <span className="status-dot status-dot-live" />}
              {inCallCount} call{inCallCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 mt-3">
          <span className="text-caption" style={{ fontSize: '9px' }}>EchoFrame v1.0</span>
          <span className="text-caption flex items-center gap-1" style={{ fontSize: '9px', color: 'var(--accent)' }}>
            <span className="status-dot status-dot-live" style={{ width: '4px', height: '4px' }} />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
}
