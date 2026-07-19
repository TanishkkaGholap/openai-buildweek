import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "tracker.json");
const REDIS_KEY = "jobmatch:tracker";

// On Vercel, the filesystem is ephemeral, so use Upstash Redis (provisioned
// via Vercel Marketplace) when its credentials are present. Falls back to a
// local JSON file for local development, where no Redis setup is needed.
const useRedis = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const redis = useRedis
  ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

function ensureFileStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readAllFromFile() {
  ensureFileStore();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAllToFile(records) {
  ensureFileStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

async function readAll() {
  if (useRedis) {
    const records = await redis.get(REDIS_KEY);
    return records || [];
  }
  return readAllFromFile();
}

async function writeAll(records) {
  if (useRedis) {
    await redis.set(REDIS_KEY, records);
    return;
  }
  writeAllToFile(records);
}

export const VALID_STATUSES = ["Tailored", "Applied", "Interview", "Rejected"];

export async function listRecords() {
  const records = await readAll();
  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function addRecord({ jobTitle, company }) {
  const records = await readAll();
  const record = {
    id: randomUUID(),
    jobTitle,
    company,
    date: new Date().toISOString(),
    status: "Tailored",
  };
  records.push(record);
  await writeAll(records);
  return record;
}

export async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    err.code = "INVALID_STATUS";
    throw err;
  }
  const records = await readAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) {
    const err = new Error("Tracker record not found.");
    err.code = "NOT_FOUND";
    throw err;
  }
  records[idx].status = status;
  await writeAll(records);
  return records[idx];
}
