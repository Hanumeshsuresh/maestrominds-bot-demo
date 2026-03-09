/**
 * ═══════════════════════════════════════════════════
 * MODULE: conversation-memory.js
 * PURPOSE: Server-side per-session conversation memory
 * ═══════════════════════════════════════════════════
 *
 * Maintains conversation history per user session so the
 * AI can answer follow-up questions intelligently.
 *
 * Each session stores:
 *   - messages: [{role, content}]     — full conversation log
 *   - lastActive: Date                — for auto-expiry
 *
 * Sessions auto-expire after SESSION_TTL_MS of inactivity.
 */

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_HISTORY_MESSAGES = 30; // Prevent unbounded memory growth
const MAX_SESSIONS = 500; // Max concurrent sessions

// In-memory session store: Map<sessionId, { messages, lastActive }>
const sessions = new Map();

// ─── Cleanup ────────────────────────────────────────────────────────────────
/**
 * Removes sessions that have been inactive beyond TTL.
 * Called periodically and before adding new sessions.
 */
function cleanExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActive > SESSION_TTL_MS) {
            sessions.delete(id);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanExpiredSessions, 30 * 60 * 1000);

// ─── Session Management ──────────────────────────────────────────────────────

/**
 * Creates or retrieves a session.
 * @param {string} sessionId - Unique identifier for this user's conversation
 */
function ensureSession(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
        sessionId = 'default';
    }
    if (!sessions.has(sessionId)) {
        // Prune if at capacity
        if (sessions.size >= MAX_SESSIONS) {
            cleanExpiredSessions();
            // If still at max, remove oldest
            if (sessions.size >= MAX_SESSIONS) {
                const oldest = sessions.keys().next().value;
                sessions.delete(oldest);
            }
        }
        sessions.set(sessionId, {
            messages: [],
            lastActive: Date.now()
        });
    }
    return sessions.get(sessionId);
}

/**
 * Appends a message to a session's history.
 * @param {string} sessionId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
function addMessage(sessionId, role, content) {
    const session = ensureSession(sessionId);
    session.messages.push({ role, content });
    session.lastActive = Date.now();

    // Trim history to prevent unbounded growth
    // Always keep the first 2 messages (initial context) + last N messages
    if (session.messages.length > MAX_HISTORY_MESSAGES) {
        const anchor = session.messages.slice(0, 2);
        const tail = session.messages.slice(-(MAX_HISTORY_MESSAGES - 2));
        session.messages = [...anchor, ...tail];
    }
}

/**
 * Returns the full conversation history for a session.
 * @param {string} sessionId
 * @returns {{ role: string, content: string }[]}
 */
function getHistory(sessionId) {
    if (!sessionId || !sessions.has(sessionId)) return [];
    const session = sessions.get(sessionId);
    session.lastActive = Date.now();
    return session.messages;
}

/**
 * Clears a session's conversation history.
 * @param {string} sessionId
 */
function clearSession(sessionId) {
    if (sessions.has(sessionId)) {
        sessions.delete(sessionId);
        console.log(`[memory] Session cleared: ${sessionId}`);
    }
}

/**
 * Returns stats about the memory store (for health/debug).
 */
function getStats() {
    return {
        activeSessions: sessions.size,
        sessionIds: [...sessions.keys()].map(id => id.substring(0, 8) + '...')
    };
}

module.exports = { addMessage, getHistory, clearSession, ensureSession, getStats };
