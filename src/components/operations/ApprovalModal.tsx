'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  X, 
  ShieldAlert, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle
} from 'lucide-react';

interface ApprovalModalProps {
  task: Task;
  onClose: () => void;
}

export function ApprovalModal({ task, onClose }: ApprovalModalProps) {
  const { approveTask, rejectTask, agents, bolnaSettings } = useEchoFrame();
  const agent = agents.find((a) => a.id === task.assignedAgentId);

  const [messageContent, setMessageContent] = useState(task.actionPayload?.messageContent || '');
  const [recipientPhone, setRecipientPhone] = useState(task.actionPayload?.phone || '');
  const [supervisorComments, setSupervisorComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isVoiceCall = task.actionPayload?.actionType === 'voice_call';

  const handleApprove = async () => {
    if (isSubmitting) return;
    const cleanPhone = recipientPhone.trim().replace(/[\s\-\(\)]/g, '');
    if (isVoiceCall) {
      if (!cleanPhone) {
        alert('Recipient phone number is required for outbound calls.');
        return;
      }
      if (!cleanPhone.startsWith('+')) {
        alert('Phone number must include an international country code (e.g., +91XXXXXXXXXX or +1XXXXXXXXXX).');
        return;
      }
      if (!/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
        alert('Invalid phone number format. Please provide a valid E.164 phone number starting with + and country code (e.g. +91XXXXXXXXXX).');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const updatedTask: Task = {
        ...task,
        actionPayload: task.actionPayload
          ? {
              ...task.actionPayload,
              phone: cleanPhone,
              messageContent,
            }
          : undefined,
      };
      await approveTask(task.id, supervisorComments, updatedTask);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason for agent feedback.');
      return;
    }
    rejectTask(task.id, rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="relative w-full max-w-xl rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--status-warning)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div className="pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                Human-in-the-Loop Review
              </span>
              <span className="text-caption text-zinc-500">•</span>
              <span className="text-caption font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                Priority: {task.priority}
              </span>
            </div>
            <h2 className="mt-1 text-subheading" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              {task.title}
            </h2>
            <p className="text-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Project: <span style={{ color: 'var(--text-secondary)' }}>{task.projectTitle}</span>
            </p>
          </div>
        </div>

        {/* Agent Info & Provider Rationale */}
        <div
          className="mt-4 rounded-lg p-3 flex items-center justify-between"
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{agent?.avatar || '🤖'}</span>
            <div>
              <div className="text-xs font-medium text-white">{agent?.name}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{agent?.title}</div>
            </div>
          </div>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded border"
            style={{
              background: bolnaSettings.apiKey && !bolnaSettings.sandboxMode
                ? 'var(--accent-subtle)'
                : 'rgba(245, 158, 11, 0.1)',
              borderColor: bolnaSettings.apiKey && !bolnaSettings.sandboxMode
                ? 'var(--accent-border)'
                : 'rgba(245, 158, 11, 0.3)',
              color: bolnaSettings.apiKey && !bolnaSettings.sandboxMode
                ? 'var(--accent)'
                : 'var(--status-warning)',
            }}
          >
            {bolnaSettings.apiKey && !bolnaSettings.sandboxMode ? 'Bolna Cloud Live' : 'Labelled Sandbox Mode'}
          </span>
        </div>

        {/* Action Payload Details */}
        <div className="mt-4 space-y-3">
          {task.actionPayload && (
            <div
              className="rounded-lg p-3.5 space-y-2.5"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Action Target
                </span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>
                  {task.actionPayload.recipient || 'Audience'}
                </span>
              </div>

              {isVoiceCall && (
                <div
                  className="space-y-1 pt-1.5"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Recipient Phone (E.164 with Country Code)
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">e.g. +91XXXXXXXXXX / +1XXXXXXXXXX</span>
                  </div>
                  <div className="relative mt-1">
                    <PhoneCall className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-400" />
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="input-field w-full pl-8 font-mono text-xs"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    />
                    <p className="text-[10px] mt-1 text-zinc-400">
                      ℹ️ <em>Bolna Trial Restriction:</em> Calls can only be dialed to phone numbers verified in your Bolna dashboard (<a href="https://platform.bolna.ai/" target="_blank" rel="noreferrer" className="text-amber-400 underline hover:text-amber-300">platform.bolna.ai</a>) or the number verified during sign-up.
                    </p>
                  </div>
                </div>
              )}

              {isVoiceCall && (
                <div
                  className="p-2.5 rounded-lg flex items-start gap-2 text-xs"
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24',
                  }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Outbound Voice Call Authorization:</span> Requires explicit human approval. Call dispatches via agent <strong>{agent?.name || 'Aria Vance'} (yellow-thomas-5037)</strong> to <strong>{recipientPhone || 'the phone number'}</strong>.
                  </div>
                </div>
              )}

              {/* Editable Message or Speech Script */}
              <div
                className="pt-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {isVoiceCall ? 'Bolna Spoken Call Script:' : 'Action Message Content:'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Supervisor Editable</span>
                </div>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  className="input-field w-full font-mono text-xs leading-relaxed"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>
          )}

          {/* Supervisor Comments Input */}
          {!showRejectInput && (
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Supervisor Approval Note (Optional):
              </label>
              <input
                type="text"
                value={supervisorComments}
                onChange={(e) => setSupervisorComments(e.target.value)}
                placeholder="e.g. Authorized to dial; verified speaker time slot..."
                className="input-field w-full text-xs"
                style={{ borderRadius: 'var(--radius-md)' }}
              />
            </div>
          )}

          {/* Reject Input */}
          {showRejectInput && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <label className="text-xs font-medium text-red-300 block">
                Reason for Rejection (Instructs Agent for Correction):
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Speaker time postponed to Day 2; reschedule outreach..."
                className="input-field w-full text-xs"
                style={{ borderRadius: 'var(--radius-md)' }}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="btn-danger"
                  style={{ padding: '4px 12px', fontSize: '11px' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showRejectInput && (
          <div
            className="mt-6 flex items-center justify-between gap-3 pt-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={isSubmitting}
              className="btn-secondary flex items-center gap-1.5 text-red-400 hover:text-red-300"
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              <XCircle className="h-4 w-4" />
              <span>Reject Action</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
              style={{ padding: '8px 18px', fontSize: '12px' }}
            >
              <CheckCircle2 className="h-4 w-4 fill-current" />
              <span>
                {isSubmitting
                  ? 'Authorizing…'
                  : isVoiceCall
                  ? 'Approve & Trigger Voice Call'
                  : 'Approve & Execute Action'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
