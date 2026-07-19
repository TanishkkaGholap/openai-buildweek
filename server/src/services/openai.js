import OpenAI from "openai";

// Cost-effective tier of the current model family, sufficient for
// extraction/classification/rewriting tasks like this app's.
const MODEL = "gpt-5-mini";

let client = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error(
      "OPENAI_API_KEY is not set. Add it to server/.env to use AI features."
    );
    err.code = "MISSING_API_KEY";
    throw err;
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

function normalizeError(err) {
  const message = err?.message || "OpenAI request failed.";
  const wrapped = new Error(message);
  if (err?.status === 401 || err?.status === 403) {
    wrapped.code = "AUTH_ERROR";
  }
  return wrapped;
}

function extractText(response) {
  const text = response.output_text;
  if (!text) {
    // A message item with a refusal content block means the model declined.
    const refusal = response.output
      ?.flatMap((item) => item.content || [])
      .find((c) => c.type === "refusal");
    if (refusal) {
      const err = new Error(`Model declined to respond: ${refusal.refusal}`);
      err.code = "REFUSAL";
      throw err;
    }
    throw new Error("No content returned from OpenAI.");
  }
  return text;
}

/**
 * Ask the model for a JSON object matching the given JSON Schema.
 */
export async function askForJson({ system, prompt, schema, maxOutputTokens = 8192 }) {
  const client = getClient();
  let response;
  try {
    response = await client.responses.create({
      model: MODEL,
      instructions: system,
      input: prompt,
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: "response",
          schema,
          strict: true,
        },
      },
    });
  } catch (err) {
    throw normalizeError(err);
  }

  const text = extractText(response);
  return JSON.parse(text);
}

/**
 * Ask the model for plain text (no schema).
 */
export async function askForText({ system, prompt, maxOutputTokens = 4096 }) {
  const client = getClient();
  let response;
  try {
    response = await client.responses.create({
      model: MODEL,
      instructions: system,
      input: prompt,
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: "low" },
    });
  } catch (err) {
    throw normalizeError(err);
  }

  return extractText(response);
}
