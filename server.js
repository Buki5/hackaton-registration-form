const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;
const FIELD_COUNT = 8;
const TRAP_COUNT = 3;
const SESSION_TTL_MS = 10 * 60 * 1000;
const sessions = new Map();

app.use(express.json());
app.use(express.static(__dirname));

function parseCookies(headerValue = "") {
  return headerValue.split(";").reduce((acc, segment) => {
    const [rawKey, ...rawValue] = segment.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
}

function pickTrapRows() {
  const values = Array.from({ length: FIELD_COUNT }, (_, i) => i + 1);
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values.slice(0, TRAP_COUNT).sort((a, b) => a - b);
}

function getOrCreateSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies.sid;
  const now = Date.now();

  if (existing && sessions.has(existing)) {
    const session = sessions.get(existing);
    if (now - session.createdAt < SESSION_TTL_MS) {
      return session;
    }
    sessions.delete(existing);
  }

  const sid = crypto.randomUUID();
  const session = {
    id: sid,
    trapRows: pickTrapRows(),
    createdAt: now
  };
  sessions.set(sid, session);
  res.setHeader("Set-Cookie", `sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  return session;
}

app.get("/api/mask.svg", (_req, res) => {
  const session = getOrCreateSession(_req, res);
  const rects = session.trapRows
    .map((row) => {
      const y = ((row - 1) * 100) / FIELD_COUNT;
      const h = 100 / FIELD_COUNT;
      return `<rect x="0" y="${y}%" width="100%" height="${h}%" fill="#ffffff" />`;
    })
    .join("\n  ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
  ${rects}
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.send(svg);
});

app.post("/api/submit", (req, res) => {
  const session = getOrCreateSession(req, res);
  const payload = req.body || {};
  const trapFields = session.trapRows.map((row) => `input_${row}`);
  const triggered = trapFields.some((field) => {
    const value = payload[field];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (triggered) {
    console.log("AI Detected: Honeypot triggered");
    return res.status(200).json({
      status: "trap",
      message: "AI Detected: Honeypot triggered"
    });
  }

  console.log("Human Verified");
  return res.status(200).json({
    status: "success",
    message: "Human verified"
  });
});

app.get("/", (_req, res) => {
  getOrCreateSession(_req, res);
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
