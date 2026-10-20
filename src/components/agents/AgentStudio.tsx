'use client';

import React, { useState } from 'react';
import { useEchoFrame } from '@/lib/store';
import { Agent, DomainType } from '@/lib/types';
import { AgentCard } from './AgentCard';
import { AgentEditorModal } from './AgentEditorModal';
import { VoicePreviewModal } from './VoicePreviewModal';
import { 
  Bot, 
  Search, 
  Plus, 
  Calendar, 
  Headphones,
  SlidersHorizontal
} from 'lucide-react';

export function AgentStudio() {
  const { agents, createAgent } = useEchoFrame();

  const [filterDomain, setFilterDomain] = useState<'all' | 'event' | 'podcast'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [previewingVoiceAgent, setPreviewingVoiceAgent] = useState<Agent | null>(null);

  const filteredAgents = agents.filter((agent) => {
    if (filterDomain !== 'all' && agent.domain !== filterDomain) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.title.toLowerCase().includes(q) ||
        agent.systemPrompt.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const eventCount = agents.filter((a) => a.domain === 'event').length;
  const podcastCount = agents.filter((a) => a.domain === 'podcast').length;

  const handleCreateAgent = () => {
    const created = createAgent({
      name: 'Custom Voice Agent',
      title: 'Specialized Operations Associate',
      domain: filterDomain === 'podcast' ? 'podcast' : 'event',
      role: 'custom',
      avatar: '🤖',
      autonomyLevel: 'require_approval',
      systemPrompt: 'You are a specialized EchoFrame agent coordinated across events and podcasts.',
    });
    setEditingAgent(created);
  };

  return (
    <div className="space-y-5">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-display flex items-center gap-2" style={{ fontSize: '1.25rem' }}>
              <Bot className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span>Agent Studio</span>
            </h1>
            <span className="badge badge-accent">
              {agents.length} Specialized Agents
            </span>
          </div>
          <p className="text-body mt-1">
            Configure system prompts, voice personas, knowledge sources, and governance policies for each specialized AI worker.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleCreateAgent}
          className="btn-primary self-start sm:self-auto flex items-center gap-2"
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          <Plus className="h-4 w-4" />
          <span>Provision Agent</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Domain Filter Pills */}
        <div
          className="flex items-center gap-1 p-0.5 rounded-md w-full sm:w-auto"
          style={{
            background: 'var(--bg-surface-0)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setFilterDomain('all')}
            className="flex-1 sm:flex-none px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: filterDomain === 'all' ? 'var(--bg-surface-2)' : 'transparent',
              color: filterDomain === 'all' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: filterDomain === 'all' ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
          >
            All Agents ({agents.length})
          </button>

          <button
            onClick={() => setFilterDomain('event')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: filterDomain === 'event' ? 'var(--bg-surface-2)' : 'transparent',
              color: filterDomain === 'event' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: filterDomain === 'event' ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
          >
            <Calendar className="h-3 w-3" />
            <span>Events ({eventCount})</span>
          </button>

          <button
            onClick={() => setFilterDomain('podcast')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: filterDomain === 'podcast' ? 'var(--bg-surface-2)' : 'transparent',
              color: filterDomain === 'podcast' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: filterDomain === 'podcast' ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
          >
            <Headphones className="h-3 w-3" />
            <span>Podcasts ({podcastCount})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by role or prompt..."
            className="input-field w-full text-xs pl-8"
            style={{ height: '32px', borderRadius: 'var(--radius-md)' }}
          />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={(a) => setEditingAgent(a)}
            onTestVoice={(a) => setPreviewingVoiceAgent(a)}
          />
        ))}
      </div>

      {/* Agent Editor Modal */}
      {editingAgent && (
        <AgentEditorModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}

      {/* Voice Preview Modal */}
      {previewingVoiceAgent && (
        <VoicePreviewModal
          agent={previewingVoiceAgent}
          onClose={() => setPreviewingVoiceAgent(null)}
        />
      )}
    </div>
  );
}
