import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../api.js";
import Loader from "../components/Loader.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import JobCard from "../components/JobCard.jsx";
import SkillGapReport from "../components/SkillGapReport.jsx";
import TailorModal from "../components/TailorModal.jsx";

export default function ResumePage() {
  const { preferences, resumeText, setResumeText, parsedResume, setParsedResume, jobs, setJobs } =
    useApp();

  const [rawJobs, setRawJobs] = useState([]);
  const [manualUrl, setManualUrl] = useState("");

  const [parsing, setParsing] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [matching, setMatching] = useState(false);
  const [tailoringJobId, setTailoringJobId] = useState(null);

  const [error, setError] = useState("");
  const [tailorResult, setTailorResult] = useState(null); // { job, tailoredResume }

  async function handleParse(e) {
    e.preventDefault();
    if (!resumeText.trim()) return;
    setError("");
    setParsing(true);
    setParsedResume(null);
    setRawJobs([]);
    setJobs([]);
    try {
      const { parsedResume: parsed } = await api.parseResume(resumeText);
      setParsedResume(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }

  async function runMatching(list) {
    if (!list.length) {
      setJobs([]);
      return;
    }
    setMatching(true);
    setError("");
    try {
      const { matchedJobs } = await api.matchJobs({
        jobs: list,
        resumeText,
        parsedResume,
      });
      setJobs(matchedJobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setMatching(false);
    }
  }

  async function handleFetchJobs() {
    setError("");
    setFetchingJobs(true);
    try {
      const { jobs: fetched } = await api.searchJobs({ preferences, parsedResume });
      setRawJobs(fetched);
      await runMatching(fetched);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingJobs(false);
    }
  }

  async function handleAddManual(e) {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setError("");
    setAddingManual(true);
    try {
      const { job } = await api.addManualJob(manualUrl.trim());
      const nextRaw = [...rawJobs, job];
      setRawJobs(nextRaw);
      setManualUrl("");
      await runMatching(nextRaw);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingManual(false);
    }
  }

  async function handleTailor(job) {
    setError("");
    setTailoringJobId(job.id);
    try {
      const { tailoredResume } = await api.tailorResume({ resumeText, parsedResume, job });
      setTailorResult({ job, tailoredResume });
    } catch (err) {
      setError(err.message);
    } finally {
      setTailoringJobId(null);
    }
  }

  return (
    <div>
      <h1>Resume &amp; Results</h1>
      <p className="subtitle">
        Paste your resume, fetch live jobs matched to your preferences, and see how you stack up.
      </p>

      <ErrorBanner message={error} />

      <form className="card" onSubmit={handleParse}>
        <h2>1. Your Resume</h2>
        <div className="field full">
          <label htmlFor="resumeText">Paste resume text</label>
          <textarea
            id="resumeText"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste the full text of your resume here..."
          />
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button type="submit" disabled={parsing || !resumeText.trim()}>
            {parsing ? "Parsing…" : "Parse Resume"}
          </button>
          {parsing && <Loader label="Claude is reading your resume…" />}
        </div>
      </form>

      {parsedResume && (
        <div className="card">
          <h2>Parsed Profile</h2>
          <div className="form-grid">
            <div>
              <label>Experience Level</label>
              <p>{parsedResume.experience_level}</p>
            </div>
            <div>
              <label>Past Titles</label>
              <p>{parsedResume.past_job_titles?.join(", ") || "—"}</p>
            </div>
            <div className="field full">
              <label>Skills</label>
              <div className="missing-skills">
                {parsedResume.skills?.map((s) => (
                  <span key={s} className="badge">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Key Technologies</label>
              <div className="missing-skills">
                {parsedResume.key_technologies?.map((s) => (
                  <span key={s} className="badge">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {parsedResume && (
        <div className="card">
          <h2>2. Find Jobs</h2>
          <div className="row">
            <button onClick={handleFetchJobs} disabled={fetchingJobs}>
              {fetchingJobs ? "Fetching…" : "Fetch Live Jobs"}
            </button>
            {fetchingJobs && <Loader label="Searching JSearch for live openings matching your preferences…" />}
          </div>

          <h2 style={{ marginTop: 24 }}>Add a Job Manually</h2>
          <form className="row" onSubmit={handleAddManual}>
            <input
              type="url"
              placeholder="https://company.com/careers/job-posting"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="submit" disabled={addingManual}>
              {addingManual ? "Adding…" : "Add Job"}
            </button>
          </form>
          {addingManual && <Loader label="Fetching page and extracting job details…" />}
        </div>
      )}

      {matching && <Loader label="Scoring every job against your resume…" />}

      {jobs.length > 0 && (
        <>
          <SkillGapReport jobs={jobs} />

          <h2>3. Ranked Matches</h2>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onTailor={handleTailor}
              tailoring={tailoringJobId === job.id}
            />
          ))}
        </>
      )}

      {parsedResume && jobs.length === 0 && !fetchingJobs && !matching && (
        <div className="empty-state">
          No jobs yet. Fetch live jobs or add one manually to see your match scores.
        </div>
      )}

      <TailorModal
        job={tailorResult?.job}
        tailoredResume={tailorResult?.tailoredResume}
        onClose={() => setTailorResult(null)}
      />
    </div>
  );
}
