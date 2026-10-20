import { NextResponse } from 'next/server';
import { WorkflowPlan, WorkflowStep, DomainType, Project, EventSpeaker, PodcastGuest } from '@/lib/types';
import { persistProjectToDb } from '@/lib/server/db';
import { orchestrate } from '@/lib/server/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Conversation Mode (Multi-turn LLM Event Operator)
    if (body.messages && Array.isArray(body.messages)) {
      const response = await orchestrate({
        messages: body.messages,
        currentBrief: body.currentBrief || null,
      });
      return NextResponse.json({ success: true, ...response });
    }

    // 2. Workflow Plan Generation Mode (Prompt -> Dependent Task Graph)
    const { prompt, agents, projects } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Instruction prompt or conversation messages are required' }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();

    // 1. Detect Operation Type
    const isPodcast = lower.includes('podcast') || lower.includes('episode') || lower.includes('interview') || lower.includes('soundcheck') || lower.includes('show notes');
    const isEvent = lower.includes('event') || lower.includes('conference') || lower.includes('summit') || lower.includes('symposium') || lower.includes('speaker') || lower.includes('agenda') || lower.includes('attendee');

    const domain: DomainType = isPodcast && !isEvent ? 'podcast' : 'event';

    // 2. Detect whether the user is creating a NEW project/operation
    const isCreatingNew = lower.includes('create') || lower.includes('organize') || lower.includes('launch') || lower.includes('setup') || lower.includes('new');

    // Extract potential title or use contextual naming
    let projectTitle = '';
    const titleMatch = cleanPrompt.match(/(?:create|organize|launch|for|titled|called)\s+(?:an?\s+)?["']?([^"',.]+?)["']?(?:\s+(?:conference|summit|event|podcast|episode|on|at|with)|$)/i);
    
    if (titleMatch && titleMatch[1] && titleMatch[1].length > 3) {
      projectTitle = titleMatch[1].trim();
      // Capitalize properly
      projectTitle = projectTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!projectTitle.toLowerCase().includes('conference') && !projectTitle.toLowerCase().includes('summit') && !projectTitle.toLowerCase().includes('podcast')) {
        projectTitle += domain === 'event' ? ' Conference 2026' : ' Series';
      }
    } else {
      projectTitle = domain === 'event' ? 'Autonomous AI Symposium 2026' : 'The Synthetic Frontier: Episode 45';
    }

    // Determine or construct target project
    let targetProject: Project;
    let isNewProjectCreated = false;

    if (isCreatingNew) {
      isNewProjectCreated = true;
      const newProjectId = `proj-${Date.now().toString(36)}`;
      
      const sampleSpeakers: EventSpeaker[] = [
        {
          id: `spk-${Date.now()}-1`,
          name: 'Dr. Marcus Vance',
          title: 'Head of Voice Systems',
          company: 'HyperSpeech Labs',
          email: 'm.vance@hyperspeech.ai',
          phone: '+1 (415) 555-0198',
          sessionTitle: 'Full-Duplex Conversational LLM Telephony',
          timeSlot: '10:00 AM - 10:45 AM',
          stage: 'Main Auditorium',
          status: 'pending_call',
        },
        {
          id: `spk-${Date.now()}-2`,
          name: 'Elena Rostova',
          title: 'Lead Speech Architect',
          company: 'OpenVoice Org',
          email: 'elena@openvoice.org',
          phone: '+1 (206) 555-0288',
          sessionTitle: 'Sub-200ms Latency Multi-Agent Coordination',
          timeSlot: '11:15 AM - 12:00 PM',
          stage: 'Main Auditorium',
          status: 'pending_call',
        }
      ];

      const sampleGuests: PodcastGuest[] = [
        {
          id: `gst-${Date.now()}-1`,
          name: 'Dr. Aris Thorne',
          role: 'Creator of UltraVoice',
          topic: 'Low-latency Real-Time Audio Diffusion',
          episodeNumber: 45,
          email: 'aris@ultravoice.org',
          phone: '+1 (415) 555-0722',
          status: 'booked',
          recordingDate: 'Tomorrow at 02:00 PM EST',
        }
      ];

      targetProject = {
        id: newProjectId,
        type: domain,
        title: projectTitle,
        description: `Coordinated multi-agent operation for ${projectTitle}. Extracted from voice command: "${cleanPrompt}".`,
        date: domain === 'event' ? 'Dec 15 - 17, 2026' : 'Season 3 (Weekly)',
        locationOrPlatform: domain === 'event' ? 'Moscone West Center, San Francisco' : 'Spotify, YouTube, Apple Podcasts',
        status: 'active',
        assignedAgentIds: agents
          .filter((a: any) => a.domain === domain || a.domain === 'shared')
          .map((a: any) => a.id),
        metrics: {
          progressPercent: 15,
          tasksTotal: 4,
          tasksCompleted: 0,
          speakersOrGuestsCount: domain === 'event' ? sampleSpeakers.length : sampleGuests.length,
          registeredAttendeesCount: domain === 'event' ? 650 : undefined,
          callsMadeCount: 0,
        },
        speakers: domain === 'event' ? sampleSpeakers : undefined,
        guests: domain === 'podcast' ? sampleGuests : undefined,
        tags: [domain.toUpperCase(), 'Voice AI', 'EchoFrame Orchestrated'],
      };

      // Persist new project to DB if configured
      await persistProjectToDb(targetProject);
    } else {
      // Pick existing project matching domain or title
      targetProject = projects?.find((p: any) => p.type === domain) || projects?.[0] || {
        id: 'proj-default',
        title: projectTitle,
        type: domain,
      };
    }

    // 3. Generate Structured Dependent Task Graph
    let steps: WorkflowStep[] = [];
    let summary = '';
    let speechFeedback = '';

    if (domain === 'event') {
      summary = `Autonomous Event Setup & Coordinated Outreach for ${targetProject.title}`;
      speechFeedback = `I have initialized ${targetProject.title}. Aria Vance has prepared keynote speaker outreach requiring your approval before placing phone calls. Chronos Webb is calculating the stage run-of-show buffer, and Atlas Reid will monitor the attendee hotline.`;

      const step1Id = `step-${Date.now()}-1`;
      const step2Id = `step-${Date.now()}-2`;
      const step3Id = `step-${Date.now()}-3`;
      const step4Id = `step-${Date.now()}-4`;

      steps = [
        {
          id: step1Id,
          agentId: 'agent-aria',
          title: 'Review Presentation Specs & Technical Riders for Keynotes',
          description: 'Aria validates slide deck ratios (16:9 4K) and wireless audio microphone requirements.',
          actionType: 'analysis',
          requiresHumanApproval: false,
          status: 'in_progress',
        },
        {
          id: step2Id,
          agentId: 'agent-aria',
          title: 'Outbound Speaker Confirmation Phone Call to Dr. Marcus Vance',
          description: 'Aria calls keynote speaker Dr. Marcus Vance (+1 415-555-0198) via Bolna telephony to confirm on-stage arrival.',
          actionType: 'voice_call',
          requiresHumanApproval: true,
          dependsOn: [step1Id],
          status: 'awaiting_approval',
        },
        {
          id: step3Id,
          agentId: 'agent-chronos',
          title: 'Rebalance Stage Run-of-Show and Lock Audio Transitions',
          description: 'Chronos calculates buffer times, timing drift, and sends audio cues to the auditorium A/V booth.',
          actionType: 'schedule',
          requiresHumanApproval: false,
          dependsOn: [step2Id],
          status: 'pending',
        },
        {
          id: step4Id,
          agentId: 'agent-atlas',
          title: 'Deploy Real-Time Attendee Voice Concierge on Venue Hotline',
          description: 'Atlas Reid activates the 24/7 hotline telephony stream for venue navigation and badge pickup kiosks.',
          actionType: 'voice_call',
          requiresHumanApproval: false,
          dependsOn: [step3Id],
          status: 'pending',
        },
      ];
    } else {
      // Podcast Workflow
      summary = `End-to-End Podcast Production & Audio Mastering for ${targetProject.title}`;
      speechFeedback = `Podcast episode pipeline initialized. Kaelen Voss is generating the research briefing dossier. Talia Brooks has queued the microphone soundcheck call for your sign-off, and Lyra Mercer will master the episode stems upon recording.`;

      const step1Id = `step-${Date.now()}-1`;
      const step2Id = `step-${Date.now()}-2`;
      const step3Id = `step-${Date.now()}-3`;
      const step4Id = `step-${Date.now()}-4`;

      steps = [
        {
          id: step1Id,
          agentId: 'agent-kaelen',
          title: 'Assemble Guest Research Dossier & 10 Contrarian Questions',
          description: 'Kaelen parses recent publications, GitHub releases, and past podcast talks to extract interview angles.',
          actionType: 'research',
          requiresHumanApproval: false,
          status: 'in_progress',
        },
        {
          id: step2Id,
          agentId: 'agent-talia',
          title: 'Remote Acoustic & Microphone Soundcheck Call to Guest',
          description: 'Talia dials guest (+1 415-555-0722) via Bolna to test room flutter, microphone gain, and send studio link.',
          actionType: 'voice_call',
          requiresHumanApproval: true,
          dependsOn: [step1Id],
          status: 'awaiting_approval',
        },
        {
          id: step3Id,
          agentId: 'agent-lyra',
          title: 'Post-Production Audio Stem Mastering (-16 LUFS) & Show Notes',
          description: 'Lyra balances voice tracks, strips background rumble, and writes timestamped Markdown show notes.',
          actionType: 'analysis',
          requiresHumanApproval: false,
          dependsOn: [step2Id],
          status: 'pending',
        },
        {
          id: step4Id,
          agentId: 'agent-zephyr',
          title: 'Extract 5 Viral Short-Form Clips & Social Campaign Copy',
          description: 'Zephyr isolates 30-second high-energy soundbites and drafts promotional threads for X and LinkedIn.',
          actionType: 'email',
          requiresHumanApproval: true,
          dependsOn: [step3Id],
          status: 'pending',
        },
      ];
    }

    const plan: WorkflowPlan = {
      id: `wf-${Date.now()}`,
      userPrompt: cleanPrompt,
      projectId: targetProject.id,
      projectTitle: targetProject.title,
      domain,
      summary,
      steps,
      status: 'draft',
    };

    return NextResponse.json({
      success: true,
      plan,
      speechFeedback,
      createdProject: isNewProjectCreated ? targetProject : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Workflow orchestration error: ${err.message}` },
      { status: 500 }
    );
  }
}
