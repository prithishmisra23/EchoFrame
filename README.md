# 🎙️ EchoFrame — Multi-Agent Voice AI Orchestration Platform

> **A coordinated team of specialized AI agents for live events & podcast productions**  
> Live demo: **[echoframee.vercel.app](https://echoframee.vercel.app)**  
> Stack: Next.js · TypeScript · Supabase · Bolna Voice AI · Sarvam AI (Bulbul v4 Flash)

---

## 🌟 Overview

Instead of relying on a single generic chatbot, **EchoFrame** deploys a coordinated squad of specialized AI agents. Each agent is purpose-built with tailored system prompts, voice personas, RAG knowledge bases, and permission-gated tools — orchestrated from a single command center.

**Flagship demo**: *Think for Bharat 1.0* — a national 24-hour AI hackathon at Bharat Mandapam, New Delhi with 2,400+ hackers, mentors, and judges. EchoFrame manages stage PA announcements, attendee personal AI concierges, speaker coordination, and live ops — all in Hindi, English, and Tamil.

---

## ⚡ Feature Map

### 1. 🤖 Event Operator (Conversational AI Planner)
- Chat with the AI planner in natural language to design your event: just describe it in English, Hindi, or Tamil
- Five quick-start briefs for common event types (National Hackathon, Global Summit, Podcast, etc.)
- The AI extracts structured data (date, venue, speakers, tracks, budget) and proposes an agent team and task plan
- One-click to launch the full multi-agent team with tasks pre-loaded in the Operations board

### 2. 🎭 AI Stage Host — Live PA & Announcements
- **Real microphone integration** via Web Audio API with VU meter and device enumeration
- **In-Ear Monitor (IEM) rehearsal**: hear the script in your earphone before going live
- **Sarvam AI Bulbul v4 Flash** multilingual TTS in Hindi (hi-IN), Indian English (en-IN), and Tamil (ta-IN)
- 8 pre-built Think for Bharat announcement presets (Grand Inauguration, Hackathon Kickoff, Code Freeze Alert, Awards Ceremony, etc.)
- **Stage Broadcast Telemetry**: live log of every PA broadcast with timestamps
- Master Run-of-Show timeline with 11 agenda items — navigate sessions with Prev/Next
- Speaker introduction script auto-generator (pulls from project's speaker list)
- Language-aware voice selector (Simran, Shubh, Aditya, Anand for Hindi; Gokul, Vijay for Tamil)

### 3. 🧑‍💻 Personal AI Concierge for Attendees
- Per-attendee intelligent chatbot powered by event knowledge (venue, schedule, Wi-Fi, rules, food)
- **Bharat Mitra AI** — welcomes attendees by name in their preferred language
- Voice answers (Sarvam TTS) with "Play Voice" button on each message
- Quick-inquiry chips: Wi-Fi Credentials, Code Freeze & Schedule, Mentor Request, Hackathon Rules, Venue Map
- **Attendee Directory & Roster** — full table of all 8+ registered attendees with check-in status, badge codes, roles, and tracks
- Add new attendees on the fly with the inline roster form
- One-click "Call Attendee" via Bolna outbound telephony

### 4. 📊 Central Operations Dashboard
- KPI cards: Active Events, Podcast Shows, Deployed Agents, Outbound Calls, Pending Approvals
- Projects overview with live progress bars, speaker/guest counters, and voice campaign launchers
- Real-time activity feed with agent action telemetry

### 5. 🤖 Agent Studio (11 Specialized Roles)

#### 🎪 Event Agents:
1. **Nova Thorne** — Stage Hosting & Voice MC (PA announcements, teleprompter)
2. **Aria Vance** — Speaker Coordination (outreach calls, riders, green room)
3. **Atlas Reid** — Attendee Support & Concierge (24/7 venue hotline)
4. **Vance Sterling** — Registrations & Capacity (ticket quotas, waitlists)
5. **Chronos Webb** — Scheduling & Agenda Director (run-of-show timing)
6. **Echo Rivera** — Post-Event Feedback & NPS (voice survey calls)

#### 🎙️ Podcast Agents:
7. **Talia Brooks** — Guest Coordination (talent invitations, studio booking)
8. **Kaelen Voss** — Research & Briefing (dossiers, contrarian questions)
9. **Orion Black** — Voice Interview Co-Host (in-ear whisper, fact-check)
10. **Lyra Mercer** — Episode Audio Producer (mastering, show notes)
11. **Zephyr Cole** — Content Distribution (viral clips, social threads)

### 6. ⚡ Voice Command Center
- Natural language orchestration: speak or type complex multi-step goals
- Real-time canvas sine-wave audio visualizer
- Structured workflow generator: decomposes goals into sequential/parallel agent tasks

### 7. 🛰️ Live Operations & Human-in-the-Loop
- 5-column Kanban: Queued → In Progress → **Awaiting Human Approval** → Completed → Failed
- Approval modal: review, edit Bolna script and phone number before authorizing a call
- Execution telemetry: full transcript, call duration, sentiment analysis

### 8. 📞 Bolna Voice AI Telephony
- Direct Bolna API (`POST /api/bolna/call`) with E.164 phone validation
- Full-duplex sandbox simulation when no API key is set
- Batch voice campaign launcher for all unconfirmed speakers/guests

### 9. 🗄️ Supabase Backend
- PostgreSQL schema with RLS policies for `projects`, `agents`, `tasks`, `activity_logs`
- One-click SQL schema export from the Integrations modal

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | CSS variables, dark mode, glassmorphism |
| Icons | Lucide React |
| Voice TTS | Sarvam AI Bulbul v4 Flash (hi-IN, en-IN, ta-IN) |
| Voice Telephony | Bolna Cloud API |
| Browser Voice | Web Speech API (Recognition + Synthesis) |
| Audio I/O | Web Audio API (VU meter, device enumeration, IEM) |
| Audio Visualizer | Canvas Web Audio Analyser |
| Database | Supabase PostgreSQL + localStorage fallback |

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/prithishmisra23/EchoFrame.git
cd EchoFrame
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
# Sarvam AI (multilingual TTS — Hindi, English, Tamil)
SARVAM_API_KEY=sk_your_key_here

# Bolna Voice AI (outbound telephony)
BOLNA_API_KEY=bn-your_key_here
BOLNA_BASE_URL=https://api.bolna.ai
BOLNA_DEFAULT_AGENT_ID=your_agent_id_here

# Set to false for live calls
ECHOFRAME_SANDBOX_MODE=true
```

> **No API keys?** The app runs fully in **sandbox/demo mode** — Bolna calls are simulated with realistic transcripts, and browser Web Speech replaces Sarvam TTS.

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel
```bash
vercel --prod
```
Add all env vars to your Vercel project's environment settings.

---

## ⚙️ Integrations Configuration

Click the **⚙️ gear icon** → Integrations in the header to configure:
- **Bolna API Key**: `bn_live_...` (or leave empty for Sandbox simulation)
- **Supabase URL & Anon Key**: for cloud persistence
- Click **Export SQL Schema** to get the DDL for your Supabase project

---

## 🎯 Demo: Think for Bharat 1.0

The live demo is pre-loaded with **Think for Bharat 1.0** — India's premier AI hackathon:

| Detail | Value |
|--------|-------|
| Venue | Bharat Mandapam, Pragati Maidan, New Delhi |
| Dates | March 15–16, 2026 |
| Attendees | 2,480 registered |
| Wi-Fi | ThinkForBharat_5G / Bharat@2026 |
| Prize Pool | ₹25 Lakh |
| Tracks | Indic Voice AI, Agritech, Healthcare AI, Fintech DPI |

Try these demo flows:
1. **Stage Host** → click a preset (e.g. "Grand Inauguration") → "Rehearse in Earphone (IEM)" → "Approve Script" → "Broadcast to Stage PA"
2. **Personal AI** → select an attendee → ask "What is the Wi-Fi password?" or "When is code freeze?" in Hindi
3. **Operator** → type "Call unconfirmed speakers for keynote" → approve the task in Operations

---

## ⚠️ Honest Feature Status

| Feature | Status |
|---------|--------|
| Stage PA Announcements (Sarvam TTS) | ✅ Live |
| In-Ear Monitor (IEM) Rehearsal | ✅ Live |
| Mic I/O & VU Meter | ✅ Live |
| Attendee Personal AI Chat | ✅ Live (client-side RAG) |
| Bolna Outbound Calls | ✅ Live (sandbox by default) |
| Event Operator / AI Planner | ✅ Live |
| Supabase Persistence | ⚠️ Schema ready; requires env vars |
| Bolna Webhook Receiver | ⚠️ Planned (Brick 7) |
| Auth / RBAC | ⚠️ Planned (Brick 2) |

Items marked ⚠️ fall back gracefully to localStorage or sandbox simulation.

---

## 📄 License

MIT License. Built for multi-agent voice AI operations at events and podcasts.
