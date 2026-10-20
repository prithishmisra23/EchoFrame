'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEchoFrame } from '@/lib/store';
import { EventAttendee, Project } from '@/lib/types';
import { speechService } from '@/lib/speech-service';
import { 
  Users, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  PhoneCall, 
  Plus, 
  Search, 
  CheckCircle2, 
  QrCode, 
  Radio, 
  Volume2, 
  VolumeX, 
  Compass, 
  Wifi, 
  Clock, 
  Utensils, 
  ShieldCheck, 
  HelpCircle, 
  MessageSquare, 
  Award,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'attendee';
  text: string;
  timestamp: string;
  audioPlaying?: boolean;
}

const QUICK_INQUIRIES = [
  { label: 'Wi-Fi Credentials', icon: Wifi, query: 'What is the Wi-Fi network and password for Think for Bharat?' },
  { label: 'Code Freeze & Schedule', icon: Clock, query: 'When is the code freeze and final pitch presentation?' },
  { label: 'Lunch & Chai Timings', icon: Utensils, query: 'Where and when is lunch and tea served?' },
  { label: 'Request a Mentor', icon: HelpCircle, query: 'How can our team request a mentor to our table at Aryabhata Bay?' },
  { label: 'Hackathon Rules', icon: ShieldCheck, query: 'What are the rules regarding open-source models and GitHub submissions?' },
  { label: 'Stage & Restrooms', icon: Compass, query: 'Where are Kalam Grand Auditorium and the restrooms located?' },
];

export function AttendeePersonalAiExperience() {
  const {
    projects,
    activeAttendeeId,
    setActiveAttendeeId,
    addAttendee,
    triggerBolnaCall,
    addActivityLog,
  } = useEchoFrame();

  // Find Think for Bharat 1.0 or first event project
  const bharatProject = projects.find((p) => p.id === 'proj-bharat-2026') || projects.find((p) => p.type === 'event') || projects[0];
  const attendees = bharatProject?.attendees || [];

  // Active attendee
  const selectedAttendee = attendees.find((a) => a.id === activeAttendeeId) || attendees[0] || {
    id: 'att-default',
    name: 'Aarav Sharma',
    email: 'aarav@indicvoice.dev',
    phone: '+91 98765 43210',
    role: 'hacker' as const,
    track: 'Multilingual Voice AI & Indic LLMs',
    teamName: 'Team IndicVoice',
    ticketTier: 'Hacker Pass (24h Access)',
    badgeCode: 'TB-HKR-101',
    languagePref: 'hi' as const,
    checkInStatus: 'checked_in' as const,
  };

  const [activeSubTab, setActiveSubTab] = useState<'assistant' | 'roster'>('assistant');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New attendee form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+91 ');
  const [newRole, setNewRole] = useState<'hacker' | 'mentor' | 'judge' | 'vip' | 'attendee'>('hacker');
  const [newTrack, setNewTrack] = useState('Multilingual Voice AI & Indic LLMs');
  const [newTeam, setNewTeam] = useState('');
  const [newLang, setNewLang] = useState<'en' | 'hi' | 'ta'>('hi');

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Namaste ${selectedAttendee.name}! Welcome to Think for Bharat 1.0 at Bharat Mandapam. I am your 24/7 personal event AI companion. Ask me anything about your track (${selectedAttendee.track || 'General'}), the schedule, Wi-Fi credentials, mentors, or food!`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioVoiceLang, setAudioVoiceLang] = useState<'en-IN' | 'hi-IN' | 'ta-IN'>(
    selectedAttendee.languagePref === 'hi' ? 'hi-IN' : selectedAttendee.languagePref === 'ta' ? 'ta-IN' : 'en-IN'
  );

  // Calling state
  const [isCallingPhone, setIsCallingPhone] = useState(false);
  const [callStatusMsg, setCallStatusMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync welcome greeting when selected attendee changes
  useEffect(() => {
    setMessages([
      {
        id: `msg-welcome-${selectedAttendee.id}`,
        sender: 'ai',
        text: `Namaste ${selectedAttendee.name}! Welcome to Think for Bharat 1.0. You are registered as ${selectedAttendee.role.toUpperCase()} ${selectedAttendee.teamName ? `in ${selectedAttendee.teamName}` : ''} on the "${selectedAttendee.track || 'Innovation'}" track. How can I assist you right now?`,
        timestamp: 'Just now',
      },
    ]);
    if (selectedAttendee.languagePref === 'hi') setAudioVoiceLang('hi-IN');
    else if (selectedAttendee.languagePref === 'ta') setAudioVoiceLang('ta-IN');
    else setAudioVoiceLang('en-IN');
  }, [selectedAttendee.id, selectedAttendee.name, selectedAttendee.role, selectedAttendee.teamName, selectedAttendee.track, selectedAttendee.languagePref]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio Speech Recognition setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Win = window as any;
    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = audioVoiceLang === 'hi-IN' ? 'hi-IN' : audioVoiceLang === 'ta-IN' ? 'ta-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [audioVoiceLang]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.lang = audioVoiceLang === 'hi-IN' ? 'hi-IN' : audioVoiceLang === 'ta-IN' ? 'ta-IN' : 'en-US';
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  // Play audio response using Sarvam TTS or Browser Speech
  const playAiVoice = async (text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(true);

      const speakerName = audioVoiceLang === 'hi-IN' ? 'simran_hi_conversation' : audioVoiceLang === 'ta-IN' ? 'gokul_ta_narration' : 'shubh_en_narration';

      const res = await fetch('/api/sarvam/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language_code: audioVoiceLang,
          speaker: speakerName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.audioDataUri) {
        const audio = new Audio(data.audioDataUri);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } else {
        // Fallback to Web Speech API
        speechService.speak(text, {
          rate: 1.0,
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch {
      speechService.speak(text, {
        rate: 1.0,
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  const stopAiVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  // FAQ-driven AI answer: searches project faqs + venue data, then keyword patterns
  const generateAiAnswer = (query: string): string => {
    const q = query.toLowerCase();
    const faqs = bharatProject?.faqs || [];
    const venue = bharatProject?.venueDetails;
    const agenda = bharatProject?.agenda || [];

    // 1. Search project FAQs dynamically
    for (const faq of faqs) {
      const keywords = faq.question.toLowerCase().split(/[\s,?]+/).filter((w) => w.length > 3);
      if (keywords.some((kw) => q.includes(kw))) {
        return `💡 **${faq.question}**\n\n${faq.answer}`;
      }
    }

    // 2. Venue-aware answers
    if (venue && (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('password') || q.includes('network'))) {
      return `📶 **Wi-Fi Credentials**\n\n• Network: **${venue.wifiSsid}**\n• Password: **${venue.wifiPassword || 'Not configured'}**\n\nFor wired connections, Gigabit LAN ports are at every 4th table in Aryabhata Bay.`;
    }

    if (venue && (q.includes('where') || q.includes('hall') || q.includes('stage') || q.includes('washroom') || q.includes('toilet') || q.includes('map') || q.includes('venue'))) {
      const zones = venue.zones || [];
      if (zones.length > 0) {
        const zoneList = zones.map((z) => `• **${z.name}**: ${z.description}`).join('\n');
        return `📍 **Venue Layout — ${venue.venueName}**\n\n${zoneList}\n\nFor emergencies: ${venue.emergencyContact || 'See event staff at the registration desk.'}`;
      }
    }

    // 3. Agenda/schedule lookup
    if (q.includes('schedule') || q.includes('agenda') || q.includes('session') || q.includes('talk') || q.includes('next') || q.includes('upcoming')) {
      const liveSession = agenda.find((a) => a.status === 'live');
      const upcoming = agenda.filter((a) => a.status === 'upcoming').slice(0, 3);
      let resp = '🗓️ **Live Run-of-Show**\n\n';
      if (liveSession) resp += `🔴 **NOW LIVE** (${liveSession.time}): ${liveSession.title} — ${liveSession.speaker} at ${liveSession.stage}\n\n`;
      if (upcoming.length > 0) resp += '**Coming up:**\n' + upcoming.map((a) => `• ${a.time} — ${a.title} (${a.stage})`).join('\n');
      return resp || 'The full schedule is available at the registration kiosk and in Kalam Grand Auditorium.';
    }

    // 4. Keyword-based fallbacks

    const q2 = query.toLowerCase();

    if (q2.includes('food') || q2.includes('lunch') || q2.includes('tea') || q2.includes('chai') || q2.includes('snack') || q2.includes('dinner')) {
      return `🍛 **Dining & Refreshment Timings**\n\n• Hot Buffet Lunch: 01:00 PM – 02:30 PM at Dining Lawn (West Courtyard)\n• Evening High Tea & Samosas: 05:00 PM at Foyer & Lawn\n• Midnight Biryani & Energy Drinks: 12:00 AM at Aryabhata Bay\n• 24/7 Masala Chai & Filter Coffee: Beverage stations in Aryabhata Bay.`;
    }

    if (q2.includes('mentor') || q2.includes('help') || q2.includes('advice') || q2.includes('stuck')) {
      return `👨‍🏫 **Mentorship at ${bharatProject?.title || 'Think for Bharat'}**\n\nMentors for your track (${selectedAttendee.track || 'Voice AI'}) are roaming Aryabhata Bay.\n\n• Track Mentors: Priya Patel (Fintech DPI), Karthik Narayanan (Voice AI / Sarvam)\n• To request a mentor: I've flagged your pod for **${selectedAttendee.teamName || 'your team'}**. A mentor will arrive within 10 minutes, or visit the Mentor Helpdesk at Hall 4 Entrance.`;
    }

    if (q2.includes('rule') || q2.includes('github') || q2.includes('submission') || q2.includes('criteria') || q2.includes('prize')) {
      return `📜 **Hackathon Submission Guidelines**\n\n• Team size: 2–4 members\n• Pre-trained models (Sarvam, Bhashini, Llama) are allowed; application code must be written during the event\n• Submit: Public GitHub repo + README + 3-minute video demo\n• Prize Pool: ₹25 Lakh with incubation grants from MeitY & Indic Ventures.`;
    }

    if (q2.includes('freeze') || q2.includes('deadline') || q2.includes('pitch')) {
      return `⏱️ **Key Hackathon Milestones**\n\n• Hack Clock Started: 11:30 AM (Day 1)\n• T-Minus 1 Hour Warning: 11:00 AM (Day 2)\n• Hard Code Freeze: **12:00 PM (Day 2)** — repos locked\n• Grand Jury Pitches: 01:30 PM – 03:30 PM, Kalam Grand Auditorium\n• ₹25 Lakh Awards Ceremony: 04:30 PM, Kalam Grand Auditorium.`;
    }

    if (q2.includes('track') || q2.includes('problem') || q2.includes('indic') || q2.includes('sarvam')) {
      return `🇮🇳 **Think for Bharat 1.0 Focus Tracks**\n\n1. Multilingual Voice AI & Indic LLMs\n2. Agritech & Rural Empowerment\n3. Healthcare AI for Tier 2/3 Clinics\n4. Fintech & Digital Public Infrastructure\n\nYou (${selectedAttendee.name}) are registered on: **"${selectedAttendee.track}"**. Need dataset endpoints or API keys for your track?`;
    }

    return `Namaste ${selectedAttendee.name}! I'm your 24/7 AI companion for ${bharatProject?.title || 'Think for Bharat 1.0'}.\n\nQuick help: ask me about Wi-Fi, food timings, mentor requests, the hackathon schedule, submission rules, or venue navigation. I can also speak answers in Hindi, Tamil, or English! 🎙️`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'attendee',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      const answer = generateAiAnswer(query);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsProcessing(false);

      // Speak response automatically
      playAiVoice(answer);

      addActivityLog({
        agentId: 'agent-atlas',
        agentName: 'Atlas Reid',
        agentRole: 'attendee_support',
        domain: 'event',
        projectId: bharatProject.id,
        projectTitle: bharatProject.title,
        type: 'task_created',
        message: `Personal AI answered inquiry for ${selectedAttendee.name}: "${query.slice(0, 45)}..."`,
      });
    }, 400);
  };

  // Trigger Outbound Bolna Voice Call simulation to attendee
  const handleCallAttendeePhone = async () => {
    setIsCallingPhone(true);
    setCallStatusMsg(`Connecting Atlas Reid voice call to ${selectedAttendee.name} (${selectedAttendee.phone})...`);

    try {
      const res = await triggerBolnaCall(
        null,
        {
          agent_id: 'bde59659-8472-4bf9-ae84-819e9326ed41',
          recipient_phone_number: selectedAttendee.phone,
          recipient_name: selectedAttendee.name,
          context_data: {
            eventName: 'Think for Bharat 1.0',
            role: selectedAttendee.role,
            teamName: selectedAttendee.teamName,
            track: selectedAttendee.track,
            venue: 'Bharat Mandapam, New Delhi',
          },
        },
        'Atlas Reid (Personal AI Concierge)'
      );

      setCallStatusMsg(
        `Call connected! Atlas Reid is speaking with ${selectedAttendee.name} via ${res.is_sandbox ? 'Bolna Voice Sandbox' : 'Bolna Live Telephony'}. Duration: ${res.call_duration_seconds}s.`
      );
    } catch (err: any) {
      setCallStatusMsg(`Voice call failed: ${err.message}`);
    } finally {
      setIsCallingPhone(false);
    }
  };

  // Add new attendee
  const handleCreateAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const added = addAttendee(bharatProject.id, {
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+91 99000 00000',
      role: newRole,
      track: newTrack,
      teamName: newTeam.trim() || (newRole === 'hacker' ? `Team ${newName.split(' ')[0]}` : undefined),
      ticketTier: newRole === 'hacker' ? 'Hacker Pass (24h Access)' : newRole === 'mentor' ? 'Mentor VIP Pass' : 'All-Access Pass',
      languagePref: newLang,
      checkInStatus: 'checked_in',
    });

    setActiveAttendeeId(added.id);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewTeam('');
    setActiveSubTab('assistant');
  };

  // Filtered attendees
  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.teamName && a.teamName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.badgeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid var(--accent-border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge badge-accent uppercase font-mono tracking-wider text-[10px]">
                Flagship Event
              </span>
              <span className="text-caption font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {bharatProject.locationOrPlatform}
              </span>
            </div>
            <h1 className="text-display flex items-center gap-2.5" style={{ fontSize: '1.4rem' }}>
              <span className="text-2xl">🇮🇳</span>
              <span>{bharatProject.title}</span>
              <span className="text-caption font-normal text-zinc-400 font-mono">
                • 2,480 Registered Innovators
              </span>
            </h1>
            <p className="text-body mt-1 max-w-2xl">
              Equip every hacker, mentor, and attendee with their personal AI concierge. Attendees can ask questions in Hindi, English, or Tamil regarding the 24h hackathon schedule, Wi-Fi, mentorship, food, and rules.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
              style={{ padding: '8px 14px' }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Person / Attendee</span>
            </button>

            <button
              onClick={handleCallAttendeePhone}
              disabled={isCallingPhone}
              className="btn-secondary"
              style={{ padding: '8px 14px' }}
            >
              <PhoneCall className={`h-4 w-4 ${isCallingPhone ? 'animate-spin' : ''}`} style={{ color: 'var(--accent)' }} />
              <span>{isCallingPhone ? 'Calling...' : 'Call Attendee Phone'}</span>
            </button>
          </div>
        </div>

        {/* Call status banner */}
        {callStatusMsg && (
          <div
            className="mt-3.5 rounded-lg p-2.5 text-xs flex items-center justify-between"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--accent-border)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-live" />
              <span>{callStatusMsg}</span>
            </div>
            <button onClick={() => setCallStatusMsg(null)} className="text-zinc-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('assistant')}
            className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-default"
            style={{
              background: activeSubTab === 'assistant' ? 'var(--accent)' : 'var(--bg-surface-2)',
              color: activeSubTab === 'assistant' ? 'var(--text-inverse)' : 'var(--text-secondary)',
              border: `1px solid ${activeSubTab === 'assistant' ? 'var(--accent)' : 'var(--border-subtle)'}`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Personal AI Companion (Chat & Voice)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-default"
            style={{
              background: activeSubTab === 'roster' ? 'var(--accent)' : 'var(--bg-surface-2)',
              color: activeSubTab === 'roster' ? 'var(--text-inverse)' : 'var(--text-secondary)',
              border: `1px solid ${activeSubTab === 'roster' ? 'var(--accent)' : 'var(--border-subtle)'}`,
            }}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Attendee Directory & Roster ({attendees.length})</span>
          </button>
        </div>

        {/* Selected attendee picker pill */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Active Profile:
          </span>
          <select
            value={selectedAttendee.id}
            onChange={(e) => setActiveAttendeeId(e.target.value)}
            className="rounded px-2.5 py-1 text-xs font-medium cursor-pointer"
            style={{
              background: 'var(--bg-surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {attendees.map((att) => (
              <option key={att.id} value={att.id}>
                {att.name} ({att.role.toUpperCase()} • {att.badgeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: PERSONAL AI COMPANION */}
      {activeSubTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Attendee Profile Card & Quick Info */}
          <div className="space-y-4">
            <div
              className="rounded-xl p-5"
              style={{
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="badge badge-accent uppercase font-mono" style={{ fontSize: '10px' }}>
                  {selectedAttendee.role}
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {selectedAttendee.badgeCode}
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  {selectedAttendee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-subheading text-base font-bold text-white">
                    {selectedAttendee.name}
                  </h3>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {selectedAttendee.teamName || 'Individual Innovator'}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {selectedAttendee.phone}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-tertiary)' }}>Track:</span>
                  <span className="font-semibold text-right text-zinc-200">{selectedAttendee.track || 'General AI'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-tertiary)' }}>Pass Tier:</span>
                  <span className="font-mono text-zinc-300">{selectedAttendee.ticketTier || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-tertiary)' }}>Check-in:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-3 w-3" /> Checked In
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-tertiary)' }}>Language:</span>
                  <span className="uppercase font-mono text-zinc-300">{audioVoiceLang}</span>
                </div>
              </div>

              {/* Direct voice hotline button */}
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={handleCallAttendeePhone}
                  disabled={isCallingPhone}
                  className="w-full btn-secondary text-xs flex items-center justify-center gap-2"
                  style={{ padding: '8px' }}
                >
                  <PhoneCall className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Call {selectedAttendee.name}&apos;s Phone</span>
                </button>
              </div>
            </div>

            {/* Quick Venue & Wi-Fi Card */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Wifi className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span>Wi-Fi Network Credentials</span>
              </div>
              <div className="rounded p-2.5 text-xs font-mono space-y-1 bg-black/40 border border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-400">SSID:</span>
                  <span className="text-white font-bold select-all">ThinkForBharat_5G</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Pass:</span>
                  <span className="text-emerald-400 font-bold select-all">Bharat@2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Chat & Voice Interface */}
          <div
            className="lg:col-span-2 rounded-xl flex flex-col justify-between overflow-hidden"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-default)',
              minHeight: '560px',
            }}
          >
            {/* Header with Voice Engine and Audio Controls */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                background: 'var(--bg-surface-2)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Bharat Mitra AI Concierge</span>
                    <span className="status-dot status-dot-live" />
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    Powered by Sarvam Bulbul v4 Flash Multilingual Voice AI
                  </div>
                </div>
              </div>

              {/* Language Switcher & Audio Stop */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    onClick={() => setAudioVoiceLang('hi-IN')}
                    className={`px-2 py-0.5 rounded transition-default ${
                      audioVoiceLang === 'hi-IN' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => setAudioVoiceLang('en-IN')}
                    className={`px-2 py-0.5 rounded transition-default ${
                      audioVoiceLang === 'en-IN' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setAudioVoiceLang('ta-IN')}
                    className={`px-2 py-0.5 rounded transition-default ${
                      audioVoiceLang === 'ta-IN' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    தமிழ்
                  </button>
                </div>

                {isSpeaking && (
                  <button
                    onClick={stopAiVoice}
                    className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs flex items-center gap-1"
                    title="Stop Audio"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Stop Voice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((m) => {
                const isAi = m.sender === 'ai';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <div className="h-7 w-7 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">
                        AI
                      </div>
                    )}

                    <div
                      className={`rounded-xl px-4 py-3 max-w-[85%] text-xs leading-relaxed whitespace-pre-line ${
                        isAi
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                          : 'bg-emerald-600 text-white font-medium ml-auto'
                      }`}
                    >
                      <div>{m.text}</div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-60">
                        <span>{m.timestamp}</span>
                        {isAi && (
                          <button
                            onClick={() => playAiVoice(m.text)}
                            className="hover:opacity-100 flex items-center gap-1 text-emerald-400 font-medium ml-2"
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Play Voice</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="status-dot status-dot-live" />
                  <span>Bharat Mitra AI is synthesizing answer...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Inquiry Suggestion Chips */}
            <div
              className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px]"
              style={{
                background: 'var(--bg-surface-0)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-zinc-500 whitespace-nowrap text-[10px]">Suggested:</span>
              {QUICK_INQUIRIES.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    onClick={() => {
                      setInputText(q.query);
                      handleSendMessage(q.query);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap transition-default bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60"
                  >
                    <Icon className="h-3 w-3 text-emerald-400" />
                    <span>{q.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Bar with Mic and Send Button */}
            <div
              className="p-3 flex items-center gap-2"
              style={{
                background: 'var(--bg-surface-2)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2.5 rounded-lg transition-default flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Click to speak your question'}
              >
                {isListening ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4 text-emerald-400" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder={`Ask anything about Think for Bharat 1.0 (schedule, Wi-Fi, food, mentors)...`}
                className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="btn-primary"
                style={{ padding: '8px 16px' }}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDEE DIRECTORY & ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, team, badge, email..."
                className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['all', 'hacker', 'mentor', 'judge', 'vip'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-default ${
                    roleFilter === role
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {role === 'all' ? 'All Roles' : role}
                </button>
              ))}

              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs ml-auto sm:ml-2 whitespace-nowrap"
                style={{ padding: '6px 12px' }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Attendee</span>
              </button>
            </div>
          </div>

          {/* Attendee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAttendees.map((att) => {
              const isSelected = selectedAttendee.id === att.id;
              return (
                <div
                  key={att.id}
                  className={`rounded-xl p-4 transition-all flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-emerald-500/80 shadow-lg' : ''
                  }`}
                  style={{
                    background: 'var(--bg-surface-1)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="badge badge-accent uppercase font-mono text-[9px]">
                        {att.role}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-400">
                        {att.badgeCode}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: 'var(--accent-subtle)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent-border)',
                        }}
                      >
                        {att.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-white truncate">{att.name}</h4>
                        <div className="text-xs text-zinc-400 truncate">
                          {att.teamName || 'Individual'} • {att.email}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                          {att.phone}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] space-y-1 text-zinc-400">
                      <div><strong className="text-zinc-300">Track:</strong> {att.track || 'General AI'}</div>
                      {att.lastAiInteraction && (
                        <div className="text-[10px] text-zinc-500 truncate italic">
                          Last AI query: &ldquo;{att.lastAiInteraction}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setActiveAttendeeId(att.id);
                        setActiveSubTab('assistant');
                      }}
                      className="btn-primary text-xs flex-1 justify-center"
                      style={{ padding: '6px 10px' }}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Open Personal AI</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveAttendeeId(att.id);
                        handleCallAttendeePhone();
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      title="Direct Bolna Voice Call"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD ATTENDEE MODAL */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md w-full" style={{ background: 'var(--bg-surface-1)' }}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <h3 className="text-subheading font-bold text-white">Add Person to Think for Bharat</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAttendee} className="space-y-3.5 mt-4">
              <div>
                <label className="text-label mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Vikramaditya Rathore"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-label mb-1 block">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="vikram@bharatai.org"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-label mb-1 block">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-label mb-1 block">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="hacker">Hacker / Builder</option>
                    <option value="mentor">Technical Mentor</option>
                    <option value="judge">Grand Jury Judge</option>
                    <option value="vip">Dignitary / VIP</option>
                    <option value="attendee">General Attendee</option>
                  </select>
                </div>
                <div>
                  <label className="text-label mb-1 block">Language Preference</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value as any)}
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="en">English (Indian)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label mb-1 block">Hackathon Track</label>
                <select
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="Multilingual Voice AI & Indic LLMs">Multilingual Voice AI & Indic LLMs</option>
                  <option value="Agritech & Rural Empowerment">Agritech & Rural Empowerment</option>
                  <option value="Healthcare AI for Tier 2/3 India">Healthcare AI for Tier 2/3 India</option>
                  <option value="Fintech & Digital Public Infrastructure">Fintech & Digital Public Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="text-label mb-1 block">Team Name (Optional)</label>
                <input
                  type="text"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="e.g. Team BharatSpeech"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setNewName('Divya Balakrishnan');
                    setNewEmail('divya.b@techchennai.dev');
                    setNewPhone('+91 98402 33441');
                    setNewRole('hacker');
                    setNewTrack('Multilingual Voice AI & Indic LLMs');
                    setNewTeam('Team TamilVoice');
                    setNewLang('ta');
                  }}
                  className="text-xs text-zinc-400 hover:text-emerald-400 underline"
                >
                  Fill Sample Profile
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs">
                    Confirm & Activate AI
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
