function scoreColor(score) {
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--yellow)";
  return "var(--red)";
}

export default function JobCard({ job, onTailor, tailoring }) {
  return (
    <div className="job-card">
      <div className="job-card-top">
        <div>
          <div className="job-title">{job.title}</div>
          <div className="job-company">{job.company}</div>
        </div>
        <div className="match-badge" style={{ background: scoreColor(job.matchScore) }}>
          {job.matchScore}%
        </div>
      </div>

      <div className="job-meta">
        {job.location && <span className="badge">{job.location}</span>}
        {job.remote && <span className="badge">Remote</span>}
        {job.salary && <span className="badge">{job.salary}</span>}
        <span className="badge">{job.source === "manual" ? "Manually added" : "Live listing"}</span>
      </div>

      {job.matchReason && <div className="job-reason">{job.matchReason}</div>}

      {job.missingSkills?.length > 0 && (
        <div className="missing-skills">
          {job.missingSkills.map((s) => (
            <span key={s} className="skill-chip">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="job-actions">
        <button onClick={() => onTailor(job)} disabled={tailoring}>
          {tailoring ? "Tailoring…" : "Tailor Resume"}
        </button>
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer">
            <button type="button" className="secondary">
              View Posting
            </button>
          </a>
        )}
      </div>
    </div>
  );
}
