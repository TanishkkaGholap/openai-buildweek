import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function PreferencesPage() {
  const { preferences, setPreferences, preferencesComplete } = useApp();
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setPreferences({ [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!preferencesComplete) return;
    navigate("/resume");
  }

  return (
    <div>
      <h1>Job Preferences</h1>
      <p className="subtitle">
        Tell us what you&apos;re looking for. Every job search below will be filtered by these
        preferences.
      </p>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="role">Role / Title *</label>
            <input
              id="role"
              name="role"
              type="text"
              placeholder="e.g. Senior Backend Engineer"
              value={preferences.role}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. New York, NY"
              value={preferences.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="remoteType">Work Type *</label>
            <select
              id="remoteType"
              name="remoteType"
              value={preferences.remoteType}
              onChange={handleChange}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="experienceLevel">Experience Level *</label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={preferences.experienceLevel}
              onChange={handleChange}
            >
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Staff</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="salaryMin">Salary Range — Min (optional)</label>
            <input
              id="salaryMin"
              name="salaryMin"
              type="number"
              placeholder="e.g. 120000"
              value={preferences.salaryMin}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="salaryMax">Salary Range — Max (optional)</label>
            <input
              id="salaryMax"
              name="salaryMax"
              type="number"
              placeholder="e.g. 160000"
              value={preferences.salaryMax}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <button type="submit" disabled={!preferencesComplete}>
            Save &amp; Continue to Resume →
          </button>
        </div>
      </form>
    </div>
  );
}
