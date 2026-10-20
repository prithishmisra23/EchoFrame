# 🎙️ EchoFrame — Multi-Agent Voice AI Orchestration Platform

> **Coordinated Team of Specialized AI Agents for Live Events & Podcast Productions**  
> Powered by Next.js 16, TypeScript, Tailwind CSS, Supabase, and Bolna Conversational Voice AI Telephony.

---

## 🌟 Overview

Instead of relying on a generic, single chatbot, **EchoFrame** deploys an entire coordinated team of specialized AI agents. Each agent is purpose-built with tailored domain instructions, voice personas, RAG knowledge bases, and permission-gated tools.

- **For Events**: Coordinate keynotes, attendee support, registration quotas, master run-of-show timing, live stage hosting, and post-event NPS surveys.
- **For Podcasts**: Manage guest talent outreach, investigative research dossiers, in-ear live co-hosting, stem audio mastering, and viral social distribution.

---

## ⚡ Key Highlights & Core Features

### 1. 📊 Central Operations Dashboard
- High-level KPIs: Active Events, Podcast Shows, Deployed Agents, Outbound Voice Calls, and Pending Human Approvals.
- **Active Operations Grid**: Live progress bars, run-of-show timeline links, speaker/guest counters, and 1-click batch voice campaign triggers.
- **Real-Time Multi-Agent Telemetry Stream**: Live activity feed tracking agent tool executions, Bolna telephony sessions, and supervisor authorization logs.

### 2. 🤖 Agent Studio (11 Specialized Roles)
Configure each agent's identity, system prompt, voice model, tools, and autonomy permissions:

#### 🎪 Event Management Agents:
1. **Aria Vance** — *Speaker Coordination Agent*: Outreach phone calls, technical riders, presentation slide aspect ratios, green room VIP logistics.
2. **Atlas Reid** — *Attendee Support & Concierge*: 24/7 venue hotline, floor navigation, Wi-Fi access, badge pickup kiosks.
3. **Vance Sterling** — *Registrations & Capacity Agent*: Ticket tier quotas, corporate group discounts, and waitlist allocations.
4. **Chronos Webb** — *Scheduling & Agenda Director*: Run-of-show timing drift, stage buffer calculations, A/V control booth cues.
5. **Nova Thorne** — *Stage Hosting & Voice MC*: Main auditorium PA announcements, speaker introductions, teleprompter feeding.
6. **Echo Rivera** — *Post-Event Feedback & NPS Agent*: Automated 90-second voice check-in surveys, sentiment synthesis.

#### 🎙️ Podcast Production Agents:
7. **Talia Brooks** — *Guest Coordination Agent*: Talent invitations, studio booking, and remote microphone/acoustic soundcheck calls.
8. **Kaelen Voss** — *Research & Briefing Agent*: Deep web guest dossiers, arXiv paper parsing, and 10 contrarian interview questions.
9. **Orion Black** — *Voice Interview Co-Host*: Real-time in-ear whisper prompter, on-the-fly fact checking, sponsor ad roll transitions.
10. **Lyra Mercer** — *Episode Audio & Notes Producer*: Multi-track stems mastering (-16 LUFS), chapter markers, and Markdown show notes.
11. **Zephyr Cole** — *Content & Distribution Strategist*: Viral 30-second soundbite clips, X/Twitter threads, and LinkedIn carousel copy.

- **Interactive Voice Preview**: Test any agent's conversational voice in real-time with browser Web Speech Synthesis and audio waveform animation.

### 3. ⚡ Natural Voice Command Center
- **Natural Language Orchestrator**: Speak or type complex multi-step goals (e.g. *"Call unconfirmed speakers for tomorrow's keynote"* or *"Prepare episode 42 of The Synthetic Frontier with Dr. Aris Thorne"*).
- **Reactive Audio Visualizer**: Real-time canvas sine-wave harmonic visualizer reacting to speech.
- **Structured Multi-Agent Workflow Generator**: Decomposes user requests into sequential/parallel agent tasks, assigning responsibilities and flagging required human approvals.
- **Voice Response Feedback**: EchoFrame speaks synthesized audio responses back to the operator.

### 4. 🛰️ Live Operations Center & Human-in-the-Loop
- **5-Column Kanban Board**: `Backlog` ➔ `In Progress (Agent Working)` ➔ `Awaiting Human Approval` ➔ `Completed` ➔ `Failed / Rejected`.
- **Human-in-the-Loop Approval Modal**: Review sensitive actions (outbound phone calls, schedule changes) before dialing. Operators can inspect and edit the Bolna speech script and target phone number.
- **Execution Telemetry & Call Player**: Review full conversational transcripts (Agent vs. User), audio playback simulation, call duration, and sentiment analysis.

### 5. 📞 Bolna Voice AI & Telephony Integration
- **Direct Bolna API Connectivity**: Supports live outbound calling via `https://api.bolna.ai/call` and agent synchronization.
- **High-Fidelity Sandbox Simulator**: When no API key is provided, the platform automatically switches to a full-duplex sandbox simulation mode with realistic transcripts, call durations, and audio telemetry.
- **Batch Voice Campaigns**: Launch automated confirmation phone calls to all unconfirmed keynotes or podcast guests with 1 click.

### 6. 🗄️ Supabase Relational Database
- Complete PostgreSQL schema with Row-Level Security (RLS) policies for `projects`, `agents`, `tasks`, and `activity_logs`.
- 1-click **Export SQL Schema** button in the Integrations modal to provision your Supabase instance instantly.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Modern dark palette: charcoal `#08080a`, `#0f1016`, emerald `#10b981`, `#059669`)
- **Icons**: Lucide React
- **Voice Infrastructure**: Bolna Cloud API & Web Speech API (Recognition + Synthesis)
- **Audio Visuals**: Canvas Web Audio Analyser
- **Database**: Supabase PostgreSQL + LocalStorage reactive fallback

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## ⚙️ Configuration (Optional)

Configure your credentials via the **Integrations & Settings** gear icon in the top header:
- **Bolna API Key**: `bn_live_...` (or leave empty for Sandbox mode)
- **Supabase URL**: `https://<your-project>.supabase.co`
- **Supabase Anon Key**: `eyJhbGci...`

To set up Supabase tables, click **Export SQL Schema** in the Integrations modal and run it in the Supabase SQL Editor.

---

## 📄 License

MIT License. Built for multi-agent voice AI operations.
