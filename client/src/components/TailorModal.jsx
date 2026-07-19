import { api } from "../api.js";

export default function TailorModal({ job, tailoredResume, onClose }) {
  if (!job) return null;

  async function handleDownload() {
    const res = await fetch(api.tailoredResumePdfUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tailoredResume, job }),
    });
    if (!res.ok) {
      alert("Could not generate PDF. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Resume - ${job.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Tailored Resume — {job.title}</h2>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="subtitle" style={{ margin: "0 0 8px" }}>
          Rewritten to emphasize what {job.company} is asking for. Saved to your Tracker as
          &quot;Tailored&quot;.
        </p>
        <div className="tailored-box">{tailoredResume}</div>
        <div className="row">
          <button onClick={handleDownload}>Download as PDF</button>
        </div>
      </div>
    </div>
  );
}
