const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/support.db");


let db = null;

async function initDb() {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const initSqlJs = require("sql.js");
  const SQL = await initSqlJs();

  // Load existing DB from file, or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createSchema();

  // Persist DB to disk on exit
  process.on("exit", persistDb);
  process.on("SIGINT", () => { persistDb(); process.exit(0); });
  process.on("SIGTERM", () => { persistDb(); process.exit(0); });

  console.log("✅ Database initialized successfully");
  return db;
}

function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error("Failed to persist DB:", err.message);
  }
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_msg_session ON messages(session_id)`);
}

function run(sql, params = []) {
  db.run(sql, params);
  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values?.[0]?.[0] ?? null;
  persistDb();
  return { lastInsertRowid: id };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const rows = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

module.exports = { initDb, run, get, all, persistDb };
