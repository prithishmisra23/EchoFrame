/**
 * EchoFrame Orchestrator — Server-side LLM-powered event planning intelligence
 * 
 * Uses Sarvam AI chat completions to:
 * 1. Understand multilingual event descriptions
 * 2. Extract structured event brief fields
 * 3. Ask intelligent follow-up questions
 * 4. Suggest agent assignments based on event needs
 * 5. Propose concrete operational tasks
 */

import type { ConversationMessage, OrchestratorResponse, EventBrief } from '@/lib/types';
import { SarvamAIClient } from 'sarvamai';

// Agent capabilities for the orchestrator's context
const AGENT_CAPABILITIES = [
  { role: 'speaker_coordination', name: 'Aria Vance', agentId: 'agent-aria', capabilities: 'Speaker outreach, confirmation calls, technical rider collection, slide submissions, green room coordination' },
  { role: 'attendee_support', name: 'Atlas Reid', agentId: 'agent-atlas', capabilities: 'Attendee concierge, venue navigation, badge pickup, Wi-Fi, parking, dietary info' },
  { role: 'registrations_ticketing', name: 'Vance Sterling', agentId: 'agent-vance', capabilities: 'Ticket tiers, corporate group discounts, waitlist management, payment reconciliation' },
  { role: 'scheduling_agenda', name: 'Chronos Webb', agentId: 'agent-chronos', capabilities: 'Master run-of-show, stage timing, schedule conflict resolution, buffer management' },
  { role: 'stage_hosting_mc', name: 'Nova Thorne', agentId: 'agent-nova', capabilities: 'Stage announcements, speaker introductions, housekeeping, sponsor mentions, audience engagement' },
  { role: 'post_event_feedback', name: 'Echo Rivera', agentId: 'agent-echo', capabilities: 'NPS surveys, post-event voice feedback calls, sentiment analysis, executive summary decks' },
  { role: 'guest_coordination', name: 'Talia Brooks', agentId: 'agent-talia', capabilities: 'Podcast guest scouting, soundcheck calls, studio booking, recording guidelines' },
  { role: 'research_briefing', name: 'Kaelen Voss', agentId: 'agent-kaelen', capabilities: 'Guest research dossiers, interview question synthesis, publication analysis' },
  { role: 'interviewing_cohost', name: 'Orion Black', agentId: 'agent-orion', capabilities: 'Live interview co-hosting, real-time follow-up prompts, fact-checking' },
  { role: 'episode_production', name: 'Lyra Mercer', agentId: 'agent-lyra', capabilities: 'Audio post-production, show notes generation, chapter markers, loudness normalization' },
  { role: 'content_distribution', name: 'Zephyr Cole', agentId: 'agent-zephyr', capabilities: 'Social media clips, viral hook extraction, LinkedIn carousels, YouTube titles' },
];

function buildSystemPrompt(currentBrief: Partial<EventBrief> | null): string {
  const agentList = AGENT_CAPABILITIES
    .map(a => `- ${a.name} (${a.role}): ${a.capabilities}`)
    .join('\n');

  const briefState = currentBrief
    ? `\nCurrent known event details:\n${JSON.stringify(currentBrief, null, 2)}`
    : '\nNo event details have been captured yet.';

  return `You are EchoFrame, an intelligent AI event operations planner. You help organizers plan, coordinate, and execute events and podcasts.

Your conversation style:
- Be warm, professional, and concise
- Understand the organizer's vision before jumping to logistics
- Ask ONE or TWO clarifying questions at a time, not a long list
- Respond in the SAME LANGUAGE the organizer writes in (Hindi, Tamil, English, etc.)
- When you have enough information, proactively suggest a plan

Available AI agents you can assign:
${agentList}
${briefState}

CRITICAL: You must respond with VALID JSON matching this exact schema (no markdown fences, no extra text):
{
  "message": "Your conversational response to the organizer (in their language)",
  "briefUpdates": { "name": "...", "type": "...", "date": "...", "venue": "...", "expectedAttendance": 100, ... },
  "questions": ["question1", "question2"],
  "readyForPlanning": true/false,
  "agentSuggestions": [{ "agentId": "agent-aria", "agentName": "Aria Vance", "role": "speaker_coordination", "reason": "..." }],
  "proposedTasks": [{ "title": "...", "description": "...", "agentRole": "speaker_coordination", "actionType": "voice_call", "requiresApproval": true }]
}

CRITICAL JSON RULES:
- Output MUST be 100% strictly valid parseable JSON.
- Every object inside "proposedTasks" MUST have "title" as a key: {"title": "Task name", "description": "...", "agentRole": "...", "actionType": "voice_call", "requiresApproval": true}. NEVER output bare strings like {"Task name", "description": ...}.
- "briefUpdates" — capture any event details mentioned (name, type, date, venue, expectedAttendance, speakers). If the user states an event name like "Bolna AI Event Hackathon", immediately put it in briefUpdates.name.
- "questions" — ask 1-2 questions about missing critical details (name, type, date, venue, attendance, speakers). Empty array if you have enough.
- "readyForPlanning" — true ONLY when you have name, type, date, venue (or virtual), and approximate attendance.
- "agentSuggestions" — suggest agents that match the event's needs. Only include when readyForPlanning is true.
- "proposedTasks" — concrete operational tasks. Only include when readyForPlanning is true.
- actionType must be one of: voice_call, email, research, scheduling, content, system
- Always respond in the organizer's language for the "message" field`;
}

interface OrchestrationInput {
  messages: ConversationMessage[];
  currentBrief: Partial<EventBrief> | null;
}

function cleanAssistantContentForHistory(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"message"')) {
    const match = trimmed.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (match) return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
  return content;
}

export async function orchestrate(input: OrchestrationInput): Promise<OrchestratorResponse> {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    // Fallback: generate a structured response without LLM
    return generateFallbackResponse(input);
  }

  const systemPrompt = buildSystemPrompt(input.currentBrief);

  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...input.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant' 
        ? cleanAssistantContentForHistory(m.content)
        : m.content,
    })),
  ];

  // Detect language of last user message for fallback messaging
  const lastUserMsg = [...input.messages].reverse().find(m => m.role === 'user')?.content || '';
  const userLang: 'hi' | 'ta' | 'en' = /[\u0900-\u097F]/.test(lastUserMsg)
    ? 'hi'
    : /[\u0B80-\u0BFF]/.test(lastUserMsg)
      ? 'ta'
      : 'en';

  try {
    const client = new SarvamAIClient({
      apiSubscriptionKey: apiKey,
    });

    const response = await client.chat.completions({
      model: 'sarvam-105b-conversations',
      messages: chatMessages,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const rawContent = response.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error('[orchestrate] Empty response from Sarvam');
      return generateFallbackResponse(input);
    }

    // Step 1: Attempt JSON repair and parse
    const repaired = repairAndParseJson(rawContent);
    if (repaired) {
      return validateResponse(repaired);
    }

    // Step 2: If standard JSON parsing fails, extract all fields using regex
    console.warn('[orchestrate] JSON parse failed, attempting regex fallback extraction');
    const fallbackExtracted = extractFallbackFromRaw(rawContent, userLang);
    return validateResponse(fallbackExtracted);
  } catch (error) {
    console.error('[orchestrate] Network or API error:', error);
    return generateFallbackResponse(input);
  }
}

/**
 * Clean and repair malformed JSON from LLM outputs
 */
export function repairAndParseJson(raw: string): OrchestratorResponse | null {
  if (!raw) return null;
  let s = raw.trim();

  // Strip code fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extract from first { to last }
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }

  // Repair missing "title": key in objects e.g. { "Attendee Hotline Setup", "description": ... }
  s = s.replace(/(\{\s*)"([^":\r\n]+)",\s*"(description|agentRole|actionType|requiresApproval)"/g, '$1"title": "$2", "$3"');

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');

  try {
    const parsed = JSON.parse(s) as OrchestratorResponse;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback regex extractor if JSON is partially cut off or has complex syntax errors
 */
export function extractFallbackFromRaw(raw: string, userLanguage: 'hi' | 'ta' | 'en' = 'en'): OrchestratorResponse {
  const briefUpdates: Partial<EventBrief> = {};

  // Extract name
  const nameMatch = raw.match(/"name"\s*:\s*"([^"]+)"/);
  if (nameMatch) briefUpdates.name = nameMatch[1].trim();

  // Extract type
  const typeMatch = raw.match(/"type"\s*:\s*"([^"]+)"/);
  if (typeMatch) briefUpdates.type = typeMatch[1].trim();

  // Extract date
  const dateMatch = raw.match(/"date"\s*:\s*"([^"]+)"/);
  if (dateMatch) briefUpdates.date = dateMatch[1].trim();

  // Extract venue
  const venueMatch = raw.match(/"venue"\s*:\s*"([^"]+)"/);
  if (venueMatch) briefUpdates.venue = venueMatch[1].trim();

  // Extract expectedAttendance
  const scaleMatch = raw.match(/"expectedAttendance"\s*:\s*(\d+)/);
  if (scaleMatch) briefUpdates.expectedAttendance = parseInt(scaleMatch[1], 10);

  // Extract readyForPlanning
  const readyMatch = raw.match(/"readyForPlanning"\s*:\s*(true|false)/);
  const readyForPlanning = readyMatch ? readyMatch[1] === 'true' : !!(briefUpdates.name && briefUpdates.date && briefUpdates.venue);

  // Extract conversational message
  let message = '';
  const msgMatch = raw.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (msgMatch) {
    message = msgMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  } else {
    // If raw didn't start with JSON or has text outside
    const nonJsonText = raw.replace(/\{[\s\S]*$/, '').trim();
    if (nonJsonText && !nonJsonText.startsWith('{')) {
      message = nonJsonText;
    } else if (briefUpdates.name) {
      message = userLanguage === 'hi'
        ? `बिल्कुल! '${briefUpdates.name}' के सारे मुख्य विवरण नोट कर लिए गए हैं। अब हम ऑपरेशंस प्लान तैयार कर सकते हैं।`
        : userLanguage === 'ta'
          ? `'${briefUpdates.name}' நிகழ்வின் அனைத்து விவரங்களும் பெறப்பட்டன. இப்போது திட்டமிடலைத் தொடங்கலாம்.`
          : `Wonderful! I have captured the details for "${briefUpdates.name}". We are ready to launch operations.`;
    } else {
      message = userLanguage === 'hi'
        ? `विवरण नोट कर लिए गए हैं। चलिए आगे की प्लानिंग करते हैं।`
        : `Details noted. Let's proceed with your event operations.`;
    }
  }

  // Extract agent suggestions if present
  let agentSuggestions: any[] | undefined;
  const agentsMatch = raw.match(/"agentSuggestions"\s*:\s*(\[[\s\S]*?\])(?=\s*,\s*"|\s*})/);
  if (agentsMatch) {
    try {
      agentSuggestions = JSON.parse(agentsMatch[1]);
    } catch {}
  }

  // Extract proposed tasks if present
  let proposedTasks: any[] | undefined;
  const tasksMatch = raw.match(/"proposedTasks"\s*:\s*(\[[\s\S]*?\])(?=\s*})/);
  if (tasksMatch) {
    try {
      const fixedTasks = tasksMatch[1]
        .replace(/(\{\s*)"([^":\r\n]+)",\s*"(description|agentRole|actionType|requiresApproval)"/g, '$1"title": "$2", "$3"')
        .replace(/,\s*([}\]])/g, '$1');
      proposedTasks = JSON.parse(fixedTasks);
    } catch {}
  }

  return {
    message,
    briefUpdates: Object.keys(briefUpdates).length > 0 ? briefUpdates : undefined,
    questions: [],
    readyForPlanning,
    agentSuggestions,
    proposedTasks,
  };
}

function validateResponse(raw: OrchestratorResponse): OrchestratorResponse {
  // Ensure message is never a raw unparsed JSON object string
  let cleanMsg = typeof raw.message === 'string' ? raw.message : 'I understand. Let me help you plan this event.';
  if (cleanMsg.trim().startsWith('{') && cleanMsg.includes('"message"')) {
    const extracted = cleanAssistantContentForHistory(cleanMsg);
    if (extracted) cleanMsg = extracted;
  }

  return {
    message: cleanMsg,
    briefUpdates: raw.briefUpdates && typeof raw.briefUpdates === 'object' ? raw.briefUpdates : undefined,
    questions: Array.isArray(raw.questions) ? raw.questions.filter(q => typeof q === 'string') : [],
    readyForPlanning: typeof raw.readyForPlanning === 'boolean' ? raw.readyForPlanning : false,
    agentSuggestions: Array.isArray(raw.agentSuggestions)
      ? raw.agentSuggestions.filter(a => a.agentId && a.role)
      : undefined,
    proposedTasks: Array.isArray(raw.proposedTasks)
      ? raw.proposedTasks.filter(t => t.title && t.agentRole)
      : undefined,
  };
}

function generateFallbackResponse(input: OrchestrationInput): OrchestratorResponse {
  const lastUserMsg = [...input.messages].reverse().find(m => m.role === 'user')?.content || '';
  const brief = input.currentBrief || {};
  const lower = lastUserMsg.toLowerCase();

  // Detect if this is Hindi/Tamil
  const hasDevanagari = /[\u0900-\u097F]/.test(lastUserMsg);
  const hasTamil = /[\u0B80-\u0BFF]/.test(lastUserMsg);

  // Simple keyword extraction for fallback
  const updates: Partial<EventBrief> = {};
  const questions: string[] = [];

  // Try to extract event name
  if (!brief.name) {
    const nameMatch = lower.match(/(?:called|named|titled|event)\s+["']?([^"'\n,]{3,50})/i);
    if (nameMatch) {
      updates.name = nameMatch[1].trim();
    } else {
      // If user typed just the event name e.g. "bolna ai event hackathon"
      const trimmed = lastUserMsg.trim();
      if (trimmed.length >= 3 && trimmed.length <= 60 && !/[?¿!]/.test(trimmed) && !/^(what|where|when|who|how|why|is|can|could|please|yes|no|ok|okay)\b/i.test(trimmed)) {
        updates.name = trimmed;
      }
    }
  }

  // Try to detect event type
  if (!brief.type) {
    if (lower.includes('conference') || lower.includes('summit')) updates.type = 'conference';
    else if (lower.includes('workshop')) updates.type = 'workshop';
    else if (lower.includes('podcast')) updates.type = 'podcast';
    else if (lower.includes('webinar')) updates.type = 'webinar';
    else if (lower.includes('meetup')) updates.type = 'meetup';
    else if (lower.includes('hackathon')) updates.type = 'hackathon';
    else if (lower.includes('concert') || lower.includes('festival')) updates.type = 'festival';
  }

  // Detect attendees
  const attendeeMatch = lower.match(/(\d{2,5})\s*(?:people|attendees|guests|participants|seats)/);
  if (attendeeMatch && !brief.expectedAttendance) {
    updates.expectedAttendance = parseInt(attendeeMatch[1], 10);
  }

  // Build questions for missing fields
  if (!brief.name && !updates.name) {
    questions.push(hasDevanagari ? 'आपके इवेंट का नाम क्या है?' :
      hasTamil ? 'உங்கள் நிகழ்வின் பெயர் என்ன?' :
        'What would you like to name this event?');
  }
  if (!brief.date) {
    questions.push(hasDevanagari ? 'इवेंट की तारीख क्या है?' :
      hasTamil ? 'நிகழ்வு எந்த தேதியில் நடைபெறும்?' :
        'When is the event planned for?');
  }
  if (!brief.venue) {
    questions.push(hasDevanagari ? 'इवेंट कहाँ होगा?' :
      hasTamil ? 'நிகழ்வு எங்கே நடைபெறும்?' :
        'Where will the event take place? (venue or virtual)');
  }

  const hasEnoughForPlan = !!(
    (brief.name || updates.name) &&
    brief.date &&
    brief.venue &&
    (brief.expectedAttendance || updates.expectedAttendance)
  );

  let message: string;
  if (input.messages.length <= 1) {
    message = hasDevanagari
      ? `बहुत अच्छा! मैं EchoFrame हूँ, आपका AI इवेंट ऑपरेटर। मैं आपके इवेंट को समझ रहा हूँ। कुछ और बातें जानना चाहूँगा...`
      : hasTamil
        ? `அருமை! நான் EchoFrame, உங்கள் AI நிகழ்வு ஆபரேட்டர். உங்கள் நிகழ்வைப் புரிந்துகொள்கிறேன். சில கேள்விகள்...`
        : `Wonderful! I'm EchoFrame, your AI event operator. I'm understanding your vision. Let me ask a couple of things to shape the right plan for you.`;
  } else if (hasEnoughForPlan) {
    message = hasDevanagari
      ? `शानदार! मेरे पास प्लान बनाने के लिए काफी जानकारी है। मैं अब आपके इवेंट के लिए एजेंट्स और टास्क सुझा रहा हूँ।`
      : `Excellent! I have enough to build your operations plan. Let me suggest the right team and tasks for your event.`;
  } else {
    message = hasDevanagari
      ? `समझ गया। कुछ और जानकारी चाहिए:`
      : hasTamil
        ? `புரிகிறது. இன்னும் சில தகவல்கள் தேவை:`
        : `Got it! I need a couple more details to build your plan:`;
  }

  // Suggest agents when ready
  let agentSuggestions;
  let proposedTasks;
  if (hasEnoughForPlan) {
    const eventType = brief.type || updates.type || 'event';
    agentSuggestions = AGENT_CAPABILITIES
      .filter(a => {
        if (eventType === 'podcast') return a.role.includes('guest') || a.role.includes('research') || a.role.includes('interview') || a.role.includes('episode') || a.role.includes('content');
        return a.role.includes('speaker') || a.role.includes('attendee') || a.role.includes('registration') || a.role.includes('scheduling') || a.role.includes('stage') || a.role.includes('feedback');
      })
      .map(a => ({
        agentId: a.agentId,
        agentName: a.name,
        role: a.role,
        reason: `Handles ${a.capabilities.split(',')[0].toLowerCase()} for your ${eventType}`,
      }));

    proposedTasks = [
      { title: 'Confirm venue logistics', description: `Verify venue availability and technical requirements for ${brief.venue || 'the venue'}`, agentRole: 'scheduling_agenda', actionType: 'scheduling', requiresApproval: true },
      { title: 'Draft speaker outreach', description: 'Prepare and send speaker invitation emails with event details', agentRole: 'speaker_coordination', actionType: 'email', requiresApproval: true },
      { title: 'Setup registration portal', description: `Configure ticketing for ${brief.expectedAttendance || updates.expectedAttendance || 'expected'} attendees`, agentRole: 'registrations_ticketing', actionType: 'system', requiresApproval: false },
    ];
  }

  return {
    message,
    briefUpdates: Object.keys(updates).length > 0 ? updates : undefined,
    questions: questions.slice(0, 2),
    readyForPlanning: hasEnoughForPlan,
    agentSuggestions,
    proposedTasks,
  };
}
