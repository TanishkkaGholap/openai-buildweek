import { GoogleGenAI } from "@google/genai";

// Alias that always points to Google's current recommended flash-tier model
// (avoids hardcoding a dated model ID that later gets retired).
const MODEL = "gemini-flash-latest";

let client = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error(
      "GEMINI_API_KEY is not set. Add it to server/.env to use AI features."
    );
    err.code = "MISSING_API_KEY";
    throw err;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

function normalizeError(err) {
  const message = err?.message || "Gemini request failed.";
  const wrapped = new Error(message);
  if (/api key|api_key_invalid|401|403|permission|unauthenticated/i.test(message)) {
    wrapped.code = "AUTH_ERROR";
  }
  return wrapped;
}

function extractText(response) {
  if (response.promptFeedback?.blockReason) {
    const err = new Error(
      `Gemini declined to respond (${response.promptFeedback.blockReason}).`
    );
    err.code = "REFUSAL";
    throw err;
  }
  const text = response.text;
  if (!text) {
    throw new Error("No content returned from Gemini.");
  }
  return text;
}

/**
 * Ask Gemini for a JSON object matching the given schema.
 * `schema` must use the @google/genai `Type` enum (Type.OBJECT, Type.STRING, ...).
 */
export async function askForJson({ system, prompt, schema, maxOutputTokens = 8192 }) {
  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens,
      },
    });
  } catch (err) {
    throw normalizeError(err);
  }

  const text = extractText(response);
  return JSON.parse(text);
}

/**
 * Ask Gemini for plain text (no schema).
 */
export async function askForText({ system, prompt, maxOutputTokens = 4096 }) {
  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        maxOutputTokens,
      },
    });
  } catch (err) {
    throw normalizeError(err);
  }

  return extractText(response);
}
