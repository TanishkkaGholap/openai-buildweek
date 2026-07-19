import axios from "axios";

const JSEARCH_HOST = "jsearch.p.rapidapi.com";

/**
 * Fetch live job listings from JSearch (RapidAPI), filtered by
 * the user's preferences and (optionally) the parsed resume's role signal.
 */
export async function searchJobs({ preferences, resume }) {
  if (!process.env.RAPIDAPI_KEY) {
    const err = new Error(
      "RAPIDAPI_KEY is not set. Add it to server/.env to fetch live jobs."
    );
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const role = preferences?.role?.trim() || resume?.past_job_titles?.[0] || "";
  const location = preferences?.location?.trim() || "";

  const queryParts = [role, location].filter(Boolean);
  let query = queryParts.join(" in ") || role || "software engineer";

  // The API's remote/experience filter params aren't documented for this
  // endpoint version, so fold those preferences into the query text instead
  // of relying on undocumented query params.
  if (preferences?.remoteType === "remote") {
    query = `remote ${query}`;
  } else if (preferences?.remoteType === "hybrid") {
    query = `hybrid ${query}`;
  }
  if (preferences?.experienceLevel === "senior" || preferences?.experienceLevel === "lead") {
    query = `senior ${query}`;
  } else if (preferences?.experienceLevel === "entry") {
    query = `entry level ${query}`;
  }

  const params = {
    query,
    num_pages: "1",
    country: "us",
    date_posted: "all",
  };

  const response = await axios.get(`https://${JSEARCH_HOST}/search-v2`, {
    params,
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": JSEARCH_HOST,
    },
    timeout: 20000,
  });

  const results = response.data?.data?.jobs || [];

  return results.slice(0, 15).map((job, idx) => ({
    id: job.job_id || `jsearch-${idx}`,
    source: "jsearch",
    title: job.job_title || "Untitled role",
    company: job.employer_name || "Unknown company",
    location:
      [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ") ||
      (job.job_is_remote ? "Remote" : "Not specified"),
    remote: !!job.job_is_remote,
    url: job.job_apply_link || job.job_google_link || "",
    description: (job.job_description || "").slice(0, 6000),
    postedAt: job.job_posted_at_datetime_utc || null,
    salary:
      job.job_salary_string ||
      (job.job_min_salary && job.job_max_salary
        ? `$${job.job_min_salary}-${job.job_max_salary}${job.job_salary_period ? ` / ${job.job_salary_period}` : ""}`
        : null),
  }));
}
