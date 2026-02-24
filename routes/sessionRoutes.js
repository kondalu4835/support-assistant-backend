const express = require("express");
const router = express.Router();
const { listSessions } = require("../controllers/conversationController");

// GET /api/sessions
router.get("/", listSessions);

module.exports = router;
