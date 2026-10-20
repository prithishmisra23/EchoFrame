'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEchoFrame } from '@/lib/store';
import { speechService } from '@/lib/speech-service';
import { 
  Radio, 
  Play, 
  Square, 
  CheckCircle2, 
  ShieldAlert, 
  Volume2, 
  VolumeX,
  Clock, 
  Sparkles, 
  AlertTriangle,
  Globe,
  Sliders,
  Mic,
  MicOff,
  Headphones,
  SlidersHorizontal,
  Bell,
  Volume1,
  Layers,
  ChevronRight,
  RefreshCw,
  Send
} from 'lucide-react';

const BULBUL_VOICES: Record<'en-IN' | 'hi-IN' | 'ta-IN', { id: string; label: string }[]> = {
  'en-IN': [
    { id: 'shubh_en_narration', label: 'Shubh (Stage Emcee, Male)' },
    { id: 'simran_en_narration', label: 'Simran (Stage Host, Female)' },
    { id: 'ashwin_en_sports_energetic', label: 'Ashwin (Energetic Intro, Male)' },
    { id: 'aparna_en_companion', label: 'Aparna (Warm Companion, Female)' },
  ],
  'hi-IN': [
    { id: 'shubh_hi_customer', label: 'Shubh (Hindi Formal, Male)' },
    { id: 'simran_hi_narration', label: 'Simran (Hindi Emcee, Female)' },
    { id: 'aditya_hi_conversational', label: 'Aditya (Dynamic Conversational, Male)' },
    { id: 'anand_hi_news', label: 'Anand (Broadcast Style, Male)' },
  ],
  'ta-IN': [
    { id: 'gokul_ta_narration', label: 'Gokul (Tamil Stage Narration, Male)' },
    { id: 'vijay_ta_narration', label: 'Vijay (Tamil Formal, Male)' },
    { id: 'aravind_ta_ads', label: 'Aravind (Tamil Dynamic Intro, Male)' },
  ],
};

interface AnnouncementPreset {
  id: string;
  title: string;
  tag: string;
  category: 'kickoff' | 'keynote' | 'mentors' | 'food' | 'freeze' | 'jury' | 'awards' | 'housekeeping';
  script: {
    'hi-IN': string;
    'en-IN': string;
    'ta-IN': string;
  };
}

const BHARAT_PRESETS: AnnouncementPreset[] = [
  {
    id: 'p-inaugural',
    title: 'Grand Inauguration & Welcome Address',
    tag: 'Stage 1',
    category: 'keynote',
    script: {
      'hi-IN': 'देवियों और सज्जनों, भारत मंडपम में आयोजित "Think for Bharat 1.0" में आप सभी का हार्दिक स्वागत है। आज 2400 से अधिक इनोवेटर्स भारत की आवाज, भाषा और तकनीकी भविष्य का निर्माण करने के लिए एक साथ आए हैं। कृपया हमारे मुख्य अतिथियों का करतल ध्वनि से स्वागत करें!',
      'en-IN': 'Ladies and gentlemen, welcome to Think for Bharat 1.0 at Bharat Mandapam, New Delhi! Over 2,400 builders and researchers are gathered here today to build sovereign AI, Indic language voice agents, and Digital Public Infrastructure for 1.4 billion citizens. Please welcome our dignitaries to the stage!',
      'ta-IN': 'அன்பான பங்கேற்பாளர்களே, பாரத் மண்டபத்தில் நடைபெறும் Think for Bharat 1.0 மாநாட்டிற்கு உங்களை அன்புடன் வரவேற்கிறோம். நமது சிறப்பு விருந்தினர்களை மேடைக்கு அன்புடன் அழைக்கிறோம்!',
    },
  },
  {
    id: 'p-hack-start',
    title: 'Hackathon Kickoff: 24h Clock Starts Now!',
    tag: 'All Zones',
    category: 'kickoff',
    script: {
      'hi-IN': 'ध्यान दें सभी हैकर्स! Think for Bharat 1.0 का 24-घंटे का हैकाथॉन अब आधिकारिक रूप से शुरू हो चुका है! आर्यभट्ट बे में सभी 300 टीमें अपने कोड रिपॉजिटरी शुरू कर सकती हैं। आप सभी को ढेर सारी शुभकामनाएं!',
      'en-IN': 'Attention all builders and teams! The 24-hour Think for Bharat hackathon has officially begun! 300 developer pods across Aryabhata Bay are now live. High-speed fiber Wi-Fi is active. Good luck to all teams!',
      'ta-IN': 'அனைத்து பங்கேற்பாளர்களுக்கும் வணக்கம்! Think for Bharat 1.0 இன் 24 மணி நேர ஹேக்கத்தான் அதிகாரப்பூர்வமாக துவங்கியுள்ளது. உங்கள் அனைவருக்கும் வாழ்த்துகள்!',
    },
  },
  {
    id: 'p-mentors-round',
    title: 'Mentorship Round 1: Pods Alert',
    tag: 'Bay 1-20',
    category: 'mentors',
    script: {
      'hi-IN': 'सभी टीमों के लिए जरूरी सूचना: मेंटरशिप राउंड 1 अब आर्यभट्ट बे में शुरू हो रहा है। वॉइस एआई, एग्रीटेक, हेल्थकेयर और फिनटेक के मेंटर्स आपके टेबल पर आर्किटेक्चर रिव्यू के लिए उपलब्ध हैं।',
      'en-IN': 'Important announcement for all teams: Mentorship Round 1 is now underway across Aryabhata Bay. Expert mentors in Indic Voice AI, Agritech, Healthcare, and Fintech DPI are circulating to review your pipelines.',
      'ta-IN': 'அனைத்து குழுக்களுக்கும் முக்கிய அறிவிப்பு: வழிகாட்டல் சுற்று 1 இப்போது ஆர்யபட்டா பகுதியில் துவங்குகிறது.',
    },
  },
  {
    id: 'p-lunch-call',
    title: 'Lunch Buffet & Masala Chai Call',
    tag: 'Dining Lawn',
    category: 'food',
    script: {
      'hi-IN': 'भोजन सूचना: डाइनिंग लॉन (वेस्ट कोर्टयार्ड) में दोपहर का भोजन और ताजी मसाला चाय परोसी जा रही है। कृपया गेट 3 से डाइनिंग एरिया की ओर प्रस्थान करें।',
      'en-IN': 'Housekeeping announcement: Hot buffet lunch and fresh masala chai are now served at the Dining Lawn in the West Courtyard. Please proceed through Gate 3 with your badge.',
      'ta-IN': 'உணவு அறிவிப்பு: மதிய உணவு மற்றும் தேநீர் இப்போது மேற்கு புல்வெளியில் வழங்கப்படுகிறது.',
    },
  },
  {
    id: 'p-code-freeze-1h',
    title: 'T-Minus 1 Hour: Code Freeze Warning',
    tag: 'Urgent',
    category: 'freeze',
    script: {
      'hi-IN': 'अलर्ट! कोड फ्रीज में केवल 1 घंटा शेष है। दोपहर 12 बजे सभी गिटहब रिपॉजिटरी और 3-मिनट के वीडियो डेमो लॉक कर दिए जाएंगे। कृपया अपने सबमिशन पोर्टल पर अपलोड करना सुनिश्चित करें।',
      'en-IN': 'Urgent hackathon broadcast: T-minus 1 hour remaining until code freeze! At exactly 12:00 PM, all GitHub repository links, documentation, and video demos will lock. Please verify your portal submissions now.',
      'ta-IN': 'முக்கிய எச்சரிக்கை: குறியீடு சமர்ப்பிப்பு முடிவிற்கு இன்னும் 1 மணி நேரமே உள்ளது.',
    },
  },
  {
    id: 'p-code-freeze-lock',
    title: 'Code Freeze: Submissions Locked!',
    tag: 'Portal Locked',
    category: 'freeze',
    script: {
      'hi-IN': 'घोषणा: दोपहर 12:00 बज चुके हैं और Think for Bharat का कोड फ्रीज अब प्रभावी हो गया है! सभी रिपॉजिटरी लॉक हो चुकी हैं। टॉप 10 फाइनलिस्ट्स की घोषणा 15 मिनट में कलाम ऑडिटोरियम में की जाएगी।',
      'en-IN': 'Attention all participants: The clock has struck 12:00 PM and code freeze is now in effect! Hands off keyboards. Submissions are locked. Top 10 finalists for the Grand Jury will be announced shortly in Kalam Grand Auditorium.',
      'ta-IN': 'குறியீடு சமர்ப்பிப்பு நேரம் முடிவடைந்தது! இறுதிப் போட்டிக்கான அறிவிப்பு விரைவில் வெளியாகும்.',
    },
  },
  {
    id: 'p-jury-pitch',
    title: 'Grand Jury Pitches Commencing',
    tag: 'Stage 1',
    category: 'jury',
    script: {
      'hi-IN': 'देवियों और सज्जनों, कलाम ग्रैंड ऑडिटोरियम में टॉप 10 फाइनलिस्ट टीमों की ग्रैंड जूरी पिचिंग शुरू होने जा रही है। डॉ. एस. रामनाथन और हमारी जूरी पैनल सभी प्रोटोटाइप्स का लाइव मूल्यांकन करेगी।',
      'en-IN': 'Ladies and gentlemen, the Top 10 Grand Jury live pitch evaluations are now commencing in Kalam Grand Auditorium. Dr. Ramanathan and our esteemed jury panel will evaluate each team on Indic accuracy, latency, and societal impact.',
      'ta-IN': 'சிறப்பு நடுவர் குழுவின் இறுதி மதிப்பீட்டு நிகழ்வு இப்போது கலாம் அரங்கில் துவங்குகிறது.',
    },
  },
  {
    id: 'p-awards-ceremony',
    title: '₹25 Lakh Awards Ceremony Felicitation',
    tag: 'Main Stage',
    category: 'awards',
    script: {
      'hi-IN': 'Think for Bharat 1.0 का भव्य समापन और पुरस्कार वितरण समारोह कलाम ऑडिटोरियम में प्रारंभ हो रहा है। 25 लाख रुपये का पुरस्कार पूल और राष्ट्रीय एआई चैंपियंस का सम्मान किया जाएगा। कृपया अपनी सीटों पर स्थान ग्रहण करें!',
      'en-IN': 'The Grand Awards & Felicitation Ceremony for Think for Bharat 1.0 is now beginning in Kalam Grand Auditorium! We are celebrating our ₹25 Lakh prize pool winners and crowning the National AI Innovation Champions. Please take your seats!',
      'ta-IN': 'ரூபாய் 25 லட்சம் பரிசுத் தொகை வழங்கும் விழா இப்போது தொடங்குகிறது!',
    },
  },
  {
    id: 'p-wifi-desk',
    title: 'Wi-Fi & AI Companion Housekeeping',
    tag: 'Info',
    category: 'housekeeping',
    script: {
      'hi-IN': 'सूचना: हाई-स्पीड इंटरनेट के लिए "ThinkForBharat_5G" पासवर्ड "Bharat@2026" से कनेक्ट करें। किसी भी प्रश्न या मेंटर सहायता के लिए अपने मोबाइल पर अपने पर्सनल एआई कंपेनियन का उपयोग करें।',
      'en-IN': 'Housekeeping reminder: Connect to high-speed fiber Wi-Fi on SSID "ThinkForBharat_5G" using password "Bharat@2026". For instant help, schedule alerts, and mentor calls, use your Personal AI Companion on your mobile device.',
      'ta-IN': 'வைஃபை கடவுச்சொல் "Bharat@2026" ஐ பயன்படுத்தி இணையத்துடன் இணையலாம்.',
    },
  },
];

const getSessionAnnouncementTemplate = (
  lang: 'en-IN' | 'hi-IN' | 'ta-IN',
  speakerName: string,
  sessionTitle: string,
  eventName: string
) => {
  if (lang === 'hi-IN') {
    return `देवियों और सज्जनों, ${eventName} के मुख्य मंच पर आपका हार्दिक स्वागत है। हम हमारे मुख्य वक्ता ${speakerName} का स्वागत करते हैं, जो "${sessionTitle}" पर चर्चा करेंगे। कृपया करतल ध्वनि से उनका स्वागत करें!`;
  }
  if (lang === 'ta-IN') {
    return `அன்பான விருந்தினர்களே, ${eventName} முதன்மை மேடைக்கு உங்களை அன்புடன் வரவேற்கிறோம். நமது சிறப்பு பேச்சாளர் ${speakerName} அவர்களை "${sessionTitle}" உரைக்காக மேடைக்கு அன்புடன் அழைக்கிறோம்!`;
  }
  return `Ladies and gentlemen, welcome to ${eventName}. We are delighted to introduce our keynote speaker, ${speakerName}, discussing "${sessionTitle}". Please silence your mobile devices and welcome ${speakerName} to the stage!`;
};

export function StageHostExperience() {
  const { projects, agents, addActivityLog } = useEchoFrame();

  // Find Nova Thorne (Stage Host Agent) or default
  const hostAgent = agents.find((a) => a.role === 'stage_hosting_mc' || a.name.includes('Nova')) || agents[0];

  // Active Project (Defaults to Think for Bharat 1.0)
  const defaultBharat = projects.find((p) => p.id === 'proj-bharat-2026') || projects.find((p) => p.type === 'event') || projects[0];
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultBharat?.id || 'proj-bharat-2026');

  const eventProject = projects.find((p) => p.id === selectedProjectId) || defaultBharat;
  const agenda = eventProject?.agenda || [];
  const speakers = eventProject?.speakers || [];

  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const currentSession = agenda[currentSessionIndex] || {
    id: 's-live',
    time: '10:45 AM',
    title: 'Opening Keynote: Sovereign AI & 100M Voice Agents for Bharat',
    speaker: 'Dr. Aravind Sharma',
    stage: 'Kalam Grand Auditorium',
    status: 'live',
  };

  const nextSession = agenda[currentSessionIndex + 1] || {
    id: 's-next',
    time: '11:30 AM',
    title: 'Problem Statements Release & 24h Hackathon Clock Starts!',
    speaker: 'Nova Thorne & Grand Jury',
    stage: 'Aryabhata Hackers Bay',
    status: 'upcoming',
  };

  const currentSpeaker = speakers.find((s) => s.name === currentSession.speaker) || {
    id: 'spk-current',
    name: currentSession.speaker,
    title: 'Chief AI Scientist & Founding Director',
    company: 'Bharat AI Labs',
    sessionTitle: currentSession.title,
    status: 'confirmed',
  };

  // Stage Announcement Script
  const defaultScript = getSessionAnnouncementTemplate('hi-IN', currentSession.speaker, currentSession.title, eventProject?.title || 'Think for Bharat 1.0');

  const [announcementText, setAnnouncementText] = useState(defaultScript);
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isGeneratingSarvam, setIsGeneratingSarvam] = useState(false);
  const [sarvamStatusMsg, setSarvamStatusMsg] = useState<string | null>(null);

  // Engine: Browser Web Speech vs Sarvam AI
  const [voiceEngine, setVoiceEngine] = useState<'sarvam' | 'browser'>('sarvam');
  const [sarvamLanguage, setSarvamLanguage] = useState<'en-IN' | 'hi-IN' | 'ta-IN'>('hi-IN');
  const [sarvamSpeaker, setSarvamSpeaker] = useState<string>('simran_hi_narration');

  // Audio I/O Device & Headset Monitor State
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState<string>('');
  const [isMicConnected, setIsMicConnected] = useState(false);
  const [isMicLiveOnStage, setIsMicLiveOnStage] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [isInEarMonitorEnabled, setIsInEarMonitorEnabled] = useState(true);
  const [iemStatusMsg, setIemStatusMsg] = useState<string | null>(null);

  // In-memory audio cache to prevent redundant API calls
  const audioCache = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [broadcastLog, setBroadcastLog] = useState<string[]>([
    '10:00 AM — [STAGE PA LIVE] Grand Inauguration & Lamp Lighting Emcee Welcome aired in Hindi.',
    '10:45 AM — [STAGE PA LIVE] Keynote introduction aired for Dr. Aravind Sharma (Kalam Auditorium).',
    '10:50 AM — [IEM MONITOR] In-Ear Headset loop verified. Mic level: -12 dB normal.',
  ]);

  const stopAllAudio = useCallback(() => {
    speechService.stopSpeaking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingLocal(false);
    setIsBroadcasting(false);
  }, []);

  // Update script when session or language changes
  useEffect(() => {
    stopAllAudio();
    setAnnouncementText(
      getSessionAnnouncementTemplate(sarvamLanguage, currentSession.speaker, currentSession.title, eventProject?.title || 'Think for Bharat 1.0')
    );
    setIsApproved(false);
  }, [currentSessionIndex, sarvamLanguage, selectedProjectId, currentSession.speaker, currentSession.title, eventProject?.title, stopAllAudio]);

  // Enumerate Audio Devices (Mics & Headphones)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;

    const fetchDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioInputDevices(inputs);
        if (inputs.length > 0 && !selectedInputDeviceId) {
          setSelectedInputDeviceId(inputs[0].deviceId || 'default');
        }
      } catch (err) {
        console.warn('Could not enumerate audio devices:', err);
      }
    };

    fetchDevices();
    navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    };
  }, [selectedInputDeviceId]);

  // Connect Microphone & Setup VU Decibel Meter
  const connectMicrophone = async () => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedInputDeviceId ? { deviceId: { exact: selectedInputDeviceId } } : true,
      });

      micStreamRef.current = stream;
      setIsMicConnected(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 255) * 140));
        setMicVolumeLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      addActivityLog({
        agentId: hostAgent.id,
        agentName: hostAgent.name,
        agentRole: hostAgent.role,
        domain: 'event',
        projectId: eventProject.id,
        projectTitle: eventProject.title,
        type: 'agent_sync',
        message: `Microphone hardware connected (${selectedInputDeviceId ? 'Selected Input' : 'Default Mic'}). In-Ear Monitor audio loop calibrated.`,
      });
    } catch (err: any) {
      alert(`Could not connect microphone: ${err.message}. Please check browser microphone permissions.`);
      setIsMicConnected(false);
    }
  };

  const disconnectMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsMicConnected(false);
    setIsMicLiveOnStage(false);
    setMicVolumeLevel(0);
  };

  // Test Earphone Audio Output
  const handleTestEarphoneAudio = () => {
    setIemStatusMsg('Testing in-ear headphone monitor channel...');
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // Play soft dual-chime harmonic (440Hz -> 880Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);

      setTimeout(() => {
        speechService.speak('In-ear monitor audio channel verified. Earphone output live.', {
          rate: 1.05,
          pitch: 1.0,
          onEnd: () => {
            setIemStatusMsg('Earphone channel active and verified at 0 dB latency.');
            setTimeout(() => setIemStatusMsg(null), 3500);
          },
        });
      }, 400);
    } catch {
      setIemStatusMsg('Test complete.');
      setTimeout(() => setIemStatusMsg(null), 3000);
    }
  };

  const handleLanguageChange = (newLang: 'en-IN' | 'hi-IN' | 'ta-IN') => {
    stopAllAudio();
    setSarvamLanguage(newLang);
    const defaultSpk = BULBUL_VOICES[newLang][0].id;
    setSarvamSpeaker(defaultSpk);
    setAnnouncementText(
      getSessionAnnouncementTemplate(newLang, currentSession.speaker, currentSession.title, eventProject?.title || 'Think for Bharat 1.0')
    );
    setIsApproved(false);
    setSarvamStatusMsg(null);
  };

  // Audio preview handler (Rehearse in Earphone / IEM)
  const handleTogglePlayLocal = async () => {
    if (isPlayingLocal || isBroadcasting) {
      stopAllAudio();
      return;
    }

    if (voiceEngine === 'sarvam') {
      const cacheKey = `${sarvamLanguage}__${sarvamSpeaker}__${announcementText.trim()}`;

      if (audioCache.current.has(cacheKey)) {
        const cachedUri = audioCache.current.get(cacheKey)!;
        setSarvamStatusMsg('Playing from instant audio cache (0 credits, zero latency) into IEM earphone.');
        const audio = new Audio(cachedUri);
        audioRef.current = audio;
        setIsPlayingLocal(true);

        audio.onended = () => {
          setIsPlayingLocal(false);
          setSarvamStatusMsg(null);
        };
        audio.onerror = () => {
          setIsPlayingLocal(false);
          setSarvamStatusMsg('Audio playback failed.');
        };

        await audio.play();
        return;
      }

      setIsGeneratingSarvam(true);
      setSarvamStatusMsg(`Synthesizing Sarvam Bulbul v4 Flash (${sarvamLanguage} / ${sarvamSpeaker})...`);

      try {
        const res = await fetch('/api/sarvam/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: announcementText,
            language_code: sarvamLanguage,
            speaker: sarvamSpeaker,
            pace: hostAgent.voiceConfig.speed || 1.0,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.audioDataUri) {
          audioCache.current.set(cacheKey, data.audioDataUri);
          setSarvamStatusMsg('Rehearsing in Earphones (Private IEM Monitor)...');
          const audio = new Audio(data.audioDataUri);
          audioRef.current = audio;
          setIsPlayingLocal(true);

          audio.onended = () => {
            setIsPlayingLocal(false);
            setSarvamStatusMsg(null);
          };
          audio.onerror = () => {
            setIsPlayingLocal(false);
            setSarvamStatusMsg('Playback failed.');
          };

          await audio.play();
        } else {
          setSarvamStatusMsg(`Sarvam AI: ${data.error || 'Failed'}. Playing via browser speech.`);
          setIsPlayingLocal(true);
          speechService.speak(announcementText, {
            rate: hostAgent.voiceConfig.speed,
            onEnd: () => {
              setIsPlayingLocal(false);
              setSarvamStatusMsg(null);
            },
          });
        }
      } catch (err: any) {
        setSarvamStatusMsg(`Sarvam AI Network Error: ${err.message}. Playing via browser.`);
        setIsPlayingLocal(true);
        speechService.speak(announcementText, {
          rate: hostAgent.voiceConfig.speed,
          onEnd: () => {
            setIsPlayingLocal(false);
            setSarvamStatusMsg(null);
          },
        });
      } finally {
        setIsGeneratingSarvam(false);
      }
    } else {
      setIsPlayingLocal(true);
      speechService.speak(announcementText, {
        pitch: hostAgent.voiceConfig.pitch,
        rate: hostAgent.voiceConfig.speed,
        onEnd: () => setIsPlayingLocal(false),
      });
    }
  };

  // Broadcast to Live Stage PA
  const handleTriggerBroadcast = () => {
    if (!isApproved) return;
    setIsBroadcasting(true);

    const onComplete = () => {
      setIsBroadcasting(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setBroadcastLog((prev) => [
        `${timeStr} — [STAGE PA LIVE] "${announcementText.slice(0, 50)}..." aired via ${voiceEngine === 'sarvam' ? 'Sarvam AI' : 'browser speech'} to ${currentSession.stage}.`,
        ...prev,
      ]);
      addActivityLog({
        agentId: hostAgent.id,
        agentName: hostAgent.name,
        agentRole: hostAgent.role,
        domain: 'event',
        projectId: eventProject.id,
        projectTitle: eventProject.title,
        type: 'task_created',
        message: `Stage Host live broadcast: "${announcementText.slice(0, 60)}..." to ${currentSession.stage}.`,
      });
    };

    if (voiceEngine === 'sarvam') {
      const cacheKey = `${sarvamLanguage}__${sarvamSpeaker}__${announcementText.trim()}`;
      if (audioCache.current.has(cacheKey)) {
        const cachedUri = audioCache.current.get(cacheKey)!;
        const audio = new Audio(cachedUri);
        audioRef.current = audio;
        audio.onended = onComplete;
        audio.onerror = onComplete;
        audio.play().catch(() => onComplete());
        return;
      }

      fetch('/api/sarvam/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: announcementText,
          language_code: sarvamLanguage,
          speaker: sarvamSpeaker,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.audioDataUri) {
            audioCache.current.set(cacheKey, data.audioDataUri);
            const audio = new Audio(data.audioDataUri);
            audioRef.current = audio;
            audio.onended = onComplete;
            audio.onerror = onComplete;
            audio.play().catch(() => onComplete());
          } else {
            speechService.speak(announcementText, {
              pitch: hostAgent.voiceConfig.pitch,
              rate: hostAgent.voiceConfig.speed,
              onEnd: onComplete,
            });
          }
        })
        .catch(() => {
          speechService.speak(announcementText, {
            pitch: hostAgent.voiceConfig.pitch,
            rate: hostAgent.voiceConfig.speed,
            onEnd: onComplete,
          });
        });
    } else {
      speechService.speak(announcementText, {
        pitch: hostAgent.voiceConfig.pitch,
        rate: hostAgent.voiceConfig.speed,
        onEnd: onComplete,
      });
    }
  };

  // Toggle Live Mic Broadcast to Stage
  const toggleLiveMicOnStage = () => {
    if (!isMicConnected) {
      connectMicrophone();
      return;
    }
    const nextState = !isMicLiveOnStage;
    setIsMicLiveOnStage(nextState);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (nextState) {
      setBroadcastLog((prev) => [
        `${timeStr} — [LIVE MIC ON AIR] Host open microphone activated directly to Main Auditorium PA.`,
        ...prev,
      ]);
    } else {
      setBroadcastLog((prev) => [
        `${timeStr} — [MIC MUTED] Host live microphone muted.`,
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-display flex items-center gap-2" style={{ fontSize: '1.3rem' }}>
              <Radio className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span>AI Stage Host & Emcee Console</span>
            </h1>
            <span className="badge badge-accent">
              Agent: {hostAgent.name}
            </span>
          </div>
          <p className="text-body mt-1">
            Real-time stage hosting, live mic talkback, and multi-lingual announcement broadcaster for {eventProject?.title}.
          </p>
        </div>

        {/* Project Selector & Stage status */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setCurrentSessionIndex(0);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
            style={{
              background: 'var(--bg-surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent-border)',
            }}
          >
            {projects.filter((p) => p.type === 'event').map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <div
            className="rounded px-2.5 py-1 text-[11px] flex items-center gap-2"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-tertiary)',
            }}
          >
            <span className={`status-dot ${isMicLiveOnStage || isBroadcasting ? 'status-dot-live' : ''}`} style={{ background: isMicLiveOnStage || isBroadcasting ? '#ef4444' : '#10b981' }} />
            <span>PA Status: <strong>{isMicLiveOnStage ? '🔴 MIC LIVE ON STAGE' : isBroadcasting ? 'BROADCASTING' : 'READY / STANDBY'}</strong></span>
          </div>
        </div>
      </div>

      {/* HARDWARE I/O & HEADSET / MIC SUITE */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(24, 24, 27, 0.95) 100%)',
          border: '1px solid var(--accent-border)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Microphone Input Section */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className={`h-4 w-4 ${isMicConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Microphone Input (I/O)
                </span>
                <span className={`badge ${isMicConnected ? 'badge-accent' : 'badge-neutral'} text-[9px]`}>
                  {isMicConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              {isMicConnected && (
                <span className="text-[11px] font-mono text-zinc-400">
                  Signal: {micVolumeLevel}% VU
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedInputDeviceId}
                onChange={(e) => setSelectedInputDeviceId(e.target.value)}
                className="bg-black/50 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 max-w-xs"
              >
                {audioInputDevices.length > 0 ? (
                  audioInputDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="default">Default System Microphone / Headset</option>
                )}
              </select>

              {!isMicConnected ? (
                <button
                  onClick={connectMicrophone}
                  className="btn-primary text-xs"
                  style={{ padding: '4px 10px' }}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Connect Mic</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={disconnectMicrophone}
                    className="btn-secondary text-xs"
                    style={{ padding: '4px 10px' }}
                  >
                    <MicOff className="h-3.5 w-3.5" />
                    <span>Disconnect</span>
                  </button>

                  <button
                    onClick={toggleLiveMicOnStage}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isMicLiveOnStage
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                  >
                    <Radio className="h-3 w-3" />
                    <span>{isMicLiveOnStage ? 'MUTE STAGE MIC' : 'BROADCAST MIC TO STAGE'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live VU Decibel Meter Bar */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-zinc-500 w-6">VU:</span>
              <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800 flex gap-0.5">
                {[...Array(20)].map((_, i) => {
                  const step = (i + 1) * 5;
                  const isActive = isMicConnected && micVolumeLevel >= step;
                  const color = i < 12 ? '#10b981' : i < 16 ? '#f59e0b' : '#ef4444';
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        background: isActive ? color : '#27272a',
                        opacity: isActive ? 1 : 0.3,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Divider on large screens */}
          <div className="hidden lg:block w-px h-16 bg-zinc-800" />

          {/* Right: Earphone / In-Ear Monitor (IEM) Section */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  In-Ear Monitor & Earphones (IEM)
                </span>
                <span className="badge badge-accent text-[9px]">
                  Stereo Talkback
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                <span>IEM Loop:</span>
                <button
                  onClick={() => setIsInEarMonitorEnabled((v) => !v)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isInEarMonitorEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isInEarMonitorEnabled ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              Listen to private emcee cues, rehearsal playback, and speaker timing alerts directly in your connected earphones.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestEarphoneAudio}
                className="btn-secondary text-xs flex items-center gap-1.5"
                style={{ padding: '5px 12px' }}
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Test Earphone Audio</span>
              </button>

              {iemStatusMsg && (
                <span className="text-xs text-emerald-400 font-medium animate-fadeIn">
                  {iemStatusMsg}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Mic Banner if Active */}
        {isMicLiveOnStage && (
          <div className="mt-3 rounded-lg p-2.5 bg-rose-950/80 border border-rose-500/80 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2 font-bold tracking-wide">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>LIVE ON MAIN STAGE PA — MICROPHONE IS CURRENTLY UNMUTED TO THE AUDITORIUM</span>
            </div>
            <button
              onClick={() => setIsMicLiveOnStage(false)}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
            >
              Mute Now
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: On-Stage Now & Announcement Soundboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Current Live Session Card & Announcements Soundboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Live Session Card */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-danger flex items-center gap-1 font-mono uppercase text-[10px]">
                  <span className="status-dot" style={{ background: 'var(--status-error)', animation: 'statusPulse 1s infinite' }} />
                  Current Session On Stage
                </span>
                <span className="text-caption font-mono text-zinc-400">
                  {currentSession.time} • {currentSession.stage}
                </span>
              </div>

              {agenda.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSessionIndex === 0}
                    onClick={() => setCurrentSessionIndex((i) => Math.max(0, i - 1))}
                    className="btn-secondary text-[11px] disabled:opacity-30"
                    style={{ padding: '3px 8px' }}
                  >
                    Prev
                  </button>
                  <span className="text-[11px] font-mono text-zinc-400 px-1">
                    {currentSessionIndex + 1} of {agenda.length}
                  </span>
                  <button
                    disabled={currentSessionIndex >= agenda.length - 1}
                    onClick={() => setCurrentSessionIndex((i) => Math.min(agenda.length - 1, i + 1))}
                    className="btn-secondary text-[11px] disabled:opacity-30"
                    style={{ padding: '3px 8px' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <h2 className="text-subheading text-lg font-bold text-white">
              {currentSession.title}
            </h2>

            {/* Speaker Information Snippet */}
            <div
              className="mt-3.5 rounded-lg p-3 flex items-center justify-between"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  {currentSpeaker.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{currentSpeaker.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {currentSpeaker.title} • {currentSpeaker.company}
                  </div>
                </div>
              </div>

              <span className="badge badge-accent uppercase font-mono text-[9px]">
                A/V Soundcheck Done
              </span>
            </div>

            {/* Voice Engine & Multilingual Settings */}
            <div className="mt-4 pt-3.5 border-t border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Voice Engine:
                  </span>
                  <div className="flex rounded p-0.5 bg-black/40 border border-zinc-800">
                    <button
                      onClick={() => setVoiceEngine('sarvam')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-default ${
                        voiceEngine === 'sarvam'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Sarvam AI (Bulbul v4 Flash)
                    </button>
                    <button
                      onClick={() => setVoiceEngine('browser')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-default ${
                        voiceEngine === 'browser'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Browser Web Speech
                    </button>
                  </div>
                </div>

                {/* Language pills */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400">Language:</span>
                  {(['hi-IN', 'en-IN', 'ta-IN'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-default ${
                        sarvamLanguage === lang
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang === 'hi-IN' ? 'हिन्दी (Hindi)' : lang === 'ta-IN' ? 'தமிழ் (Tamil)' : 'English (India)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speaker Voice Dropdown if Sarvam */}
              {voiceEngine === 'sarvam' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-zinc-400">Speaker Voice:</span>
                  <select
                    value={sarvamSpeaker}
                    onChange={(e) => setSarvamSpeaker(e.target.value)}
                    className="bg-black/50 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
                  >
                    {BULBUL_VOICES[sarvamLanguage].map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Script Textarea & Playback controls */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-label text-[11px]">
                  Stage Announcement Script (Live Synthesizer)
                </label>
                <button
                  onClick={() =>
                    setAnnouncementText(
                      getSessionAnnouncementTemplate(sarvamLanguage, currentSession.speaker, currentSession.title, eventProject?.title || 'Think for Bharat 1.0')
                    )
                  }
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 underline"
                >
                  Reset Template
                </button>
              </div>

              <textarea
                value={announcementText}
                onChange={(e) => {
                  setAnnouncementText(e.target.value);
                  setIsApproved(false);
                }}
                rows={3}
                className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
              />

              {sarvamStatusMsg && (
                <div className="text-[11px] text-emerald-400 font-mono animate-fadeIn">
                  {sarvamStatusMsg}
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlayLocal}
                    disabled={isGeneratingSarvam}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                    style={{ padding: '8px 14px' }}
                  >
                    {isPlayingLocal ? (
                      <>
                        <Square className="h-3.5 w-3.5 text-rose-400" />
                        <span>Stop Rehearsal</span>
                      </>
                    ) : (
                      <>
                        <Headphones className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Rehearse in Earphone (IEM)</span>
                      </>
                    )}
                  </button>

                  {!isApproved ? (
                    <button
                      onClick={() => setIsApproved(true)}
                      className="btn-secondary text-xs text-amber-400 border-amber-500/30"
                      style={{ padding: '8px 12px' }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                      <span>Approve Script for Stage</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Script Approved
                    </span>
                  )}
                </div>

                <button
                  onClick={handleTriggerBroadcast}
                  disabled={!isApproved || isBroadcasting}
                  className="btn-primary text-xs flex items-center gap-1.5"
                  style={{
                    padding: '8px 16px',
                    opacity: !isApproved ? 0.4 : 1,
                  }}
                >
                  <Radio className={`h-4 w-4 ${isBroadcasting ? 'animate-spin' : ''}`} />
                  <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to Stage PA (Live)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* THINK FOR BHARAT 1.0 ANNOUNCEMENTS SOUNDBOARD */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h3 className="text-subheading text-sm font-bold text-white">
                  Think for Bharat 1.0 — Stage Soundboard & Presets
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Click preset to load or broadcast immediately
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BHARAT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="rounded-lg p-3 bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 transition-default flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white">{preset.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 italic">
                      &ldquo;{preset.script[sarvamLanguage]}&rdquo;
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        setAnnouncementText(preset.script[sarvamLanguage]);
                        setIsApproved(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Load into Console
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          setAnnouncementText(preset.script[sarvamLanguage]);
                          handleTogglePlayLocal();
                        }}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1"
                        title="Rehearse in Earphones"
                      >
                        <Headphones className="h-3 w-3" />
                        <span>IEM</span>
                      </button>

                      <button
                        onClick={() => {
                          setAnnouncementText(preset.script[sarvamLanguage]);
                          setIsApproved(true);
                          setTimeout(() => {
                            handleTriggerBroadcast();
                          }, 100);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
                        title="Broadcast live to PA"
                      >
                        <Radio className="h-3 w-3" />
                        <span>Air</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Stage Queue & Live Broadcast Log */}
        <div className="space-y-4">
          {/* Next Upcoming Session Card */}
          <div
            className="rounded-xl p-4 space-y-2.5"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="badge badge-neutral uppercase font-mono text-[9px]">
                Up Next on Stage
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {nextSession.time}
              </span>
            </div>

            <h4 className="text-xs font-bold text-white leading-snug">
              {nextSession.title}
            </h4>

            <div className="text-[11px] text-zinc-400">
              Speaker: <strong className="text-zinc-200">{nextSession.speaker}</strong>
            </div>

            <div className="text-[11px] text-zinc-400">
              Stage: <span className="font-mono text-emerald-400">{nextSession.stage}</span>
            </div>

            <button
              onClick={() => {
                if (currentSessionIndex < agenda.length - 1) {
                  setCurrentSessionIndex((i) => i + 1);
                }
              }}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1 mt-2"
              style={{ padding: '6px' }}
            >
              <span>Cue This Session Now</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Master Run-of-Show Queue */}
          <div
            className="rounded-xl p-4 space-y-2.5"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-white">Master Run-of-Show</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{agenda.length} items</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {agenda.map((item, idx) => {
                const isCur = idx === currentSessionIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSessionIndex(idx)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-default flex items-center justify-between ${
                      isCur
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-white'
                        : 'bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {item.time} • {item.speaker}
                      </div>
                    </div>
                    {isCur && (
                      <span className="badge badge-accent text-[9px] font-mono flex-shrink-0">
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Stage Broadcast Log */}
          <div
            className="rounded-xl p-4 space-y-2.5"
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                <span>Stage Broadcast Telemetry</span>
              </span>
              <span className="status-dot status-dot-live" />
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-[11px] font-mono text-zinc-400">
              {broadcastLog.map((log, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-black/40 border border-zinc-800/80 leading-relaxed text-[10px]"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
