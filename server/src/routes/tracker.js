import { Router } from "express";
import { listRecords, updateStatus, VALID_STATUSES } from "../services/trackerStore.js";

const router = Router();

// GET /api/tracker
router.get("/", async (req, res) => {
  try {
    res.json({ records: await listRecords(), validStatuses: VALID_STATUSES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tracker/:id  { status }
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "status is required." });
    }
    const record = await updateStatus(req.params.id, status);
    res.json({ record });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err.code === "INVALID_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
