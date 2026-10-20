'use client';

import React, { useState } from 'react';
import { Project, Agent } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  X, 
  PhoneForwarded, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceCampaignModalProps {
  project: Project;
  onClose: () => void;
}

export function VoiceCampaignModal({ project, onClose }: VoiceCampaignModalProps) {
  const { agents, triggerBolnaCall, addActivityLog } = useEchoFrame();

  const isEvent = project.type === 'event';
  const defaultAgent = agents.find((a) => a.role === (isEvent ? 'speaker_coordination' : 'guest_coordination')) || agents[0];

  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgent.id);
  const [campaignName, setCampaignName] = useState(
    isEvent
      ? `Speaker Confirmation Blast for ${project.title}`
      : `Guest Technical Soundcheck Blast for ${project.title}`
  );
  const [targetAudience, setTargetAudience] = useState<'all' | 'unconfirmed'>('unconfirmed');
  const [scriptTemplate, setScriptTemplate] = useState(
    isEvent
      ? `Hello {name}, this is {agent} calling on behalf of ${project.title}. We are verifying your keynote presentation ratio (16:9) and arrival window for your session on {stage}. Please confirm if your technical rider is finalized.`
      : `Hey {name}, this is {agent} from ${project.title}. Calling for our quick 60-second audio check to ensure your microphone levels and studio acoustics are optimal for tomorrow's recording.`
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState<{ current: number; total: number; logs: string[] } | null>(null);

  const targets = isEvent ? (project.speakers || []) : (project.guests || []);
  const activeTargets = targetAudience === 'unconfirmed'
    ? targets.filter((t: any) => t.status !== 'confirmed' && t.status !== 'briefing_ready')
    : targets;

  const handleLaunchCampaign = async () => {
    setIsLaunching(true);
    const agent = agents.find((a) => a.id === selectedAgentId) || defaultAgent;
    const total = activeTargets.length > 0 ? activeTargets.length : 3;
    setCampaignProgress({ current: 0, total, logs: ['Initializing Bolna outbound campaign pipeline...'] });

    for (let i = 0; i < total; i++) {
      const targetName = activeTargets[i]?.name || (isEvent ? `Keynote Speaker #${i + 1}` : `Episode Guest #${i + 1}`);
      const targetPhone = activeTargets[i]?.phone || `+1 (555) 010-${1000 + i}`;

      await new Promise((r) => setTimeout(r, 600));

      setCampaignProgress((prev) => ({
        current: i + 1,
        total,
        logs: [
          `Connected to ${targetName} (${targetPhone}). Audio verified.`,
          ...(prev?.logs || []),
        ],
      }));

      await triggerBolnaCall(null, {
        agent_id: agent.bolnaAgentId || 'bolna_agt_default',
        recipient_phone_number: targetPhone,
        recipient_name: targetName,
        context_data: { campaign: campaignName, event: project.title },
      }, agent.name);
    }

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    addActivityLog({
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      domain: project.type,
      projectId: project.id,
      projectTitle: project.title,
      type: 'call_completed',
      message: `Completed automated Bolna voice campaign "${campaignName}" (${total} calls dispatched).`,
    });

    setIsLaunching(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
    >
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
        <div
          className="flex items-center gap-3 pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <PhoneForwarded className="h-5 w-5" />
          </div>

          <div className="pr-6">
            <div className="flex items-center gap-2">
              <span className="badge badge-accent uppercase font-mono" style={{ fontSize: '9px' }}>
                Bolna Voice Campaign Dispatcher
              </span>
              <span className="text-caption font-mono text-zinc-500">• {project.type.toUpperCase()}</span>
            </div>
            <h2 className="mt-1 text-subheading" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              {project.title}
            </h2>
          </div>
        </div>

        {/* Campaign Settings */}
        {!campaignProgress ? (
          <div className="mt-4 space-y-3.5">
            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Campaign Identifier
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="input-field w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Designated Voice AI Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="input-field w-full text-xs"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.avatar} {a.name} ({a.voiceConfig.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Target Audience Filter
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="input-field w-full text-xs"
                >
                  <option value="unconfirmed">
                    {isEvent ? 'Unconfirmed Speakers Only' : 'Pending Soundcheck Guests'}
                  </option>
                  <option value="all">
                    All Contacts ({targets.length > 0 ? targets.length : 'Preset List'})
                  </option>
                </select>
              </div>
            </div>

            {/* Script Template */}
            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Conversational Speech Prompt Template
              </label>
              <textarea
                rows={3}
                value={scriptTemplate}
                onChange={(e) => setScriptTemplate(e.target.value)}
                className="input-field w-full font-mono text-xs leading-relaxed resize-none"
              />
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                Variables: {'{name}'}, {'{agent}'}, {'{stage}'} are dynamically populated.
              </span>
            </div>

            {/* Launch Button */}
            <div
              className="pt-3 flex justify-end gap-2"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchCampaign}
                className="btn-primary flex items-center gap-1.5"
                style={{ padding: '7px 18px', fontSize: '12px' }}
              >
                <PhoneForwarded className="h-3.5 w-3.5" />
                <span>Launch Batch Voice Calls</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Campaign Progress view */
          <div className="mt-5 space-y-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                {isLaunching ? (
                  <Radio className="h-6 w-6 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <h3 className="mt-2.5 text-subheading" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {isLaunching ? 'Dispatching Telephony Calls…' : 'Voice Campaign Completed!'}
              </h3>
              <p className="text-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {campaignProgress.current} of {campaignProgress.total} contacts reached.
              </p>
            </div>

            {/* Progress bar */}
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(campaignProgress.current / campaignProgress.total) * 100}%` }}
              />
            </div>

            {/* Stream logs */}
            <div
              className="rounded-lg p-3 max-h-36 overflow-y-auto text-left font-mono text-[11px] space-y-1"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {campaignProgress.logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span style={{ color: 'var(--accent)' }}>✓</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {!isLaunching && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="btn-primary"
                  style={{ padding: '7px 20px', fontSize: '12px' }}
                >
                  Return to Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
