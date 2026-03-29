/**
 * ═══════════════════════════════════════════════════
 * OFFICE ASSISTANT — BACKEND SERVER
 * File: server.js
 * ═══════════════════════════════════════════════════
 *
 * Express server providing:
 *   POST /api/save-visitor  — Save visitor to Excel
 *   POST /api/chat          — Enhanced AI chat (knowledge-based)
 *   GET  /api/visitors      — List all visitors (admin)
 *   GET  /                  — Serve office-assistant.html
 *
 * INTEGRATION: The HTML file connects here via fetch() calls
 * added in the appended integration script block.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { saveVisitor, getAllVisitors } = require('./modules/excel-handler');
const { getAIResponse } = require('./modules/smart-responder');
const { extractCompanyKnowledge } = require('./modules/scraper');
const { initModel, indexChunks, getStatus } = require('./modules/vector-db');
const { clearSession, getStats } = require('./modules/conversation-memory');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────

// Enable CORS for all origins — required for ngrok public URL to work on any device
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' }));

// Serve static files from root and /public folder
app.use(express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ─── Routes ──────────────────────────────────────────────

/**
 * GET /
 * Serve the main Office Assistant page.
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'office-assistant.html'));
});

/**
 * GET /bot
 * Serve the Maestrominds-branded embed bot (iframe-ready standalone UI).
 */
app.get('/bot', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'maestro-bot.html'));
});

/**
 * POST /api/save-visitor
 * Receives visitor registration data and saves it to Excel.
 *
 * Body: { name, email, phone, query, department }
 * Response: { success, message, rowNumber }
 */
app.post('/api/save-visitor', async (req, res) => {
    try {
        const { name, email, phone, query, department } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, error: 'Invalid email format' });
        }

        // Save to Excel
        const result = saveVisitor({ name, email, phone, query, department });

        console.log(`[server] Visitor saved: ${name} — row ${result.rowNumber}`);
        return res.status(200).json(result);

    } catch (err) {
        console.error('[server] /api/save-visitor error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to save visitor data',
            detail: err.message
        });
    }
});

/**
 * POST /api/chat
 * Receives conversation messages, enriches with knowledge base,
 * and proxies to Anthropic Claude API using the provided key.
 *
 * Body: { massage: "text", history: [{role, content}] } or { messages: [{role, content}] }
 * Response: { success, reply }
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, messages, sessionId } = req.body;

        // Resolve session ID (frontend can pass one, or we generate from IP)
        const resolvedSessionId = sessionId ||
            (req.headers['x-session-id']) ||
            (req.ip + '_' + (req.headers['user-agent'] || '').substring(0, 20)) ||
            'default';

        // Handle both message formats
        let finalMessages = [];
        if (messages && messages.length > 0) {
            finalMessages = messages;
        } else if (message) {
            finalMessages = [...(history || [])];
            finalMessages.push({ role: 'user', content: message });
        } else {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // Validate message format
        for (const msg of finalMessages) {
            if (!msg.role || !msg.content) {
                return res.status(400).json({ success: false, error: 'Each message must have role and content' });
            }
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        const reply = await getAIResponse(finalMessages, apiKey, resolvedSessionId);

        return res.status(200).json({ success: true, reply, sessionId: resolvedSessionId });

    } catch (err) {
        console.error('[server] /api/chat error:', err.message);
        return res.status(500).json({
            success: false,
            reply: "I'm having a little trouble connecting right now. Could you please try again in a moment? 😊"
        });
    }
});

/**
 * POST /api/session/clear
 * Clears the conversation memory for a specific session.
 * Body: { sessionId: string }
 */
app.post('/api/session/clear', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) {
        clearSession(sessionId);
        return res.json({ success: true, message: 'Session cleared' });
    }
    return res.status(400).json({ success: false, error: 'sessionId required' });
});

/**
 * POST /chat
 * Alias for /api/chat to support simplified frontend requests
 * like { message: "Hello" } instead of { messages: [{role, content}] }
 */
app.post('/chat', async (req, res) => {
    // If it's the simplified format { message: "text" }, adapt it to our message array format
    if (req.body.message && !req.body.messages) {
        req.body.messages = [{ role: 'user', content: req.body.message }];
    }
    // Route it through the main handler
    req.url = '/api/chat';
    app._router.handle(req, res, () => { });
});

/**
 * GET /api/visitors
 * Returns all saved visitors/leads from the Excel file (for admin/reporting use).
 */
app.get('/api/visitors', (req, res) => {
    try {
        const visitors = getAllVisitors();
        return res.status(200).json({
            success: true,
            count: visitors.length,
            visitors
        });
    } catch (err) {
        console.error('[server] /api/visitors error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /get_company_data
 * Returns the status and preview of the company knowledge base.
 */
app.get('/get_company_data', (req, res) => {
    res.json(getStatus());
});

/**
 * POST /store_user_data
 * Alias for saving visitor/lead data to Excel.
 */
app.post('/store_user_data', async (req, res) => {
    try {
        const result = saveVisitor(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/health
 * Simple health check endpoint.
 */
app.get('/api/health', (req, res) => {
    const anthropicConfigured = !!(process.env.ANTHROPIC_API_KEY &&
        process.env.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_API_KEY');
    const geminiConfigured = !!(process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' &&
        process.env.GEMINI_API_KEY.length > 10);
    const memoryStats = getStats();

    res.json({
        status: 'online',
        aiEngine: geminiConfigured ? 'Gemini 2.0 Flash (primary)' : 'Claude (fallback)',
        geminiConfigured,
        anthropicConfigured,
        conversationSessions: memoryStats.activeSessions,
        timestamp: new Date().toISOString()
    });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log(`║  Bot running on http://localhost:${PORT}     ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('\nEndpoints:');
    console.log(`  POST http://localhost:${PORT}/api/save-visitor`);
    console.log(`  POST http://localhost:${PORT}/api/chat`);
    console.log(`  GET  http://localhost:${PORT}/api/visitors`);
    console.log(`  GET  http://localhost:${PORT}/api/health`);
    console.log(`\n🤖 Embed Bot UI → http://localhost:${PORT}/bot`);
    console.log('\n⚡ Open http://localhost:3000 in your browser\n');
});

/**
 * Initialize the AI Knowledge Base (RAG)
 */
async function initRAG() {
    try {
        console.log('[server] Initializing AI Knowledge Base...');
        await initModel();
        const chunks = await extractCompanyKnowledge();
        if (chunks.length > 0) {
            await indexChunks(chunks);
            console.log('[server] RAG initialization complete. Chatbot is now company-aware.');
        } else {
            console.warn('[server] RAG initialized but no knowledge was extracted.');
        }
    } catch (err) {
        console.error('[server] RAG Initialization failed:', err.message);
    }
}

initRAG();

module.exports = app;
