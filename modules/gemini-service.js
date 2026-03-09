const { GoogleGenAI } = require("@google/genai");

// Initialize the Gemini AI client using the key from .env
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/**
 * Sends a message to Gemini along with conversation history and context
 * @param {string} userMessage The current message from the user
 * @param {Array} chatHistory Array of {role, content} from previous turns
 */
async function askGeminiAI(userMessage, chatHistory) {
    // 1. Prepare the static context based on the user's requirements
    const contextInstruction = `
You are a professional, friendly, and helpful AI assistant for the Student Union Startup platform.
Your persona is a Startup Assistant. Be clear and helpful.

Context:
The Student Union Startup platform connects students, innovators and startups to collaborate, build projects and explore opportunities.
Website: https://share.google/xjjW57ajxFn7lnEhV

Rules:
- Answer questions about the company and platform.
- Guide users about the startup ecosystem.
- Help visitors understand the website and services.
- Provide accurate information when asked about the platform.
- If a question relates to the website, prioritize website context before answering.
- Keep the conversation natural and human-like.
`;

    // 2. Format the history for the Gemini SDK
    // The SDK expects parts: [{ text: "..." }]
    const formattedHistory = [
        { role: "user", parts: [{ text: contextInstruction }] },
        { role: "model", parts: [{ text: "Understood. I am ready to help visitors as the Student Union Startup Assistant." }] }
    ];

    // Append previous multi-turn conversation memory from the frontend
    if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
            // Ensure UI roles map to Gemini roles (user -> user, bot/assistant/model -> model)
            const role = msg.role === 'user' ? 'user' : 'model';
            // Only add messages that actually have content
            if (msg.content && typeof msg.content === 'string') {
                 formattedHistory.push({ role, parts: [{ text: msg.content }] });
            }
        }
    }

    try {
        // 3. Call the Gemini 3.1 High model
        const response = await ai.models.generateContent({
            model: "gemini-3.1-high",
            contents: [
                ...formattedHistory,
                { role: "user", parts: [{ text: userMessage }] }
            ]
        });

        // The @google/genai SDK returns text directly on the response object
        return response.text;
    } catch (error) {
        console.error("[gemini-service] Gemini API Error:", error.message || error);
        throw error;
    }
}

module.exports = { askGeminiAI };
