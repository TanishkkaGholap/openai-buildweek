// In local dev, relative "/api" is handled by the Vite dev-server proxy
// (see vite.config.js). In production, the frontend and backend are
// separate Vercel projects/domains, so VITE_API_URL must point at the
// deployed backend, e.g. "https://server-dusky-six-22.vercel.app/api".
const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  health: () => request("/health"),

  parseResume: (resumeText) =>
    request("/resume/parse", {
      method: "POST",
      body: JSON.stringify({ resumeText }),
    }),

  tailorResume: ({ resumeText, parsedResume, job }) =>
    request("/resume/tailor", {
      method: "POST",
      body: JSON.stringify({ resumeText, parsedResume, job }),
    }),

  searchJobs: ({ preferences, parsedResume }) =>
    request("/jobs/search", {
      method: "POST",
      body: JSON.stringify({ preferences, parsedResume }),
    }),

  addManualJob: (url) =>
    request("/jobs/manual", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  matchJobs: ({ jobs, resumeText, parsedResume }) =>
    request("/jobs/match", {
      method: "POST",
      body: JSON.stringify({ jobs, resumeText, parsedResume }),
    }),

  getTracker: () => request("/tracker"),

  updateTrackerStatus: (id, status) =>
    request(`/tracker/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  tailoredResumePdfUrl: () => `${BASE}/resume/tailor/pdf`,
};
