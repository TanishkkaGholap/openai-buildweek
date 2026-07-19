function aggregateMissingSkills(jobs) {
  const counts = new Map();
  for (const job of jobs) {
    for (const raw of job.missingSkills || []) {
      const key = raw.trim();
      if (!key) continue;
      const norm = key.toLowerCase();
      const existing = counts.get(norm);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(norm, { label: key, count: 1 });
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

export default function SkillGapReport({ jobs }) {
  if (!jobs || jobs.length === 0) return null;

  const skills = aggregateMissingSkills(jobs);
  if (skills.length === 0) return null;

  // Prioritize skills that show up more than once, but fall back to
  // everything if nothing repeats.
  const recurring = skills.filter((s) => s.count > 1);
  const shown = (recurring.length > 0 ? recurring : skills).slice(0, 12);

  return (
    <div className="card skill-gap-card">
      <h2>Skill Gap Report</h2>
      <p className="subtitle" style={{ margin: 0 }}>
        Skills that keep coming up you don&apos;t have yet:
      </p>
      <div className="missing-skills" style={{ marginTop: 10 }}>
        {shown.map((s) => (
          <span key={s.label} className="skill-chip">
            {s.label}
            {s.count > 1 ? ` ×${s.count}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
