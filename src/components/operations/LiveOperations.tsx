'use client';

import React, { useState } from 'react';
import { useEchoFrame } from '@/lib/store';
import { Task, TaskStatus, TaskPriority, DomainType } from '@/lib/types';
import { TaskItemCard } from './TaskItemCard';
import { ApprovalModal } from './ApprovalModal';
import { ExecutionDetailModal } from './ExecutionDetailModal';
import { 
  Activity, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Filter, 
  Search,
  X
} from 'lucide-react';

export function LiveOperations() {
  const { 
    tasks, 
    projects, 
    agents, 
    createTask, 
    activeApprovalTask, 
    setActiveApprovalTask, 
    activeExecutionResult, 
    setActiveExecutionResult,
    selectedProjectId,
    setSelectedProjectId
  } = useEchoFrame();

  const [filterDomain, setFilterDomain] = useState<'all' | 'event' | 'podcast'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [inspectingTask, setInspectingTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAgentId, setNewTaskAgentId] = useState(agents[0]?.id || '');
  const [newTaskProjectId, setNewTaskProjectId] = useState(projects[0]?.id || '');
  const [newTaskRequiresApproval, setNewTaskRequiresApproval] = useState(true);
  const [newTaskPhone, setNewTaskPhone] = useState('+1 (415) 555-0192');

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;
    const project = projects.find((p) => p.id === task.projectId);
    if (filterDomain !== 'all' && project && project.type !== filterDomain) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const columns: { id: TaskStatus; label: string; icon: any; color: string }[] = [
    { id: 'backlog', label: 'Queued', icon: Clock, color: 'text-zinc-400' },
    { id: 'in_progress', label: 'In Progress', icon: Activity, color: 'var(--accent)' },
    { id: 'awaiting_approval', label: 'Awaiting Approval', icon: ShieldAlert, color: 'var(--status-warning)' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'var(--accent)' },
    { id: 'failed', label: 'Failed / Rejected', icon: AlertOctagon, color: 'var(--status-error)' },
  ];

  const handleCreateNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTask({
      title: newTaskTitle,
      description: newTaskDesc,
      assignedAgentId: newTaskAgentId,
      projectId: newTaskProjectId,
      requiresApproval: newTaskRequiresApproval,
      priority: 'high',
      actionPayload: {
        actionType: 'voice_call',
        recipient: 'Direct Contact',
        phone: newTaskPhone,
        messageContent: newTaskDesc || newTaskTitle,
      },
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsCreatingTask(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-display flex items-center gap-2" style={{ fontSize: '1.25rem' }}>
              <Activity className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span>Live Operations</span>
            </h1>
            <span className="badge badge-accent">
              {tasks.length} Active Tasks
            </span>
          </div>
          <p className="text-body mt-1">
            Real-time multi-agent execution pipeline with human-in-the-loop authorization gates.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingTask(true)}
          className="btn-primary self-start sm:self-auto flex items-center gap-2"
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          <Plus className="h-4 w-4" />
          <span>Dispatch Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Filter Pills */}
          <div
            className="flex items-center gap-1 p-0.5 rounded-md"
            style={{
              background: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {(['all', 'event', 'podcast'] as const).map((dom) => (
              <button
                key={dom}
                onClick={() => setFilterDomain(dom)}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize"
                style={{
                  background: filterDomain === dom ? 'var(--bg-surface-2)' : 'transparent',
                  color: filterDomain === dom ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  border: filterDomain === dom ? '1px solid var(--border-strong)' : '1px solid transparent',
                }}
              >
                {dom === 'all' ? 'All Domains' : `${dom}s`}
              </button>
            ))}
          </div>

          {/* Project Filter Dropdown */}
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value ? e.target.value : null)}
            className="input-field text-xs"
            style={{ padding: '5px 10px', height: '32px', borderRadius: 'var(--radius-md)' }}
          >
            <option value="">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input-field text-xs"
            style={{ padding: '5px 10px', height: '32px', borderRadius: 'var(--radius-md)' }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {selectedProjectId && (
          <button
            onClick={() => setSelectedProjectId(null)}
            className="text-caption hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            Clear project filter
          </button>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
        {columns.map((col) => {
          const ColIcon = col.icon;
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isApprovalCol = col.id === 'awaiting_approval';

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-lg p-3 transition-all min-h-[460px]"
              style={{
                background: isApprovalCol
                  ? 'rgba(245, 158, 11, 0.03)'
                  : 'var(--bg-surface-0)',
                border: `1px solid ${
                  isApprovalCol
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'var(--border-subtle)'
                }`,
              }}
            >
              {/* Column Header */}
              <div
                className="flex items-center justify-between pb-2.5 mb-2.5"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-1.5">
                  <ColIcon className="h-3.5 w-3.5" style={{ color: col.color }} />
                  <span className="text-caption font-medium text-white">
                    {col.label}
                  </span>
                </div>
                <span
                  className={`badge ${
                    isApprovalCol && colTasks.length > 0
                      ? 'badge-warning'
                      : 'badge-neutral'
                  }`}
                  style={{ fontSize: '10px', padding: '1px 6px' }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[640px] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    No tasks in this lane
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskItemCard
                      key={task.id}
                      task={task}
                      onReviewApproval={(t) => setActiveApprovalTask(t)}
                      onInspectExecution={(t) => setInspectingTask(t)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Approval Modal */}
      {activeApprovalTask && (
        <ApprovalModal
          task={activeApprovalTask}
          onClose={() => setActiveApprovalTask(null)}
        />
      )}

      {/* Execution Detail Modal */}
      {(inspectingTask || activeExecutionResult) && (
        <ExecutionDetailModal
          task={inspectingTask}
          execution={activeExecutionResult}
          onClose={() => {
            setInspectingTask(null);
            setActiveExecutionResult(null);
          }}
        />
      )}

      {/* Dispatch New Task Modal */}
      {isCreatingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="relative w-full max-w-lg rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <button
              onClick={() => setIsCreatingTask(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-subheading" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Dispatch Task to Specialized Agent
            </h3>
            <p className="text-body mt-1 mb-4">
              Direct an agent to execute an autonomous action or stage an authorized voice call.
            </p>

            <form onSubmit={handleCreateNewTask} className="space-y-3.5">
              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Outbound confirmation call to keynote speaker..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Instructions / Voice Script
                </label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Describe what the agent should say or accomplish..."
                  className="input-field w-full text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Assign Agent
                  </label>
                  <select
                    value={newTaskAgentId}
                    onChange={(e) => setNewTaskAgentId(e.target.value)}
                    className="input-field w-full text-xs"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.avatar} {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Target Project
                  </label>
                  <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="input-field w-full text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Recipient Phone (Bolna Telephony)
                </label>
                <input
                  type="text"
                  value={newTaskPhone}
                  onChange={(e) => setNewTaskPhone(e.target.value)}
                  className="input-field w-full text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqApproval"
                  checked={newTaskRequiresApproval}
                  onChange={(e) => setNewTaskRequiresApproval(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <label htmlFor="reqApproval" className="text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  Require Human Supervisor Approval before dialing
                </label>
              </div>

              <div
                className="flex justify-end gap-2 pt-4"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreatingTask(false)}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '7px 18px', fontSize: '12px' }}
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
