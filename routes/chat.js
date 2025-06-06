// routes/chat.js
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// POST /api/chat
router.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI Error: " + error.message });
  }
});

// GET /api/health
router.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

module.exports = router;
