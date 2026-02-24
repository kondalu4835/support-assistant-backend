const { run, get, all } = require("../db/database");

function ensureSession(sessionId) {
  const existing = get("SELECT id FROM sessions WHERE id = ?", [sessionId]);

  if (!existing) {
    run(
      `INSERT INTO sessions (id, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`,
      [sessionId]
    );
  } else {
    run(`UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`, [sessionId]);
  }
}

function saveMessage(sessionId, role, content) {
  const result = run(
    `INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, datetime('now'))`,
    [sessionId, role, content]
  );
  run(`UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`, [sessionId]);
  return result.lastInsertRowid;
}

function getConversation(sessionId) {
  const session = get("SELECT * FROM sessions WHERE id = ?", [sessionId]);
  if (!session) return null;

  const messages = all(
    `SELECT id, session_id, role, content, created_at
     FROM messages WHERE session_id = ?
     ORDER BY created_at ASC, id ASC`,
    [sessionId]
  );

  return { session, messages };
}

function getRecentHistory(sessionId, pairCount = 5) {
  const messages = all(
    `SELECT role, content FROM messages
     WHERE session_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [sessionId, pairCount * 2]
  );
  return messages.reverse();
}

function getAllSessions() {
  return all(
    `SELECT
       s.id,
       s.created_at,
       s.updated_at,
       COUNT(m.id) as message_count,
       (SELECT content FROM messages WHERE session_id = s.id ORDER BY created_at DESC, id DESC LIMIT 1) as last_message
     FROM sessions s
     LEFT JOIN messages m ON m.session_id = s.id
     GROUP BY s.id
     ORDER BY s.updated_at DESC`
  );
}

function deleteSession(sessionId) {
  run("DELETE FROM messages WHERE session_id = ?", [sessionId]);
  run("DELETE FROM sessions WHERE id = ?", [sessionId]);
}

module.exports = {
  ensureSession,
  saveMessage,
  getConversation,
  getRecentHistory,
  getAllSessions,
  deleteSession,
};
