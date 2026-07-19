import { useEffect, useState } from "react";
import { api } from "../api.js";
import Loader from "../components/Loader.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function TrackerPage() {
  const [records, setRecords] = useState([]);
  const [validStatuses, setValidStatuses] = useState(["Tailored", "Applied", "Interview", "Rejected"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { records, validStatuses } = await api.getTracker();
      setRecords(records);
      if (validStatuses) setValidStatuses(validStatuses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    const prev = records;
    setRecords((r) => r.map((rec) => (rec.id === id ? { ...rec, status } : rec)));
    try {
      await api.updateTrackerStatus(id, status);
    } catch (err) {
      setError(err.message);
      setRecords(prev);
    }
  }

  return (
    <div>
      <h1>Application Tracker</h1>
      <p className="subtitle">
        Every time you tailor a resume for a job, it&apos;s logged here automatically.
      </p>

      <ErrorBanner message={error} />

      {loading ? (
        <Loader label="Loading tracker…" />
      ) : records.length === 0 ? (
        <div className="empty-state">
          Nothing tracked yet. Tailor a resume for a job on the Resume &amp; Results tab to add one.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.jobTitle}</td>
                  <td>{r.company}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="status-select"
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    >
                      {validStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
