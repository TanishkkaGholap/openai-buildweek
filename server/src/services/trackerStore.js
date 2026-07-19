import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "tracker.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(records) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export const VALID_STATUSES = ["Tailored", "Applied", "Interview", "Rejected"];

export function listRecords() {
  return readAll().sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function addRecord({ jobTitle, company }) {
  const records = readAll();
  const record = {
    id: randomUUID(),
    jobTitle,
    company,
    date: new Date().toISOString(),
    status: "Tailored",
  };
  records.push(record);
  writeAll(records);
  return record;
}

export function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    err.code = "INVALID_STATUS";
    throw err;
  }
  const records = readAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) {
    const err = new Error("Tracker record not found.");
    err.code = "NOT_FOUND";
    throw err;
  }
  records[idx].status = status;
  writeAll(records);
  return records[idx];
}
