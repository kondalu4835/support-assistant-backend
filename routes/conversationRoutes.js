const express = require("express");
const router = express.Router();
const {
  fetchConversation,
  listSessions,
  removeSession,
} = require("../controllers/conversationController");

// GET /api/sessions
router.get("/", listSessions);

// GET /api/conversations/:sessionId
router.get("/:sessionId", fetchConversation);

// DELETE /api/conversations/:sessionId
router.delete("/:sessionId", removeSession);

module.exports = router;
