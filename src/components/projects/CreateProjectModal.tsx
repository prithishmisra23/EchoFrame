'use client';

import React, { useState } from 'react';
import { ProjectType } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  X, 
  Calendar, 
  Headphones, 
  Plus, 
  Sparkles 
} from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { createProject, agents } = useEchoFrame();

  const [type, setType] = useState<ProjectType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('Nov 20 - 22, 2026');
  const [locationOrPlatform, setLocationOrPlatform] = useState(
    type === 'event' ? 'San Francisco Convention Center' : 'Spotify, YouTube, Apple Podcasts'
  );
  const [tagInput, setTagInput] = useState('Voice AI, Agents');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Auto-assign agents based on domain
    const assignedAgentIds = agents
      .filter((a) => a.domain === type || a.domain === 'shared')
      .map((a) => a.id);

    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

    createProject({
      type,
      title: title.trim(),
      description: description.trim(),
      date,
      locationOrPlatform,
      assignedAgentIds,
      tags: tags.length > 0 ? tags : [type.toUpperCase()],
      speakers: type === 'event' ? [
        {
          id: `spk-${Date.now()}-1`,
          name: 'Sarah Connor',
          title: 'Director of AI Architecture',
          company: 'Cyberdyne Research',
          email: 's.connor@cyberdyne.org',
          phone: '+1 (415) 555-0144',
          sessionTitle: 'Real-time Autonomous Defense against Malicious Telephony',
          timeSlot: 'Day 1 • 10:00 AM',
          stage: 'Main Auditorium',
          status: 'pending_call',
        }
      ] : undefined,
      guests: type === 'podcast' ? [
        {
          id: `gst-${Date.now()}-1`,
          name: 'Alex Rivera',
          role: 'Lead Voice Researcher at SynthAudio',
          topic: 'Low-latency Conversational Stacks with WebRTC and Bolna',
          episodeNumber: 1,
          email: 'alex@synthaudio.ai',
          phone: '+1 (415) 555-0811',
          status: 'booked',
          recordingDate: 'Next Tuesday at 10:00 AM EST'
        }
      ] : undefined,
      agenda: type === 'event' ? [
        {
          id: `ag-${Date.now()}-1`,
          time: '09:00 AM',
          title: 'Opening Remarks & Host Kickoff',
          speaker: 'Nova Thorne (Voice MC)',
          stage: 'Main Auditorium',
          status: 'upcoming',
          durationMinutes: 30
        }
      ] : undefined,
    });

    onClose();
  };

  return (
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-subheading" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Create Production Workspace
          </h2>
        </div>
        <p className="text-body mb-4">
          Provision an operational pipeline with a coordinated team of specialized AI agents.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Domain Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => {
                setType('event');
                setLocationOrPlatform('San Francisco Convention Center');
              }}
              className="rounded-lg p-3 border cursor-pointer transition-all flex items-center gap-2.5"
              style={{
                background: type === 'event' ? 'var(--accent-subtle)' : 'var(--bg-surface-0)',
                borderColor: type === 'event' ? 'var(--accent-border)' : 'var(--border-subtle)',
              }}
            >
              <Calendar className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <div>
                <div className="text-xs font-semibold text-white">Conference / Event</div>
                <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>6 Event Agents</div>
              </div>
            </div>

            <div
              onClick={() => {
                setType('podcast');
                setLocationOrPlatform('Spotify, YouTube, Apple Podcasts');
              }}
              className="rounded-lg p-3 border cursor-pointer transition-all flex items-center gap-2.5"
              style={{
                background: type === 'podcast' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-surface-0)',
                borderColor: type === 'podcast' ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-subtle)',
              }}
            >
              <Headphones className="h-4 w-4 text-purple-400" />
              <div>
                <div className="text-xs font-semibold text-white">Podcast Show</div>
                <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>5 Podcast Agents</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'event' ? 'e.g. Quantum AI World Summit 2026' : 'e.g. The Synthetic Frontier'}
              className="input-field w-full text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key mission, audience profile, and operational goals..."
              className="input-field w-full text-xs resize-none"
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Schedule
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-full text-xs"
              />
            </div>

            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {type === 'event' ? 'Venue / Location' : 'Distribution Channels'}
              </label>
              <input
                type="text"
                value={locationOrPlatform}
                onChange={(e) => setLocationOrPlatform(e.target.value)}
                className="input-field w-full text-xs"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Voice AI, Telephony, Enterprise..."
              className="input-field w-full text-xs"
            />
          </div>

          {/* Actions */}
          <div
            className="pt-3 flex justify-end gap-2"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-1.5"
              style={{ padding: '7px 18px', fontSize: '12px' }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Initialize Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
