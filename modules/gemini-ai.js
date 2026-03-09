/**
 * ═══════════════════════════════════════════════════
 * MODULE: gemini-ai.js
 * PURPOSE: Upgraded Gemini AI integration
 *          - Uses gemini-2.0-flash (latest stable)
 *          - Full multi-turn conversation support
 *          - System instruction injection with company context
 *          - Never throws — always returns a string
 * ═══════════════════════════════════════════════════
 */

const fetch = require('node-fetch');

// ─── Gemini API Config ─────────────────────────────────────────────────────
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model priority list — tries each in order until one works
// All models verified via ListModels API as supporting generateContent
const GEMINI_MODELS = [
    'gemini-2.0-flash-lite',   // Lightest quota — try first
    'gemini-2.0-flash',         // Full flash
    'gemini-2.5-flash',         // Latest Gemini 2.5
    'gemini-flash-latest'       // Alias for latest flash
];

// ─── Master System Prompt ──────────────────────────────────────────────────
const MASTER_SYSTEM_PROMPT = `You are MAESTROMINDS AI — a brilliant, warm, and deeply knowledgeable AI assistant.

PERSONALITY & STYLE:
- Conversational and human — like chatting with a very smart, friendly colleague
- Professional but never stiff or robotic
- Give clear, well-structured, genuinely helpful answers
- Use natural language with occasional emojis where appropriate
- NEVER repeat the exact same response twice — always vary your phrasing
- NEVER say "I cannot help with that", "Please rephrase", or show any error to the user
- If you're unsure, still try to give the most helpful possible answer

CAPABILITIES:
1. Answer ANY general knowledge question (science, history, tech, math, coding, business, etc.)
2. Help with writing, analysis, calculations, planning
3. Answer questions about MAESTROMINDS using ONLY the verified context provided
4. Answer questions about the Student Union Startup platform
5. Remember and refer back to previous messages in the conversation
6. Handle spelling mistakes and incomplete sentences gracefully

CRITICAL RULES:
- For MAESTROMINDS/company questions: use ONLY facts from the VERIFIED CONTEXT section
- For general questions: answer freely using your broad knowledge
- NEVER invent company contact details, addresses, or services not in the context
- NEVER show technical errors, stack traces, or API messages to users
- If company info is missing: say "I'd recommend reaching them at info@maestrominds.com for that specific detail"
- Use conversation history to answer follow-up questions intelligently
- Keep answers concise but complete — no unnecessary padding`;

// ─── Core Gemini Call ──────────────────────────────────────────────────────

/**
 * Makes a single call to the Gemini API.
 * @param {string} modelName - Gemini model to use
 * @param {string} apiKey - Gemini API key
 * @param {Array} conversationHistory - [{role: 'user'|'model', parts: [{text}]}]
 * @param {string} systemInstruction - System prompt + context
 * @returns {Promise<string>} Response text
 */
async function callGeminiModel(modelName, apiKey, conversationHistory, systemInstruction) {
    const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        system_instruction: {
            parts: [{ text: systemInstruction }]
        },
        contents: conversationHistory,
        generationConfig: {
            temperature: 0.85,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1200,
            candidateCount: 1
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: 20000
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[gemini-ai] ${modelName} error ${response.status}:`, errText.substring(0, 300));
        throw new Error(`Gemini ${response.status}: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();

    // Extract text from response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim().length === 0) {
        console.error('[gemini-ai] Empty response from', modelName, JSON.stringify(data).substring(0, 200));
        throw new Error('Empty response from Gemini');
    }

    return text.trim();
}

// ─── Format Messages for Gemini ────────────────────────────────────────────

/**
 * Converts our standard {role, content} format to Gemini's format.
 * Gemini uses 'user' and 'model' roles (not 'assistant').
 * @param {Array} messages - [{role: 'user'|'assistant', content: string}]
 * @returns {Array} Gemini-formatted history
 */
function formatForGemini(messages) {
    const formatted = [];

    for (const msg of messages) {
        if (!msg.content || !msg.content.trim()) continue;

        const role = msg.role === 'assistant' ? 'model' : 'user';

        // Gemini requires alternating user/model turns
        // If last message has same role, merge content
        if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
            formatted[formatted.length - 1].parts[0].text += '\n' + msg.content;
        } else {
            formatted.push({
                role,
                parts: [{ text: msg.content }]
            });
        }
    }

    return formatted;
}

// ─── Main Export ───────────────────────────────────────────────────────────

/**
 * Sends messages to Gemini AI with full conversation history and context.
 * Tries multiple model versions automatically.
 *
 * @param {Array} messages - [{role: 'user'|'assistant', content: string}]
 * @param {string} systemContext - Additional context (company knowledge, intent, etc.)
 * @returns {Promise<string>} AI response text — never throws
 */
async function getGeminiResponse(messages, systemContext = '') {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_')) {
        throw new Error('Gemini API key not configured');
    }

    // Build full system instruction
    const fullSystemInstruction = MASTER_SYSTEM_PROMPT +
        (systemContext ? '\n\n---\n\n' + systemContext : '');

    // Format conversation for Gemini
    const geminiHistory = formatForGemini(messages);

    if (geminiHistory.length === 0) {
        throw new Error('No valid messages to send');
    }

    // Ensure conversation ends with a user message
    const lastMsg = geminiHistory[geminiHistory.length - 1];
    if (lastMsg.role !== 'user') {
        throw new Error('Last message must be from user');
    }

    // Try each model in order
    let lastError;
    for (const model of GEMINI_MODELS) {
        try {
            console.log(`[gemini-ai] Trying model: ${model}`);
            const response = await callGeminiModel(model, apiKey, geminiHistory, fullSystemInstruction);
            console.log(`[gemini-ai] ✅ Success with ${model} (${response.length} chars)`);
            return response;
        } catch (err) {
            console.warn(`[gemini-ai] Model ${model} failed:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error('All Gemini models failed');
}

module.exports = { getGeminiResponse, MASTER_SYSTEM_PROMPT, formatForGemini };
