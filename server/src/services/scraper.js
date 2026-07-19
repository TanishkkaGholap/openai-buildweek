import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetch a job posting URL and return cleaned, visible text content
 * suitable for feeding to Claude for extraction.
 */
export async function fetchPageText(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    validateStatus: (status) => status < 500,
  });

  if (response.status >= 400) {
    const err = new Error(`Failed to fetch job page (HTTP ${response.status}).`);
    err.code = "FETCH_FAILED";
    throw err;
  }

  const $ = cheerio.load(response.data);
  $("script, style, noscript, svg, nav, footer, header, iframe").remove();

  const text = $("body").text().replace(/\s+/g, " ").trim();

  if (!text) {
    const err = new Error("Could not extract readable text from that page.");
    err.code = "EMPTY_PAGE";
    throw err;
  }

  return text.slice(0, 15000);
}
