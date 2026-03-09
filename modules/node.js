// server.js
const express = require("express");
const app = express();
const port = 3000;

// Serve your bot frontend (UI/UX unchanged)
app.use(express.static("public"));

// Example endpoint for bot responses
app.post("/chat", express.json(), async (req, res) => {
    const userMessage = req.body.message;

    // Call your AI model with the MAESTROMINDS system prompt
    const response = await aiModel.generate({
        systemPrompt: "You are MAESTROMINDS AI Assistant, ...", // full prompt above
        userMessage: userMessage
    });

    res.json({ reply: response });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Bot running on http://localhost:${port}`);
});
