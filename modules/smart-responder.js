/**
 * ═══════════════════════════════════════════════════
 * MODULE: smart-responder.js
 * PURPOSE: Human-level AI responses using a 3-layer system
 *   Layer 1 → Google Gemini 2.0 Flash (upgraded, primary)
 *   Layer 2 → Anthropic Claude (fallback)
 *   Layer 3 → Intelligent local AI (always works, zero errors ever)
 *
 * NEW: Session-aware conversation memory
 * NEW: LinkedIn company knowledge injection
 * NEW: Richer intent routing
 * ═══════════════════════════════════════════════════
 */

const fetch = require('node-fetch');
const { search } = require('./vector-db');
const { getRelevantKnowledge } = require('./knowledge-base');
const { getGeminiResponse } = require('./gemini-ai');
const { getRelevantLinkedInContext } = require('./linkedin-analyzer');
const { addMessage, getHistory } = require('./conversation-memory');

// ─── Master System Prompt ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are MAESTROMINDS AI — a brilliant, friendly, and highly knowledgeable AI assistant.

PERSONALITY:
- Warm, professional, and conversational — like talking to a very smart colleague
- Give clear, detailed, helpful answers to ANY question asked
- Never refuse to answer general knowledge questions
- For company-specific questions, use ONLY the verified context provided — never invent facts
- Use natural language — not robotic or stiff

CAPABILITIES:
- Answer any general knowledge question (science, tech, history, math, coding, business, etc.)
- Explain complex topics in simple terms
- Help with calculations, writing, analysis, planning
- Answer questions about MAESTROMINDS using ONLY the verified context provided
- Give practical, actionable advice
- Remember conversation history to answer follow-up questions

COMPANY KNOWLEDGE RULES (CRITICAL):
- For MAESTROMINDS questions: ONLY use what is explicitly in the CONTEXT below
- NEVER invent, assume, or hallucinate company details not in the context
- NEVER repeat the same fact twice in one response
- If the answer is not in context: say "I don't have that detail, but you can contact us at info@maestrominds.com"

GENERAL RULES:
- NEVER say you cannot answer general questions. Always try your best.
- NEVER show technical errors or system messages to the user
- For general (non-company) questions, answer freely using your broad knowledge
- Keep responses focused and helpful. Use bullet points or numbered lists when it helps clarity.
- NEVER give identical answers in the same conversation. Vary your phrasing.`;

// ─── Layer 3: Intelligent Local Fallback ─────────────────────────────────────
function localIntelligentResponse(query, companyContext, intent = { intent: 'general', isCompany: false }) {
    const q = query.toLowerCase().trim();

    if (/^(hi+|hello|hey|good\s*(morning|afternoon|evening|day)|howdy|greetings|hiya)/i.test(q)) {
        return "Hello! 👋 I'm MAESTROMINDS AI Assistant. How can I help you today?";
    }
    if (/how are you|how('?re| are) you doing|you ok/i.test(q)) {
        return "I'm doing great, thank you for asking! 😊 Always ready to help. What can I assist you with?";
    }
    if (/thank(s| you)|thx|ty\b|appreciate|great job|well done/i.test(q)) {
        return "You're very welcome! 😊 Is there anything else I can help you with?";
    }
    if (/bye|goodbye|see you|take care|later\b|cya|good night/i.test(q)) {
        return "Goodbye! It was great chatting with you. Feel free to return anytime. Have a wonderful day! 👋";
    }
    if (/what can you do|your capabilities|who are you|what are you/i.test(q)) {
        return `I'm **MAESTROMINDS AI Assistant** — here's what I can help you with:\n\n**About MAESTROMINDS:**\n• Services, contact, hiring, and company overview\n• IT consulting, cloud, cybersecurity, digital transformation\n\n**About Student Union Startup:**\n• Platform features, how to join, opportunities for students\n\n**General Knowledge:**\n• Science, technology, history, math, coding, business\n• Any question you have — I'll do my best to answer!\n\nJust ask! 🚀`;
    }

    if (intent.intent === 'platform' || q.includes('student union') || q.includes('startup platform')) {
        return `The **Student Union Startup** platform is a unified digital ecosystem designed to connect students, alumni, startups, universities, faculty, and mentors.\n\n• **Students** can discover communities, work on startup ideas, and find internships.\n• **Alumni & Mentors** share career experiences and guide the next generation.\n• **Startups & Universities** connect to recruit talent and promote student-driven innovation.\n\nThe platform bridges the gap between academic learning and real-world industry exposure.`;
    }

    // Time/Date
    if (/what (time|date|day) is it|what's the (time|date)/i.test(q)) {
        const now = new Date();
        return `The current date and time is: **${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}** at **${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}**. 🕐`;
    }

    if (/tell me a joke|make me laugh|something funny/i.test(q)) {
        const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
            "Why was the JavaScript developer sad? Because he didn't know how to null his feelings. 😄",
            "Why did the computer go to the doctor? Because it had a virus! 💻",
            "I told an AI to make me a sandwich. It said 'Make your own, I'm a language model.' 🥪"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // Math
    const mathExpr = q.match(/([0-9.]+)\s*([+\-*x×÷/])\s*([0-9.]+)/);
    if (mathExpr) {
        try {
            const a = parseFloat(mathExpr[1]);
            const b = parseFloat(mathExpr[3]);
            const op = mathExpr[2];
            const ops = { '+': a + b, '-': a - b, '*': a * b, 'x': a * b, '×': a * b, '/': a / b, '÷': a / b };
            const result = ops[op];
            if (!isNaN(result)) return `The answer is **${result}**. 🔢`;
        } catch (e) { /* fallthrough */ }
    }

    if (companyContext && companyContext.length > 50) {
        const clean = companyContext.substring(0, 600).replace(/={3,}/g, '').trim();
        return `Here's what I know that might help:\n\n${clean}\n\nIs there anything specific you'd like to explore further? 😊`;
    }

    return `That's a great question! I'd love to help. Could you give me a bit more detail about what you're looking for?\n\nI can assist with:\n• **Company info** — MAESTROMINDS services, contact, hiring\n• **Student Union Startup** — platform features, how to join\n• **Technology topics** — AI, cloud, cybersecurity, coding\n• **General knowledge** — Science, math, history, and more\n\nWhat would you like to know? 😊`;
}

// ─── Intent Detection Engine ─────────────────────────────────────────────────
function detectIntent(query, history = []) {
    const q = query.toLowerCase();
    const prevContext = history.slice(-6).map(m => m.content || '').join(' ').toLowerCase();

    const platformSignals = [
        'student union', 'student startup', 'this platform', 'this website', 'this app',
        'student ecosystem', 'alumni', 'mentor', 'mentoring', 'internship', 'hackathon',
        'entrepreneurship', 'innovation platform', 'student opportunity', 'student community',
        'university talent', 'student project', 'startup idea', 'connect students',
        'platform purpose', 'what does this platform', 'how do i join', 'how to join'
    ];
    if (platformSignals.some(kw => q.includes(kw) || prevContext.includes(kw)))
        return { intent: 'platform', isCompany: false, label: 'Student Union Startup Platform Query' };

    if (/service|offer|provide|solution|speciali[sz]|product|capability|help with/i.test(q))
        return { intent: 'company_services', isCompany: true, label: 'Company Services Query' };

    if (/career|job|hiring|recruit|vacancy|opening|intern|position|work at|join|apply/i.test(q))
        return { intent: 'careers', isCompany: true, label: 'Careers & Hiring Query' };

    if (/contact|email|phone|reach|location|address|office|visit|where are you/i.test(q))
        return { intent: 'contact_location', isCompany: true, label: 'Contact & Location Query' };

    if (/linkedin|company profile|who is maestro|about maestro|tell me about|overview|background|industry/i.test(q))
        return { intent: 'company_info', isCompany: true, label: 'Company Information Query' };

    if (/maestrominds|your company|the company|they offer|their services|their mission/i.test(q) || prevContext.includes('maestrominds'))
        return { intent: 'company_info', isCompany: true, label: 'Company Information Query' };

    if (/ai|machine learning|cloud|blockchain|cybersecurity|technology|software|digital|data|code/i.test(q))
        return { intent: 'tech_general', isCompany: false, label: 'General Technology Query' };

    return { intent: 'general', isCompany: false, label: 'General Knowledge Query' };
}

// ─── Intent-Aware Dynamic Prompt Builder ────────────────────────────────────
function buildIntentPrompt(intent, query, history, companyContext, linkedInContext) {
    const prevQuestions = history
        .filter(m => m.role === 'user')
        .slice(-4)
        .map(m => `• ${m.content}`)
        .join('\n');

    let intentInstruction = '';

    switch (intent.intent) {
        case 'platform':
            intentInstruction = `The user is asking about the STUDENT UNION STARTUP PLATFORM.
Respond as the platform's AI assistant. Explain what the platform is, who it's for, and what users can do on it.
Be natural, engaging, and professional. Highlight: students, alumni, mentors, startups, universities, innovation, collaboration.`;
            break;
        case 'company_services':
            intentInstruction = `The user is asking about MAESTROMINDS SERVICES.
Respond with a structured, informative list of what Maestrominds offers. Use the verified context below. Be specific and professional.`;
            break;
        case 'careers':
            intentInstruction = `The user is asking about CAREERS at Maestrominds.
Explain hiring information using the verified context. If specific openings aren't listed, direct them to: https://www.linkedin.com/company/maestrominds/ or careers@maestrominds.com`;
            break;
        case 'contact_location':
            intentInstruction = `The user wants CONTACT or LOCATION information for Maestrominds.
Provide exact, verified contact details from the context. Be direct and clear.`;
            break;
        case 'company_info':
            intentInstruction = `The user wants to KNOW ABOUT MAESTROMINDS as a company.
Give a professional, engaging company overview: who they are, what they do, their mission, and industry.
Make it feel like a natural, confident company introduction — not a list dump.`;
            break;
        case 'tech_general':
            intentInstruction = `The user is asking a GENERAL TECHNOLOGY question.
Answer expertly using your broad knowledge. Where truly relevant, you may naturally mention Maestrominds specializes in related areas.`;
            break;
        default:
            intentInstruction = `The user is asking a GENERAL KNOWLEDGE question. Answer helpfully, accurately, and naturally.`;
    }

    let prompt = `DETECTED INTENT: ${intent.label}\n\n${intentInstruction}`;

    if (prevQuestions) {
        prompt += `\n\nCONVERSATION MEMORY (previous questions — use for follow-up awareness):\n${prevQuestions}\nDo not repeat what you already said. Build on the conversation.`;
    }

    if (linkedInContext && (intent.isCompany || intent.intent === 'platform')) {
        prompt += `\n\nVERIFIED KNOWLEDGE (use ONLY this for company facts):\n${linkedInContext}`;
    } else if (companyContext && (intent.isCompany || intent.intent === 'platform')) {
        prompt += `\n\nVERIFIED KNOWLEDGE:\n${companyContext}`;
    }

    return prompt;
}

// ─── Layer 2: Anthropic Claude Fallback ──────────────────────────────────────
async function callClaude(messages, systemContext, apiKey) {
    if (!apiKey || !apiKey.startsWith('sk-ant-') || apiKey.includes('dummy')) {
        throw new Error('Claude key not configured');
    }

    const fullSystem = SYSTEM_PROMPT + (systemContext ? '\n\n' + systemContext : '');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1200,
            system: fullSystem,
            messages
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude ${response.status}: ${err.substring(0, 100)}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Claude returned empty response');
    return text;
}

// ─── Main Export: getAIResponse ───────────────────────────────────────────────
/**
 * 3-layer intelligent response system with session memory:
 *   0. Session memory + intent detection + context building
 *   1. Gemini 2.0 Flash (primary — upgraded)
 *   2. Claude Sonnet (fallback)
 *   3. Smart local AI (always works, zero errors)
 *
 * @param {Array} messages - [{role, content}]
 * @param {string} apiKey - Claude API key (fallback)
 * @param {string} [sessionId] - Session ID for conversation memory
 */
async function getAIResponse(messages, apiKey, sessionId = 'default') {
    if (!messages || messages.length === 0) {
        return "Hello! How can I help you today? 😊";
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const query = lastUserMsg ? lastUserMsg.content : '';

    // ── Step 0: Build full history from session memory + current messages ──────
    const sessionHistory = getHistory(sessionId);
    const fullHistory = [...sessionHistory, ...messages].slice(-20); // Keep last 20 msgs

    // ── Step 1: Detect intent and build context ────────────────────────────────
    const intent = detectIntent(query, fullHistory);
    console.log(`[ai] Intent: ${intent.label} | Session: ${sessionId}`);

    // ── Step 2: Gather knowledge context ──────────────────────────────────────
    let rawContext = '';
    let linkedInCtx = '';
    try {
        const [ragResults, kbContext] = await Promise.allSettled([
            search(query, 3),
            Promise.resolve(getRelevantKnowledge(query, fullHistory))
        ]);
        if (ragResults.status === 'fulfilled' && ragResults.value.length > 0) {
            rawContext += ragResults.value.join('\n---\n');
        }
        if (kbContext.status === 'fulfilled' && kbContext.value) {
            rawContext += '\n' + kbContext.value;
        }
        // Inject LinkedIn-enriched context for company/platform queries
        if (intent.isCompany || intent.intent === 'platform') {
            linkedInCtx = getRelevantLinkedInContext(query);
        }
    } catch (e) {
        console.warn('[ai] Context enrichment failed:', e.message);
    }

    const systemContext = buildIntentPrompt(intent, query, fullHistory, rawContext, linkedInCtx);

    // ── Layer 1: Gemini 2.0 Flash (Upgraded Primary) ──────────────────────────
    try {
        const geminiReply = await getGeminiResponse(fullHistory.concat([{ role: 'user', content: query }].filter(m => {
            // Avoid duplicating the last message if already in fullHistory
            const lastInHistory = fullHistory[fullHistory.length - 1];
            if (lastInHistory && lastInHistory.role === 'user' && lastInHistory.content === query) return false;
            return true;
        })), systemContext);

        if (geminiReply && geminiReply.trim().length > 0) {
            console.log('[ai] ✅ Layer 1 (Gemini) responded');
            // Save to session memory
            addMessage(sessionId, 'user', query);
            addMessage(sessionId, 'assistant', geminiReply);
            return geminiReply;
        }
    } catch (e) {
        console.warn('[ai] Layer 1 unavailable:', e.message);
    }

    // ── Layer 2: Claude Fallback ───────────────────────────────────────────────
    try {
        const claudeReply = await callClaude(fullHistory, systemContext, apiKey);
        if (claudeReply && claudeReply.trim().length > 0) {
            console.log('[ai] ✅ Layer 2 (Claude) responded');
            addMessage(sessionId, 'user', query);
            addMessage(sessionId, 'assistant', claudeReply);
            return claudeReply;
        }
    } catch (e) {
        console.warn('[ai] Layer 2 unavailable:', e.message);
    }

    // ── Layer 3: Smart Local Fallback (always works) ──────────────────────────
    console.log('[ai] Using Layer 3 local response');
    const localReply = localIntelligentResponse(query, rawContext || linkedInCtx, intent);
    addMessage(sessionId, 'user', query);
    addMessage(sessionId, 'assistant', localReply);
    return localReply;
}

module.exports = { getAIResponse, SYSTEM_PROMPT };
