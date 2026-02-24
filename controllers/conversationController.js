const {
  getConversation,
  getAllSessions,
  deleteSession,
} = require("../services/sessionService");

function fetchConversation(req, res) {
  const { sessionId } = req.params;

  if (!sessionId || sessionId.trim() === "") {
    return res.status(400).json({ error: "sessionId param is required." });
  }

  try {
    const data = getConversation(sessionId);

    if (!data) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.json({
      sessionId: data.session.id,
      createdAt: data.session.created_at,
      updatedAt: data.session.updated_at,
      messages: data.messages,
    });
  } catch (error) {
    console.error("❌ Fetch conversation error:", error);
    return res.status(500).json({ error: "Database error while fetching conversation." });
  }
}

function listSessions(req, res) {
  try {
    const sessions = getAllSessions();
    return res.json({ sessions });
  } catch (error) {
    console.error("❌ List sessions error:", error);
    return res.status(500).json({ error: "Database error while fetching sessions." });
  }
}

function removeSession(req, res) {
  const { sessionId } = req.params;

  if (!sessionId || sessionId.trim() === "") {
    return res.status(400).json({ error: "sessionId param is required." });
  }

  try {
    deleteSession(sessionId);
    return res.json({ message: "Session deleted successfully." });
  } catch (error) {
    console.error("❌ Delete session error:", error);
    return res.status(500).json({ error: "Database error while deleting session." });
  }
}

module.exports = { fetchConversation, listSessions, removeSession };
