const { generateReply } = require("../services/llmService");
const {
  ensureSession,
  saveMessage,
  getRecentHistory,
} = require("../services/sessionService");

async function chat(req, res) {
  const { sessionId, message } = req.body;

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    return res.status(400).json({ error: "sessionId is required and must be a non-empty string." });
  }

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "message is required and must be a non-empty string." });
  }

  const trimmedMessage = message.trim();

  try {
    // Ensure session exists in DB
    ensureSession(sessionId);

    // Save user message
    saveMessage(sessionId, "user", trimmedMessage);

    // Fetch recent history (last 5 pairs) from DB
    const chatHistory = getRecentHistory(sessionId, 5);

    // Call LLM
    const { reply, tokensUsed } = await generateReply(trimmedMessage, chatHistory);

    // Save assistant reply
    saveMessage(sessionId, "assistant", reply);

    return res.json({ reply, tokensUsed });
  } catch (error) {
    console.error("❌ Chat error:", error);

    if (error.message?.includes("API key") || error.status === 401) {
      return res.status(502).json({ error: "LLM authentication failed. Check your API key." });
    }

    if (error.message?.includes("rate limit") || error.status === 429) {
      return res.status(429).json({ error: "LLM rate limit exceeded. Please try again later." });
    }

    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
}

module.exports = { chat };
