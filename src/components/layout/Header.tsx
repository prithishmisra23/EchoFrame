'use client';

import React from 'react';
import { useEchoFrame } from '@/lib/store';
import { 
  Radio, 
  Mic, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenCreateProject: () => void;
  isInitialHome?: boolean;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ 
  onOpenSettings, 
  onOpenCreateProject,
  isInitialHome = false,
  showSidebar = true,
  onToggleSidebar,
}: HeaderProps) {
  const { 
    bolnaSettings, 
    tasks, 
    activeTab, 
    setActiveTab, 
    resetToDefaultData, 
    setActiveApprovalTask 
  } = useEchoFrame();

  const pendingApprovals = tasks.filter((t) => t.status === 'awaiting_approval');

  return (
    <header
      className="sticky top-0 z-40 w-full transition-all duration-300"
      style={{
        background: 'rgba(5, 5, 6, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:px-5">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border text-zinc-400 hover:text-white transition-colors"
              style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-default)' }}
              title={showSidebar ? 'Hide Workspace Sidebar' : 'Show Workspace Sidebar'}
            >
              {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          )}

          <button
            onClick={() => setActiveTab('operator')}
            className="flex items-center gap-2.5 group"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
                boxShadow: '0 2px 8px rgba(52, 211, 153, 0.15)',
              }}
            >
              <Radio className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Echo<span style={{ color: 'var(--accent)' }}>Frame</span>
                </span>
                <span
                  className="hidden sm:inline-flex badge badge-accent"
                  style={{ fontSize: '9px', letterSpacing: '0.05em' }}
                >
                  VOICE AI
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center: Status */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Bolna Status */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-default"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span className="status-dot status-dot-live" />
            <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>
              Bolna:
            </span>
            <span
              className="text-caption font-semibold"
              style={{ color: bolnaSettings.apiKey ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {bolnaSettings.apiKey ? 'Connected' : 'Sandbox'}
            </span>
          </button>

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 ? (
            <button
              onClick={() => {
                setActiveTab('operations');
                setActiveApprovalTask(pendingApprovals[0]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-default"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.15)',
              }}
            >
              <AlertTriangle className="h-3 w-3" style={{ color: 'var(--status-warning)' }} />
              <span className="text-caption font-semibold" style={{ color: '#fbbf24' }}>
                {pendingApprovals.length} Approval{pendingApprovals.length > 1 ? 's' : ''}
              </span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--accent)' }} />
              <span className="text-caption font-semibold" style={{ color: 'var(--accent)' }}>
                All Clear
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isInitialHome && !showSidebar ? (
            <>
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="btn-secondary flex items-center gap-1.5 text-xs font-medium px-3 py-1.5"
                  style={{
                    background: 'var(--bg-surface-1)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  title="Open Workspace Suite"
                >
                  <PanelLeft className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Workspace Suite</span>
                </button>
              )}
              <button
                onClick={onOpenSettings}
                className="btn-icon"
                title="Integrations & Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              {/* Voice Command */}
              <button
                onClick={() => setActiveTab('command')}
                className="btn-primary"
                style={
                  activeTab === 'command'
                    ? {}
                    : {
                        background: 'var(--bg-surface-2)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent-border)',
                        boxShadow: 'none',
                      }
                }
              >
                <Mic className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Voice</span>
              </button>

              {/* New Operation */}
              <button
                onClick={onOpenCreateProject}
                className="btn-secondary hidden lg:inline-flex"
              >
                <Layers className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                <span>New</span>
              </button>

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="btn-icon"
                title="Integrations & Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>

              {/* Reset */}
              <button
                onClick={() => {
                  if (confirm('Reset EchoFrame to sample data?')) {
                    resetToDefaultData();
                  }
                }}
                className="btn-icon"
                title="Reset Demo Data"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
