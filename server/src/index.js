import "dotenv/config";
import express from "express";
import cors from "cors";

import resumeRoutes from "./routes/resume.js";
import jobsRoutes from "./routes/jobs.js";
import trackerRoutes from "./routes/tracker.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    rapidApiConfigured: !!process.env.RAPIDAPI_KEY,
  });
});

app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/tracker", trackerRoutes);

// Fallback error handler for anything that throws synchronously / unexpectedly.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`JobMatch AI server listening on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️  OPENAI_API_KEY is not set — resume parsing, matching, and tailoring will fail.");
  }
  if (!process.env.RAPIDAPI_KEY) {
    console.warn("⚠️  RAPIDAPI_KEY is not set — live job fetching will fail (manual add still works).");
  }
});
