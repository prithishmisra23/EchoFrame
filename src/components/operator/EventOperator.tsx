'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEchoFrame } from '@/lib/store';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  ArrowRight, 
  Bot, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  PhoneCall,
  Clock,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { ConversationMessage, EventBrief } from '@/lib/types';

interface QuickPrompt {
  lang: string;
  badge: string;
  text: string;
}

const EXAMPLE_PROMPTS: QuickPrompt[] = [
  {
    lang: 'Think for Bharat',
    badge: 'BHARAT',
    text: "Host Think for Bharat 1.0 hackathon at Bharat Mandapam with 2400 attendees, stage mic announcements, and personal AI companions for all participants.",
  },
  {
    lang: 'English',
    badge: 'EN',
    text: "I'm organizing a 3-day AI conference in San Francisco with 500 attendees and 20 speakers. I need to confirm speakers, send reminders, and set up an attendee hotline.",
  },
  {
    lang: 'हिन्दी',
    badge: 'HI',
    text: "2 दिन का टेक फेस्ट दिल्ली में, 1000 छात्र, 15 कॉलेज, स्पॉन्सर और चीफ गेस्ट कोऑर्डिनेशन चाहिए",
  },
  {
    lang: 'தமிழ்',
    badge: 'TA',
    text: "சென்னையில் 1 நாள் இசை திருவிழா, 300 பேர், 5 கலைஞர்கள், டிக்கெட் மற்றும் வரவேற்பு",
  },
  {
    lang: 'Podcast',
    badge: 'POD',
    text: "Weekly AI founders podcast series: need guest technical soundcheck calls, dossier research, and post-production show notes.",
  },
];

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).substring(2, 7)}`;
}

export function formatMessageContent(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"message"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.message === 'string') {
        return parsed.message;
      }
    } catch {
      const match = trimmed.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
      if (match) return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
  }
  return content;
}

export interface EventOperatorProps {
  onStartConversation?: () => void;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function EventOperator({ onStartConversation }: EventOperatorProps = {}) {
  const {
    eventBrief,
    updateEventBrief,
    conversationMessages,
    addConversationMessage,
    conversationPhase,
    setConversationPhase,
    launchEventFromBrief,
  } = useEchoFrame();

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'auto' | 'en' | 'hi' | 'ta'>('auto');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showBriefPanel, setShowBriefPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages, scrollToBottom]);

  // Check Web Speech API support asynchronously to prevent cascading renders
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRec) {
      const timer = setTimeout(() => {
        setSpeechSupported(true);
      }, 0);

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      return () => {
        clearTimeout(timer);
        try { rec.abort(); } catch {}
      };
    }
  }, []);

  // Auto-recover event brief if stored conversation has extracted details
  useEffect(() => {
    if (!eventBrief?.name && conversationMessages.length > 0) {
      for (const msg of [...conversationMessages].reverse()) {
        if (msg.briefUpdates?.name) {
          updateEventBrief(msg.briefUpdates);
          break;
        }
        if (typeof msg.content === 'string' && msg.content.includes('"name":')) {
          const nameMatch = msg.content.match(/"name"\s*:\s*"([^"]+)"/);
          if (nameMatch) {
            updateEventBrief({ name: nameMatch[1] });
            break;
          }
        }
      }
    }
  }, [conversationMessages, eventBrief?.name, updateEventBrief]);

  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const langCode = selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'ta' ? 'ta-IN' : 'en-US';
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsRecording(false);
      }
    }
  };

  // Adjust textarea height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Send message to LLM orchestrator
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if (!messageText || isLoading) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    if (conversationMessages.length === 0) {
      onStartConversation?.();
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ConversationMessage = {
      id: nextId('msg-user'),
      role: 'user',
      content: messageText,
      timestamp: timeStr,
    };

    addConversationMessage(userMsg);
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);
    setConversationPhase('understanding');

    try {
      const allMessages = [...conversationMessages, userMsg];
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          currentBrief: eventBrief,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to communicate with event orchestrator');
      }

      // Safeguard: If data.message is a raw JSON string, unpack it safely
      let cleanContent = data.message;
      let briefUpdates = data.briefUpdates;
      let agentSuggestions = data.agentSuggestions;
      let proposedTasks = data.proposedTasks;
      let readyForPlanning = data.readyForPlanning;

      if (typeof cleanContent === 'string' && cleanContent.trim().startsWith('{') && cleanContent.includes('"message"')) {
        try {
          const innerParsed = JSON.parse(cleanContent);
          if (innerParsed.message) cleanContent = innerParsed.message;
          if (innerParsed.briefUpdates && !briefUpdates) briefUpdates = innerParsed.briefUpdates;
          if (innerParsed.agentSuggestions && !agentSuggestions) agentSuggestions = innerParsed.agentSuggestions;
          if (innerParsed.proposedTasks && !proposedTasks) proposedTasks = innerParsed.proposedTasks;
          if (innerParsed.readyForPlanning !== undefined) readyForPlanning = innerParsed.readyForPlanning;
        } catch {
          const msgMatch = cleanContent.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
          if (msgMatch) cleanContent = msgMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
          const nameMatch = cleanContent.match(/"name"\s*:\s*"([^"]+)"/);
          if (nameMatch) {
            briefUpdates = { ...(briefUpdates || {}), name: nameMatch[1] };
          }
        }
      }

      // Update brief with new extracted fields
      if (briefUpdates) {
        updateEventBrief(briefUpdates);
        setShowBriefPanel(true);
      }

      const assistantMsg: ConversationMessage = {
        id: nextId('msg-ast'),
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        briefUpdates,
        agentSuggestions,
        proposedTasks,
        readyForPlanning,
      };

      addConversationMessage(assistantMsg);

      if (readyForPlanning) {
        setConversationPhase('briefReady');
        setShowBriefPanel(true);
      } else {
        setConversationPhase('clarifying');
      }
    } catch (err: unknown) {
      console.error('Orchestrator error:', err);
      const fallbackMsg: ConversationMessage = {
        id: nextId('msg-ast'),
        role: 'assistant',
        content: `I've noted that! Let's continue shaping the details. Could you tell me a bit more about the venue and dates?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addConversationMessage(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchOperations = async () => {
    // Find the latest message with proposed tasks and agent suggestions
    const latestPlanMsg = [...conversationMessages]
      .reverse()
      .find((m) => m.role === 'assistant' && (m.proposedTasks || m.agentSuggestions));

    const briefToLaunch: EventBrief = {
      id: eventBrief?.id || `brief-${Date.now()}`,
      name: eventBrief?.name || 'Upcoming AI Conference 2026',
      type: eventBrief?.type || 'conference',
      description: eventBrief?.description || 'Event organized via EchoFrame AI Event Operator',
      date: eventBrief?.date || 'Upcoming 2026',
      venue: eventBrief?.venue || 'Main Auditorium',
      expectedAttendance: eventBrief?.expectedAttendance || 500,
      status: 'active',
      createdAt: eventBrief?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await launchEventFromBrief(
      briefToLaunch,
      latestPlanMsg?.proposedTasks,
      latestPlanMsg?.agentSuggestions
    );
  };

  // Find latest agent suggestions and proposed tasks from conversation
  const latestSuggestions = [...conversationMessages]
    .reverse()
    .find((m) => m.agentSuggestions && m.agentSuggestions.length > 0)?.agentSuggestions || [];

  const latestTasks = [...conversationMessages]
    .reverse()
    .find((m) => m.proposedTasks && m.proposedTasks.length > 0)?.proposedTasks || [];

  const isBriefReady = conversationPhase === 'briefReady' || latestTasks.length > 0;

  // =========================================================================
  // VIEW 1: HERO HOME PAGE (When conversation is empty)
  // The middle part is the home page. Clean, expansive, distraction-free.
  // =========================================================================
  if (conversationMessages.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center py-6 sm:py-12 px-3 animate-in fade-in duration-300">
        {/* Glow ambient background effect */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, #6366f1 70%, transparent 100%)' }}
        />

        {/* Emblem Bot Icon */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #4f46e5 0%, #0f172a 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 10px 40px rgba(79, 70, 229, 0.25)',
          }}
        >
          <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-300" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>EchoFrame AI Event Operator</span>
          <span className="w-1 h-1 rounded-full bg-indigo-400" />
          <span className="text-zinc-400 text-[11px] font-normal">Multilingual Voice Operations</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Tell us what you&apos;re bringing to life
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Describe your conference, summit, festival, or podcast in your own words. EchoFrame understands the scale, drafts the operational brief, and assigns autonomous voice agents.
        </p>

        {/* Central Prominent Input Canvas */}
        <div className="w-full max-w-2xl surface-card rounded-2xl border p-3 sm:p-4 shadow-2xl transition-all hover:border-indigo-500/40 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 mb-8"
          style={{ background: 'var(--bg-surface-1)', borderColor: isRecording ? 'var(--accent)' : 'var(--border-default)' }}
        >
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tell us what you're bringing to life (English, हिन्दी, தமிழ்)..."
              rows={3}
              className="w-full bg-transparent p-2 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
              style={{ minHeight: '84px' }}
            />

            {/* Dictation Indicator */}
            {isRecording && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold animate-pulse border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                Listening...
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg border text-xs"
              style={{ background: 'var(--bg-surface-0)', borderColor: 'var(--border-subtle)' }}
            >
              <Globe className="h-3 w-3 text-zinc-400 ml-1.5" />
              {(['auto', 'en', 'hi', 'ta'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedLang === lang
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang === 'auto' ? 'Auto' : lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'தமிழ்'}
                </button>
              ))}
            </div>

            {/* Mic & Send Buttons */}
            <div className="flex items-center gap-2">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  title={isRecording ? 'Stop Recording' : 'Voice Input'}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg'
                      : 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isLoading}
                className="btn-primary px-4 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                <span>Plan Event</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Example Prompts Cards */}
        <div className="w-full max-w-2xl text-left space-y-2.5">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 px-1">
            Or click a sample brief to get started:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt.text)}
                className="p-3.5 rounded-xl border text-left transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 group relative overflow-hidden"
                style={{
                  background: 'var(--bg-surface-1)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                    {prompt.badge}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-2 leading-relaxed">
                  {prompt.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE CONVERSATIONAL WORKSPACE
  // "After that the rest of bar etc. should come up"
  // Shows multi-turn conversation, squad assignment, and live event brief drawer
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top Header / Mode Bar */}
      <div className="flex items-center justify-between px-2 pt-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
              color: 'var(--text-inverse)',
            }}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-heading text-base font-bold tracking-tight">AI Event Operator</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
                Active Session
              </span>
            </div>
            <p className="text-caption text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Interactive planning with autonomous multi-agent coordination.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg border text-xs"
            style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-default)' }}
          >
            <Globe className="h-3.5 w-3.5 text-zinc-400 ml-1" />
            {(['auto', 'en', 'hi', 'ta'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedLang === lang
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang === 'auto' ? 'Auto' : lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'தமிழ்'}
              </button>
            ))}
          </div>

          {/* Toggle Brief Panel */}
          {eventBrief && (
            <button
              onClick={() => setShowBriefPanel(!showBriefPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                background: showBriefPanel ? 'var(--accent-subtle)' : 'var(--bg-surface-1)',
                borderColor: showBriefPanel ? 'var(--accent-border)' : 'var(--border-default)',
                color: showBriefPanel ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Event Brief</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Conversation Column */}
        <div className="flex-1 flex flex-col surface-card overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-default)' }}>
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {conversationMessages.length === 0 ? (
              /* Initial First-Screen Empty State */
              <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto py-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #4f46e5 0%, #1e1b4b 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <Bot className="h-8 w-8 text-indigo-300" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500" />
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                  Tell us what you&apos;re bringing to life
                </h2>
                <p className="text-sm max-w-md mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
                  EchoFrame understands your conference, summit, festival, or podcast, drafts the operational brief, and assigns autonomous voice agents.
                </p>

                {/* Example Prompts Carousel */}
                <div className="w-full text-left space-y-2">
                  <div className="text-[11px] font-semibold tracking-wider uppercase px-1" style={{ color: 'var(--text-tertiary)' }}>
                    Try an example to get started:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXAMPLE_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt.text)}
                        className="p-3 rounded-xl border text-left transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 group relative overflow-hidden"
                        style={{
                          background: 'var(--bg-surface-1)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                            {prompt.badge}
                          </span>
                          <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {prompt.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Conversation Messages */
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow"
                      style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)' }}
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'border rounded-bl-none'
                    }`}
                    style={{
                      background: msg.role === 'user' ? undefined : 'var(--bg-surface-1)',
                      borderColor: msg.role === 'user' ? undefined : 'var(--border-default)',
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {formatMessageContent(msg.content)}
                    </p>

                    {/* Agent Suggestions Card */}
                    {msg.agentSuggestions && msg.agentSuggestions.length > 0 && (
                      <div
                        className="rounded-xl p-3 border space-y-2 mt-2"
                        style={{
                          background: 'var(--bg-surface-0)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                          <Bot className="h-3.5 w-3.5" />
                          <span>Assigned Agent Squad ({msg.agentSuggestions.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.agentSuggestions.map((agent, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg border text-xs flex items-start gap-2"
                              style={{
                                background: 'var(--bg-surface-2)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                {agent.agentName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-zinc-200 truncate">{agent.agentName}</div>
                                <div className="text-[11px] text-zinc-400 line-clamp-1">{agent.reason}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Proposed Tasks & Launch CTA */}
                    {msg.proposedTasks && msg.proposedTasks.length > 0 && (
                      <div
                        className="rounded-xl p-3 border space-y-3 mt-2"
                        style={{
                          background: 'var(--bg-surface-0)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Structured Operations Plan ({msg.proposedTasks.length} tasks)</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                            Ready to Execute
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.proposedTasks.map((t, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2"
                              style={{
                                background: 'var(--bg-surface-2)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {t.actionType === 'voice_call' ? (
                                  <PhoneCall className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                )}
                                <div className="truncate">
                                  <div className="font-medium text-zinc-200 truncate">{t.title}</div>
                                  <div className="text-[10px] text-zinc-400 truncate">{t.description}</div>
                                </div>
                              </div>
                              {t.requiresApproval && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                  Human Approval
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Direct Launch Button */}
                        <button
                          onClick={handleLaunchOperations}
                          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 shadow-lg shadow-indigo-500/20"
                          style={{
                            background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="font-semibold text-sm">Approve & Launch Live Operations</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)' }}
                >
                  <Bot className="h-4 w-4" />
                </div>
                <div
                  className="rounded-2xl rounded-bl-none p-4 border flex items-center gap-2 text-xs text-zinc-400"
                  style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-default)' }}
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>EchoFrame is analyzing and organizing your event details...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div
            className="p-3 sm:p-4 border-t flex-shrink-0 space-y-2"
            style={{
              background: 'var(--bg-surface-0)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative rounded-xl border overflow-hidden" style={{ borderColor: isRecording ? 'var(--accent)' : 'var(--border-default)', background: 'var(--bg-surface-1)' }}>
                <textarea
                  ref={textareaRef}
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Tell us what you're bringing to life (English, हिन्दी, தமிழ்)..."
                  rows={1}
                  className="w-full bg-transparent p-3 pr-12 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none resize-none max-h-48"
                  style={{ minHeight: '44px' }}
                />

                {/* Dictation Indicator */}
                {isRecording && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Listening...
                  </div>
                )}
              </div>

              {/* Voice Input Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  title={isRecording ? 'Stop Recording' : 'Voice Input'}
                  className={`p-3 rounded-xl border transition-all ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg'
                      : 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{ background: isRecording ? undefined : 'var(--bg-surface-1)' }}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isLoading}
                className="btn-primary p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
              {isBriefReady && (
                <button
                  onClick={handleLaunchOperations}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>Launch Operations</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Event Brief & Operations Preview Drawer (Side Panel) */}
        {(showBriefPanel || eventBrief) && (
          <div
            className="w-80 flex-shrink-0 surface-card rounded-2xl border p-4 flex flex-col justify-between overflow-y-auto hidden lg:flex"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface-1)' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Live Event Brief
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {conversationPhase.toUpperCase()}
                </span>
              </div>

              {/* Brief Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-zinc-500" />
                    <span>Event Name</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-200">
                    {eventBrief?.name || 'Extracting from conversation...'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-zinc-500" />
                    <span>Date & Schedule</span>
                  </div>
                  <div className="text-xs text-zinc-200">
                    {eventBrief?.date || 'To be specified'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-zinc-500" />
                    <span>Venue / Location</span>
                  </div>
                  <div className="text-xs text-zinc-200">
                    {eventBrief?.venue || 'Venue or virtual link'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-zinc-500" />
                    <span>Expected Scale</span>
                  </div>
                  <div className="text-xs text-zinc-200">
                    {eventBrief?.expectedAttendance ? `${eventBrief.expectedAttendance} Attendees` : 'Scale TBD'}
                  </div>
                </div>
              </div>

              {/* Assigned Agents Summary */}
              {latestSuggestions.length > 0 && (
                <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Assigned Agent Squad
                  </div>
                  <div className="space-y-1.5">
                    {latestSuggestions.map((a, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg border text-xs flex items-center justify-between"
                        style={{
                          background: 'var(--bg-surface-0)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span className="font-medium text-zinc-200">{a.agentName}</span>
                        <span className="text-[10px] text-indigo-400">{a.role.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Launch Action */}
            <div className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={handleLaunchOperations}
                disabled={!isBriefReady && !eventBrief?.name}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Launch Operations Pipeline</span>
              </button>
              <p className="text-[10px] text-center text-zinc-500">
                Spawns tasks, enables phone calls, and opens live execution board.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
