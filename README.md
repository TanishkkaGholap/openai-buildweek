# JobMatch AI

An end-to-end job search assistant. Set your preferences, paste your resume, and get a ranked list of jobs — pulled from live listings and/or added manually by URL — scored against your resume with an AI-generated match reason and a list of skills you're missing for each one. Tailor your resume for any specific job in one click, download it as a PDF, and every tailoring event is logged to a built-in application tracker.

## Overview

JobMatch AI is a full-stack demo app built around one core loop:

```
Preferences → Resume → Live/Manual Jobs → AI Match Scoring → Skill Gap Report → Tailored Resume → Tracker
```

It's a real, working app — every AI call and job-search call hits a live API, there's no mock data. The backend is a small Express API; the frontend is a React (Vite) single-page app with a dark theme.

## Features

- **Preferences form** — role/title, location, remote/hybrid/onsite, optional salary range, and experience level. Saved to `localStorage` and used to filter every job search.
- **Resume parsing** — paste raw resume text and it's parsed into structured data: skills, experience level, past job titles, and key technologies.
- **Live job fetching** — pulls 10–15 current job openings from the JSearch API (RapidAPI), filtered by your preferences and parsed resume.
- **Add a job manually** — paste any job posting URL; the page is scraped and the title, company, and description are extracted automatically, then folded into the same list as the fetched jobs.
- **AI match scoring** — every job (fetched + manual) is scored against your resume semantically, not just by keyword overlap. Each job gets a match %, a 2-line reason for the score, and a list of skills that job wants that your resume doesn't show.
- **Skill gap report** — missing skills are aggregated across every job on screen into a single "skills that keep coming up" summary.
- **Ranked results** — jobs are displayed highest-match-first, each card showing title, company, match %, reason, and missing skills.
- **Resume tailoring** — one click rewrites your resume's bullet points to emphasize what a specific job is asking for. Shown on screen and downloadable as a PDF.
- **Application tracker** — every time you tailor a resume for a job, a record (title, company, date, status) is saved automatically with status `Tailored`. A separate Tracker tab lets you update status via dropdown: Applied / Interview / Rejected.
- **Loading states everywhere** — parsing, fetching, matching, and tailoring all show explicit progress indicators.
- **Error handling** — every API call fails gracefully with a clear on-screen message instead of crashing the app (missing API keys, bad URLs, unreachable pages, etc. all surface as readable errors).

## Tech Stack

**Backend** — Node.js + Express (ES modules)
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) — Gemini API client for resume parsing, job matching, and resume tailoring (structured JSON output via response schemas + plain text generation)
- `axios` — HTTP client for the JSearch API and job-page scraping
- `cheerio` — HTML parsing for manually-added job URLs
- `pdfkit` — generates the downloadable tailored resume PDF
- Local JSON file (`server/data/tracker.json`) as the application tracker store — no database needed

**Frontend** — React 18 + Vite
- `react-router-dom` — tab-based navigation between Preferences / Resume & Results / Tracker
- React Context + `localStorage` for preferences and shared app state
- Plain CSS, dark theme, no UI framework

**External APIs**
- **Gemini API** (Google AI Studio) — resume parsing, semantic job matching, resume tailoring
- **JSearch API** (RapidAPI) — live job listings

## Project Structure

```
openai-buildweek/
├── server/                    Express API
│   ├── src/
│   │   ├── index.js           app entry point, health check
│   │   ├── routes/
│   │   │   ├── resume.js      parse / tailor / tailor-to-pdf
│   │   │   ├── jobs.js        search (JSearch) / manual add / match scoring
│   │   │   └── tracker.js     list / update status
│   │   └── services/
│   │       ├── gemini.js      Gemini client wrapper (JSON + text generation)
│   │       ├── jsearch.js     JSearch API client
│   │       ├── scraper.js     fetches + cleans manually-added job pages
│   │       ├── pdf.js         streams the tailored resume as a PDF
│   │       └── trackerStore.js JSON-file persistence for the tracker
│   ├── data/tracker.json      tracker data (created automatically)
│   └── .env                   API keys (not committed)
└── client/                    React (Vite) frontend
    └── src/
        ├── pages/
        │   ├── PreferencesPage.jsx
        │   ├── ResumePage.jsx      resume input, job fetching/adding, matches, tailoring
        │   └── TrackerPage.jsx
        ├── components/
        │   ├── JobCard.jsx
        │   ├── SkillGapReport.jsx
        │   ├── TailorModal.jsx
        │   ├── Loader.jsx
        │   └── ErrorBanner.jsx
        ├── context/AppContext.jsx  preferences + resume + jobs state
        └── api.js                  thin fetch wrapper for the backend
```

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

(Installs root, `server/`, and `client/` dependencies in one go.)

### 2. Add your API keys

Copy `server/.env.example` to `server/.env` and fill in:

```
GEMINI_API_KEY=your-gemini-api-key
RAPIDAPI_KEY=your-rapidapi-key
PORT=3001
```

- **Gemini API key** — free at [Google AI Studio](https://aistudio.google.com/api-keys) (no credit card required for the free tier).
- **RapidAPI key** — subscribe to the free plan of [JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) on RapidAPI, then copy the `X-RapidAPI-Key` value.

### 3. Run it

```bash
npm run dev
```

This starts the backend on `http://localhost:3001` and the frontend on `http://localhost:5173` together. Open the frontend URL in your browser.

## How it flows

1. **Preferences** — fill in role, location, work type, and experience level. Required before you can move on.
2. **Resume & Results** — paste your resume and parse it, then either fetch live jobs, add jobs manually by URL, or both. Once you have jobs, they're automatically scored against your resume and shown ranked by match %, with a skill gap summary above the list.
3. **Tailor** — click "Tailor Resume" on any job card to get a rewritten resume emphasizing that job's requirements, viewable on screen and downloadable as a PDF. This also logs the job to your tracker.
4. **Tracker** — see every job you've tailored a resume for, and update its status as you apply / hear back.

## Built with Claude Code

This entire project — backend, frontend, and everything in between — was built with [Claude Code](https://claude.com/claude-code). A few specific ways it was useful:

- **Full-stack scaffolding from a single spec.** The whole app (Express API, service layer, React/Vite frontend, routing, dark-theme CSS) was built in the order requested — preferences → resume parsing → job fetching → matching → tailoring → tracker — without needing to hand-write boilerplate at each step.
- **Verifying instead of guessing.** When the AI provider was swapped from Anthropic to Gemini mid-project, Claude Code didn't rely on memorized SDK syntax — it pulled the real `@google/genai` source and example files straight from GitHub to confirm the exact client init, schema format, and response shape before writing any code, which avoided shipping broken calls.
- **Real debugging, not guesswork.** Two concrete bugs came up during testing and got root-caused rather than patched around:
  - A `node --watch` misconfiguration that silently restarted the backend every time the tracker JSON file was written (traced by reproducing it, not just fixing a symptom).
  - A wrong JSearch endpoint path — Claude Code isolated it by testing a known-good endpoint first to rule out an auth issue, then narrowed it down to the exact broken path once given the correct code snippet.
- **End-to-end verification with real API calls.** Every feature (resume parsing, live job search, semantic matching, tailoring, PDF download, tracker writes) was tested against the live Gemini and JSearch APIs before being handed off, not just checked for "does it compile."
- **Git/GitHub setup.** Initialized the repo, wrote the `.gitignore` (keeping `.env` and `node_modules` out), made the initial commit, and pushed to GitHub.

## Notes

- The tracker is a flat JSON file (`server/data/tracker.json`), which is enough for a single-user local demo — no database setup required.
- Gemini's free tier is rate-limited; hitting "Fetch Live Jobs" and "Tailor Resume" repeatedly in quick succession may briefly hit a 429 — just retry after a few seconds.
- `server/.env` is gitignored — never commit real API keys.
