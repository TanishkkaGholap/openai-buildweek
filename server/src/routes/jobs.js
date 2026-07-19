import { Router } from "express";
import { searchJobs } from "../services/jsearch.js";
import { fetchPageText } from "../services/scraper.js";
import { askForJson } from "../services/openai.js";

const router = Router();

const MANUAL_JOB_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    company: { type: "string" },
    description: {
      type: "string",
      description: "The full job description text, cleaned up and readable.",
    },
  },
  required: ["title", "company", "description"],
  additionalProperties: false,
};

const MATCH_SCHEMA = {
  type: "object",
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          job_id: { type: "string" },
          match_score: {
            type: "integer",
            description: "Semantic match percentage, 0-100.",
          },
          match_reason: {
            type: "string",
            description: "A 2-line explanation of the match score.",
          },
          missing_skills: {
            type: "array",
            items: { type: "string" },
            description: "Skills this specific job wants that the candidate's resume does not show.",
          },
        },
        required: ["job_id", "match_score", "match_reason", "missing_skills"],
        additionalProperties: false,
      },
    },
  },
  required: ["matches"],
  additionalProperties: false,
};

// POST /api/jobs/search  { preferences, parsedResume }
router.post("/search", async (req, res) => {
  try {
    const { preferences, parsedResume } = req.body;
    if (!preferences) {
      return res.status(400).json({ error: "preferences is required." });
    }
    const jobs = await searchJobs({ preferences, resume: parsedResume });
    res.json({ jobs });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/jobs/manual  { url }
router.post("/manual", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: "url is required." });
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "That doesn't look like a valid URL." });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only http/https URLs are supported." });
    }

    const pageText = await fetchPageText(url);

    const extracted = await askForJson({
      system:
        "You extract structured job posting details from raw scraped webpage text. If the text does not appear to contain a job posting, do your best to identify title/company/description anyway from whatever is present.",
      prompt: `Extract the job title, company name, and full job description from this scraped job posting page text:\n\n<page_text>\n${pageText}\n</page_text>`,
      schema: MANUAL_JOB_SCHEMA,
    });

    const job = {
      id: `manual-${Date.now()}`,
      source: "manual",
      title: extracted.title,
      company: extracted.company,
      location: "Not specified",
      remote: false,
      url,
      description: extracted.description,
      postedAt: null,
      salary: null,
    };

    res.json({ job });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/jobs/match  { jobs, resumeText, parsedResume }
router.post("/match", async (req, res) => {
  try {
    const { jobs, resumeText, parsedResume } = req.body;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: "jobs (non-empty array) is required." });
    }
    if (!parsedResume) {
      return res.status(400).json({ error: "parsedResume is required." });
    }

    const jobsForPrompt = jobs.map((j) => ({
      job_id: j.id,
      title: j.title,
      company: j.company,
      description: (j.description || "").slice(0, 3000),
    }));

    const result = await askForJson({
      system:
        "You are an expert technical recruiter. Score how well a candidate semantically matches each job posting — not just keyword overlap, but overall fit of experience, skills, and seniority. For each job return a match_score (0-100), a 2-line match_reason, and a list of missing_skills that job specifically asks for that the candidate's resume doesn't show.",
      prompt: `Candidate's parsed profile:\n${JSON.stringify(parsedResume, null, 2)}\n\nCandidate's resume text:\n${(resumeText || "").slice(0, 6000)}\n\nJobs to score:\n${JSON.stringify(jobsForPrompt, null, 2)}\n\nScore every job listed above. Return one entry per job_id.`,
      schema: MATCH_SCHEMA,
      maxOutputTokens: 8192,
    });

    const scoreById = new Map(result.matches.map((m) => [m.job_id, m]));
    const matchedJobs = jobs
      .map((j) => {
        const m = scoreById.get(j.id);
        return {
          ...j,
          matchScore: m?.match_score ?? 0,
          matchReason: m?.match_reason ?? "No score available.",
          missingSkills: m?.missing_skills ?? [],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ matchedJobs });
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
    return res.status(401).json({ error: `OpenAI rejected the API key: ${err.message}` });
  }
  if (err.code === "REFUSAL") {
    return res.status(422).json({ error: err.message });
  }
  if (err.code === "FETCH_FAILED" || err.code === "EMPTY_PAGE") {
    return res.status(422).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Something went wrong." });
}

export default router;
