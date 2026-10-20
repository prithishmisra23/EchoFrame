'use client';

import React, { useState } from 'react';
import { useEchoFrame } from '@/lib/store';
import { ECHOFRAME_SUPABASE_SQL_SCHEMA, testSupabaseConnection } from '@/lib/supabase-client';
import { 
  X, 
  Key, 
  Database, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Globe,
  Sliders
} from 'lucide-react';

interface IntegrationsModalProps {
  onClose: () => void;
}

export function IntegrationsModal({ onClose }: IntegrationsModalProps) {
  const { 
    bolnaSettings, 
    saveBolnaSettings, 
    supabaseSettings, 
    saveSupabaseSettings, 
    resetToDefaultData 
  } = useEchoFrame();

  const [bolnaApiKey, setBolnaApiKey] = useState(bolnaSettings.apiKey);
  const [bolnaBaseUrl, setBolnaBaseUrl] = useState(bolnaSettings.baseUrl);
  const [bolnaSandbox, setBolnaSandbox] = useState(bolnaSettings.sandboxMode);
  const [bolnaTestResult, setBolnaTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [isTestingBolna, setIsTestingBolna] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState(supabaseSettings.url);
  const [supabaseKey, setSupabaseKey] = useState(supabaseSettings.anonKey);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  const [copiedSchema, setCopiedSchema] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestBolna = async () => {
    setIsTestingBolna(true);
    setBolnaTestResult(null);

    try {
      const res = await fetch('/api/bolna/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: bolnaApiKey,
          baseUrl: bolnaBaseUrl,
        }),
      });

      const data = await res.json();
      setBolnaTestResult({
        success: data.success,
        message: data.message,
        latency: data.latencyMs,
      });
    } catch (err: any) {
      setBolnaTestResult({
        success: false,
        message: `Network error: ${err.message}`,
      });
    } finally {
      setIsTestingBolna(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setSupabaseTestResult(res);
    setIsTestingSupabase(false);
  };

  const handleSave = () => {
    saveBolnaSettings({
      apiKey: bolnaApiKey,
      baseUrl: bolnaBaseUrl,
      sandboxMode: bolnaSandbox,
    });

    saveSupabaseSettings({
      url: supabaseUrl,
      anonKey: supabaseKey,
      enabled: Boolean(supabaseUrl && supabaseKey),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(ECHOFRAME_SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // Determine Bolna status label
  const bolnaStatusLabel = bolnaSandbox
    ? 'Demo Mode'
    : bolnaTestResult?.success
    ? 'Connected'
    : bolnaApiKey
    ? 'Test Required'
    : 'Not Configured';

  const supabaseStatusLabel = supabaseTestResult?.success
    ? 'Connected'
    : supabaseUrl && supabaseKey
    ? 'Test Required'
    : 'Not Configured';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'var(--bg-surface-2)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-subheading" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Integration Hub & Telephony
            </h2>
          </div>

          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Section 1: Bolna Voice AI */}
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">Bolna Voice AI</span>
                <span
                  className={`badge ${
                    bolnaStatusLabel === 'Connected'
                      ? 'badge-accent'
                      : bolnaStatusLabel === 'Demo Mode'
                      ? 'badge-warning'
                      : 'badge-neutral'
                  }`}
                  style={{ fontSize: '9px' }}
                >
                  {bolnaStatusLabel}
                </span>
              </div>
              <a
                href="https://bolna.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Documentation</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Purpose: Automated outbound attendee & speaker verification calls via SIP telephony.
            </p>

            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Bolna API Key
              </label>
              <input
                type="password"
                value={bolnaApiKey}
                onChange={(e) => setBolnaApiKey(e.target.value)}
                placeholder="bn_live_xxxxxxxxxxxxxxxx"
                className="input-field w-full text-xs font-mono"
              />
              <p className="mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                Key stays securely stored in browser session or local env. Never sent to untrusted third parties.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Endpoint Base URL
                </label>
                <input
                  type="text"
                  value={bolnaBaseUrl}
                  onChange={(e) => setBolnaBaseUrl(e.target.value)}
                  className="input-field w-full text-xs font-mono"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label
                  className="flex items-center gap-2 cursor-pointer rounded p-2 text-xs"
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bolnaSandbox}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setBolnaSandbox(val);
                      saveBolnaSettings({ sandboxMode: val });
                    }}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Sandbox Simulation</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestBolna}
                disabled={isTestingBolna}
                className="btn-secondary text-[11px]"
                style={{ padding: '5px 12px' }}
              >
                {isTestingBolna ? 'Testing Ping…' : 'Test Bolna Connection'}
              </button>

              {bolnaTestResult && (
                <span
                  className={`text-xs flex items-center gap-1 font-medium ${
                    bolnaTestResult.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {bolnaTestResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{bolnaTestResult.latency ? `${bolnaTestResult.latency}ms • ` : ''}{bolnaTestResult.message.slice(0, 40)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Sarvam AI Multilingual Engine */}
          <div
            className="rounded-lg p-4 space-y-2.5"
            style={{
              background: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">Sarvam AI Multilingual Engine</span>
                <span className="badge badge-accent" style={{ fontSize: '9px' }}>
                  Supported
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">10+ Indic Languages</span>
            </div>

            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Purpose: High-accuracy regional speech synthesis and transcription for multicultural conferences and global podcast guests.
            </p>

            <div
              className="rounded p-2 text-[11px] font-mono flex items-center justify-between"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Languages: Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati</span>
              <span className="text-zinc-500">TTS & ASR</span>
            </div>
          </div>

          {/* Section 3: Supabase Backend */}
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: 'var(--bg-surface-0)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">Supabase Cloud Database</span>
                <span
                  className={`badge ${
                    supabaseStatusLabel === 'Connected'
                      ? 'badge-accent'
                      : 'badge-neutral'
                  }`}
                  style={{ fontSize: '9px' }}
                >
                  {supabaseStatusLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="btn-secondary flex items-center gap-1 text-[11px]"
                style={{ padding: '3px 8px' }}
                title="Copy ready-to-run schema for Supabase SQL Editor"
              >
                {copiedSchema ? <Check className="h-3 w-3" style={{ color: 'var(--accent)' }} /> : <Copy className="h-3 w-3" />}
                <span>{copiedSchema ? 'SQL Copied!' : 'Export SQL Schema'}</span>
              </button>
            </div>

            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Purpose: Persistent storage for projects, agents, tasks, human approvals, and execution telemetry.
            </p>

            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="input-field w-full text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-caption font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Anon Public API Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="input-field w-full text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="btn-secondary text-[11px]"
                style={{ padding: '5px 12px' }}
              >
                {isTestingSupabase ? 'Testing…' : 'Verify Supabase Connection'}
              </button>

              {supabaseTestResult && (
                <span
                  className={`text-xs flex items-center gap-1 font-medium ${
                    supabaseTestResult.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {supabaseTestResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{supabaseTestResult.message}</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 4: Data Management */}
          <div
            className="pt-2 flex items-center justify-between text-caption"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>Reset test data to initial clean demonstration state:</span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all tasks, events, and agents to sample initial state?')) {
                  resetToDefaultData();
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-3.5"
          style={{
            background: 'var(--bg-surface-2)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
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
            <CheckCircle2 className="h-4 w-4" />
            <span>{savedSuccess ? 'Saved!' : 'Save Configurations'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
