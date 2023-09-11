import { db } from "./api_database.js";
import express from "express";
import { authMW } from "./api_auth.js";
import { wsSendTimers } from "./server.js";

export const router = express.Router();

router.get("/api/timers", authMW(), async (req, res) => {
  const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : null;

  if (req.user?.id) {
    const timers = await db.getTimers(req.user.id, isActive);
    return res.json({ timers });
  }

  return res.json({});
});

router.get("/api/timers/:id", authMW(), async (req, res) => {
  if (req.user?.id) {
    const timer = await db.findTimerById(req.params.id);
    return res.json({ timer });
  }

  return res.json({});
});

router.post("/api/timers", authMW(), async (req, res) => {
  const timer = await db.createTimer({
    user_id: req.user.id,
    start: Date.now(),
    description: req.body.description,
    is_active: true,
  });

  await wsSendTimers("all_timers", req.user.id);

  return res.json({ timer });
});

router.post("/api/timers/:id/stop", authMW(), async (req, res) => {
  const id = req.params.id;

  await db.updTimerById(id, {
    end: Date.now(),
    is_active: false,
  });

  await wsSendTimers("all_timers", req.user.id);

  const timer = await db.findTimerById(id);
  return res.json({ timer });
});
