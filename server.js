require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const { chatLimiter, generalLimiter } = require("./middleware/rateLimiter");
const { initDb } = require("./db/database");
const { buildDocsEmbeddings } = require("./services/embeddingService");

const app = express();
// Enable trust proxy to fix express-rate-limit misconfiguration
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(generalLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/sessions", sessionRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred." });
});

async function startServer() {
  try {
    // Initialize SQLite DB (async with sql.js)
    await initDb();

    // Pre-build doc embeddings in background
    if (process.env.MISTRAL_API_KEY) {
      buildDocsEmbeddings().catch((err) =>
        console.warn("⚠️  Could not pre-build embeddings:", err.message)
      );
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
