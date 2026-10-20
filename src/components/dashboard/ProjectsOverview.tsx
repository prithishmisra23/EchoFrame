'use client';

import React from 'react';
import { useEchoFrame } from '@/lib/store';
import { Project } from '@/lib/types';
import { 
  Calendar, 
  Headphones, 
  PhoneForwarded, 
  ArrowUpRight, 
  Clock, 
  Plus
} from 'lucide-react';

interface ProjectsOverviewProps {
  onSelectProject: (project: Project) => void;
  onOpenCreateModal: () => void;
  onOpenVoiceCampaign: (project: Project) => void;
}

export function ProjectsOverview({ onSelectProject, onOpenCreateModal, onOpenVoiceCampaign }: ProjectsOverviewProps) {
  const { projects, agents, setActiveTab, setSelectedProjectId } = useEchoFrame();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display flex items-center gap-2" style={{ fontSize: '1.15rem' }}>
            <span>Active Productions & Events</span>
            <span className="text-caption font-normal" style={{ color: 'var(--text-tertiary)' }}>
              ({projects.length} operational)
            </span>
          </h2>
          <p className="text-body mt-0.5">
            Coordinated multi-agent pipelines for conferences, stage host schedules, and podcast episodes.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn-primary flex items-center gap-1.5"
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {projects.map((project) => {
          const isEvent = project.type === 'event';
          const assignedAgents = agents.filter((a) => project.assignedAgentIds.includes(a.id));

          return (
            <div
              key={project.id}
              className="group relative rounded-lg p-4 transition-all flex flex-col justify-between"
              style={{
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                {/* Header: Type Badge & Status */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="badge"
                      style={{
                        fontSize: '10px',
                        background: isEvent ? 'var(--accent-subtle)' : 'rgba(168, 85, 247, 0.1)',
                        borderColor: isEvent ? 'var(--accent-border)' : 'rgba(168, 85, 247, 0.25)',
                        color: isEvent ? 'var(--accent)' : '#d8b4fe',
                      }}
                    >
                      {isEvent ? <Calendar className="h-3 w-3 mr-1 inline" /> : <Headphones className="h-3 w-3 mr-1 inline" />}
                      {isEvent ? 'Conference' : 'Podcast'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {project.status}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectProject(project)}
                    className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                    title="View Project Details"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Title & Description */}
                <h3 
                  onClick={() => onSelectProject(project)}
                  className="text-xs font-semibold text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                >
                  {project.title}
                </h3>
                <p className="mt-1 text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {project.description}
                </p>

                {/* Date & Location */}
                <div className="mt-2.5 flex items-center gap-2 text-caption">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <Clock className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                    <span>{project.date}</span>
                  </div>
                  <span className="text-zinc-600">•</span>
                  <span className="truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{project.locationOrPlatform}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span style={{ color: 'var(--text-tertiary)' }}>Pipeline Completion</span>
                    <span className="font-mono font-medium" style={{ color: 'var(--accent)' }}>
                      {project.metrics.progressPercent}%
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${project.metrics.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div
                  className="mt-3 grid grid-cols-3 gap-1 rounded p-2 text-center"
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Tasks</div>
                    <div className="text-[11px] font-semibold text-white mt-0.5">
                      {project.metrics.tasksCompleted}/{project.metrics.tasksTotal}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                      {isEvent ? 'Speakers' : 'Guests'}
                    </div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                      {project.speakers?.length || project.guests?.length || project.metrics.speakersOrGuestsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Calls Made</div>
                    <div className="text-[11px] font-semibold text-white mt-0.5">
                      {project.metrics.callsMadeCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: Assigned Agent Avatars & Quick Actions */}
              <div
                className="mt-3.5 pt-2.5 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                {/* Agent avatars stack */}
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1 overflow-hidden">
                    {assignedAgents.slice(0, 3).map((agent) => (
                      <div
                        key={agent.id}
                        title={`${agent.name} (${agent.title})`}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[11px] border border-zinc-700"
                      >
                        {agent.avatar}
                      </div>
                    ))}
                  </div>
                  {assignedAgents.length > 3 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      +{assignedAgents.length - 3}
                    </span>
                  )}
                </div>

                {/* Quick actions buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenVoiceCampaign(project)}
                    className="btn-secondary flex items-center gap-1 text-[11px]"
                    style={{ padding: '3px 8px' }}
                    title="Launch Bolna automated voice call campaign"
                  >
                    <PhoneForwarded className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                    <span>Voice</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setActiveTab('operations');
                    }}
                    className="btn-secondary text-[11px]"
                    style={{ padding: '3px 8px' }}
                  >
                    Tasks
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
