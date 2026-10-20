'use client';

import React, { useState } from 'react';
import { Agent, AgentTool, AutonomyLevel, DomainType } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  X, 
  Save, 
  Bot, 
  Mic, 
  Wrench, 
  BookOpen, 
  Shield, 
  Plus, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

interface AgentEditorModalProps {
  agent: Agent;
  onClose: () => void;
}

export function AgentEditorModal({ agent, onClose }: AgentEditorModalProps) {
  const { updateAgent } = useEchoFrame();

  const [name, setName] = useState(agent.name);
  const [title, setTitle] = useState(agent.title);
  const [domain, setDomain] = useState<DomainType>(agent.domain);
  const [avatar, setAvatar] = useState(agent.avatar);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(agent.autonomyLevel);
  const [voiceProvider, setVoiceProvider] = useState(agent.voiceConfig.provider);
  const [voiceName, setVoiceName] = useState(agent.voiceConfig.voiceName);
  const [pitch, setPitch] = useState(agent.voiceConfig.pitch);
  const [speed, setSpeed] = useState(agent.voiceConfig.speed);
  const [bolnaAgentId, setBolnaAgentId] = useState(agent.bolnaAgentId || '');
  const [tools, setTools] = useState<AgentTool[]>(agent.tools);
  const [activeTab, setActiveTab] = useState<'prompt' | 'voice' | 'tools' | 'knowledge'>('prompt');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [knowledgeDocs, setKnowledgeDocs] = useState(agent.knowledgeDocs);
  const [isSaved, setIsSaved] = useState(false);

  const handleToggleToolApproval = (toolId: string) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, requiresApproval: !t.requiresApproval } : t))
    );
  };

  const handleAddKnowledgeDoc = () => {
    if (!newDocTitle.trim()) return;
    setKnowledgeDocs((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        title: newDocTitle.trim(),
        size: '1.2 MB',
        type: newDocTitle.endsWith('.pdf') ? 'pdf' : 'doc',
        lastUpdated: 'Just now',
      },
    ]);
    setNewDocTitle('');
  };

  const handleDeleteKnowledgeDoc = (docId: string) => {
    setKnowledgeDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSave = () => {
    const updated: Agent = {
      ...agent,
      name,
      title,
      domain,
      avatar,
      systemPrompt,
      autonomyLevel,
      voiceConfig: {
        ...agent.voiceConfig,
        provider: voiceProvider,
        voiceName,
        pitch,
        speed,
      },
      bolnaAgentId,
      tools,
      knowledgeDocs,
    };

    updateAgent(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'var(--bg-surface-2)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-10 h-10 text-center text-xl rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-emerald-500"
              title="Change Emoji Avatar"
            />
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent font-semibold text-white text-base focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
                />
                <span
                  className="badge badge-accent uppercase font-mono"
                  style={{ fontSize: '9px' }}
                >
                  {domain} Agent
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent text-caption focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 mt-0.5 w-72"
                style={{ color: 'var(--text-secondary)' }}
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex px-6 gap-2 text-xs"
          style={{
            background: 'var(--bg-surface-0)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveTab('prompt')}
            className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
            style={{
              borderColor: activeTab === 'prompt' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'prompt' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Instructions & Persona</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
            style={{
              borderColor: activeTab === 'voice' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'voice' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Voice & Telephony</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
            style={{
              borderColor: activeTab === 'tools' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'tools' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Tools & Governance</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
            style={{
              borderColor: activeTab === 'knowledge' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'knowledge' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Knowledge Base ({knowledgeDocs.length})</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  System Prompt / Agent Operational Persona
                </label>
                <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Instructs the agent on how to engage with speakers, attendees, and guests. Define boundaries and tone.
                </p>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="input-field w-full font-mono text-xs leading-relaxed"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {/* Autonomy Level */}
              <div>
                <label className="text-caption font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Autonomy & Human-in-the-Loop Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setAutonomyLevel('full_autonomous')}
                    className="rounded-lg p-3 border cursor-pointer transition-all"
                    style={{
                      background: autonomyLevel === 'full_autonomous' ? 'var(--accent-subtle)' : 'var(--bg-surface-0)',
                      borderColor: autonomyLevel === 'full_autonomous' ? 'var(--accent-border)' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5" style={{ color: autonomyLevel === 'full_autonomous' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
                      Full Autonomous
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      Agent executes voice calls, emails, and schedule updates without manual supervisor authorization.
                    </p>
                  </div>

                  <div
                    onClick={() => setAutonomyLevel('require_approval')}
                    className="rounded-lg p-3 border cursor-pointer transition-all"
                    style={{
                      background: autonomyLevel === 'require_approval' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface-0)',
                      borderColor: autonomyLevel === 'require_approval' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5" style={{ color: autonomyLevel === 'require_approval' ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: 'var(--status-warning)' }} />
                      Require Approval (Human-in-Loop)
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      Consequential actions stage an authorization card on the Live Operations board before execution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Voice Synthesis Engine
                  </label>
                  <select
                    value={voiceProvider}
                    onChange={(e: any) => setVoiceProvider(e.target.value)}
                    className="input-field w-full text-xs"
                  >
                    <option value="bolna">Bolna Native TTS</option>
                    <option value="elevenlabs">ElevenLabs Neural Voice</option>
                    <option value="sarvam">Sarvam Multilingual Indian AI</option>
                    <option value="openai">OpenAI Whisper/TTS</option>
                  </select>
                </div>

                <div>
                  <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Voice Persona Preset
                  </label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Bolna Remote Agent ID (Optional)
                </label>
                <input
                  type="text"
                  value={bolnaAgentId}
                  onChange={(e) => setBolnaAgentId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="input-field w-full text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-caption mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Pitch:</span>
                    <span className="font-mono text-white">{pitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-caption mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Speech Speed:</span>
                    <span className="font-mono text-white">{speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3">
              <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                Equip the agent with operational tool capabilities. Toggle authorization policies for each tool.
              </p>

              <div className="space-y-2">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: 'var(--bg-surface-0)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white">{tool.name}</span>
                        <span
                          className={`badge ${tool.requiresApproval ? 'badge-warning' : 'badge-neutral'}`}
                          style={{ fontSize: '9px' }}
                        >
                          {tool.requiresApproval ? 'Gate: Approval' : 'Gate: Auto'}
                        </span>
                      </div>
                      <p className="text-caption mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {tool.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleToolApproval(tool.id)}
                      className="btn-secondary text-[11px]"
                      style={{ padding: '4px 10px' }}
                    >
                      {tool.requiresApproval ? 'Set Auto' : 'Require Review'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title (e.g. Speaker_Audio_Specs.pdf)..."
                  className="input-field flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddKnowledgeDoc}
                  className="btn-primary flex items-center gap-1.5"
                  style={{ padding: '6px 14px', fontSize: '11px' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Attach Doc</span>
                </button>
              </div>

              <div
                className="divide-y rounded-lg overflow-hidden"
                style={{
                  background: 'var(--bg-surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {knowledgeDocs.length === 0 ? (
                  <div className="p-4 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    No knowledge documents currently attached.
                  </div>
                ) : (
                  knowledgeDocs.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                        <div>
                          <div className="text-xs font-medium text-white">{doc.title}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {doc.size} • Updated {doc.lastUpdated}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteKnowledgeDoc(doc.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between px-6 py-3.5"
          style={{
            background: 'var(--bg-surface-2)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
            Changes persist to local state & Supabase backend.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-1.5"
              style={{ padding: '7px 18px', fontSize: '12px' }}
            >
              {isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{isSaved ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
