import { Router } from "express";
import { Type } from "@google/genai";
import { askForJson, askForText } from "../services/gemini.js";
import { streamResumePdf } from "../services/pdf.js";
import { addRecord } from "../services/trackerStore.js";

const router = Router();

const RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concrete skills, tools, and competencies mentioned or implied.",
    },
    experience_level: {
      type: Type.STRING,
      enum: ["Entry", "Mid", "Senior", "Lead", "Executive"],
    },
    past_job_titles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    key_technologies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Programming languages, frameworks, platforms, and tools.",
    },
  },
  required: ["skills", "experience_level", "past_job_titles", "key_technologies"],
};

// POST /api/resume/parse  { resumeText }
router.post("/parse", async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: "resumeText is required." });
    }

    const parsed = await askForJson({
      system:
        "You are a precise resume parser. Extract structured information from the resume text. Only include information actually present or clearly implied in the resume — do not invent skills or titles.",
      prompt: `Parse the following resume into structured data.\n\n<resume>\n${resumeText}\n</resume>`,
      schema: RESUME_SCHEMA,
    });

    res.json({ parsedResume: parsed });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/resume/tailor  { resumeText, parsedResume, job }
router.post("/tailor", async (req, res) => {
  try {
    const { resumeText, parsedResume, job } = req.body;
    if (!resumeText || !job) {
      return res.status(400).json({ error: "resumeText and job are required." });
    }

    const tailored = await askForText({
      system:
        "You are an expert resume writer. Rewrite the given resume's bullet points and summary to emphasize the experience, skills, and achievements most relevant to the target job. Keep it truthful — never invent experience the candidate doesn't have. Preserve the resume's overall structure (sections, roughly the same length). Output plain text only, ready to save as a resume — no markdown formatting, no commentary before or after.",
      prompt: `Target job:\nTitle: ${job.title}\nCompany: ${job.company}\nDescription:\n${(job.description || "").slice(0, 6000)}\n\nCandidate's current resume:\n${resumeText}\n\nCandidate's parsed profile (for reference):\n${JSON.stringify(parsedResume || {}, null, 2)}\n\nRewrite the resume now, tailored to this job.`,
      maxOutputTokens: 4096,
    });

    // Every tailoring event is tracked automatically.
    const record = addRecord({ jobTitle: job.title, company: job.company });

    res.json({ tailoredResume: tailored, trackerRecord: record });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/resume/tailor/pdf  { tailoredResume, job }
router.post("/tailor/pdf", async (req, res) => {
  try {
    const { tailoredResume, job } = req.body;
    if (!tailoredResume) {
      return res.status(400).json({ error: "tailoredResume is required." });
    }
    const title = job?.title ? `Resume - ${job.title}` : "Tailored Resume";
    streamResumePdf(res, { text: tailoredResume, title });
  } catch (err) {
    handleError(res, err);
  }
});

function handleError(res, err) {
  console.error(err);
  if (err.code === "MISSING_API_KEY") {
    return res.status(503).json({ error: err.message });
  }
  if (err.code === "AUTH_ERROR") {
    return res.status(401).json({ error: `Gemini rejected the API key: ${err.message}` });
  }
  if (err.code === "REFUSAL") {
    return res.status(422).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Something went wrong." });
}

export default router;
