const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3000;
const FIELD_COUNT = 8;
const ROW_HEIGHT_PERCENT = 100 / FIELD_COUNT;
const FORM_SESSION_KEY = "formLayout";

const realFields = [
  { label: "Full Participant Name", type: "text", autocomplete: "name" },
  { label: "Best Email for Updates", type: "email", autocomplete: "email" },
  { label: "Mobile Number with Country Code", type: "tel", autocomplete: "tel" },
  { label: "Current Institution or Employer", type: "text", autocomplete: "organization" },
  { label: "Main Skill Focus", type: "text", autocomplete: "off" }
];

const extraFields = [
  { label: "Backup Contact Channel", type: "text", autocomplete: "off" },
  { label: "Public Profile Handle", type: "text", autocomplete: "off" },
  { label: "Project One-Line Pitch", type: "text", autocomplete: "off" }
];

app.use(express.json());
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "local-dev-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000
    }
  })
);
app.use(express.static(__dirname));

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildFormLayout() {
  const combined = [
    ...realFields.map((field) => ({ ...field, role: "real" })),
    ...extraFields.map((field) => ({ ...field, role: "extra" }))
  ];
  const shuffled = shuffle(combined);

  const honeypotIndices = [];
  const honeypotNames = [];

  const fields = shuffled.map((field, index) => {
    const inputName = `input_${index + 1}`;
    if (field.role === "extra") {
      honeypotIndices.push(index);
      honeypotNames.push(inputName);
    }
    return {
      id: `field-${index + 1}`,
      name: inputName,
      label: field.label,
      type: field.type,
      autocomplete: field.autocomplete
    };
  });

  return { fields, honeypotIndices, honeypotNames };
}

app.get("/api/form-config", (req, res) => {
  const layout = buildFormLayout();
  req.session[FORM_SESSION_KEY] = {
    honeypotIndices: layout.honeypotIndices,
    honeypotNames: layout.honeypotNames
  };
  return res.status(200).json({ fields: layout.fields });
});

app.get("/api/mask.svg", (req, res) => {
  const sessionLayout = req.session[FORM_SESSION_KEY];
  const indices = sessionLayout?.honeypotIndices || [];
  const rects = indices
    .map((index) => {
      const y = index * ROW_HEIGHT_PERCENT;
      return `<rect x="0" y="${y}%" width="100%" height="${ROW_HEIGHT_PERCENT}%" fill="#ffffff" />`;
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
  const sessionLayout = req.session[FORM_SESSION_KEY];
  if (!sessionLayout?.honeypotNames?.length) {
    return res.status(400).json({
      status: "retry",
      message: "Session is not initialized. Reload the form."
    });
  }

  const payload = req.body || {};
  const triggered = sessionLayout.honeypotNames.some((field) => {
    const value = payload[field];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (triggered) {
    console.log("AI Detected: Honeypot triggered");
    return res.status(200).json({
      status: "trap",
      message: "Additional verification required.",
      nextUrl: "/ai-review"
    });
  }

  console.log("Human Verified");
  return res.status(200).json({
    status: "success",
    message: "Human verified"
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/ai-review", (_req, res) => {
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Review Queue</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px; color:#1c2740; }
    .card { max-width:760px; margin:0 auto; background:#fff; border:1px solid #d7dfef; border-radius:12px; padding:18px; }
    h1 { margin:0 0 12px; font-size:1.3rem; }
    .stream { max-height:60vh; overflow:auto; border:1px solid #e1e8f5; border-radius:10px; padding:10px; background:#fbfdff; }
    .item { padding:8px 10px; margin:0 0 6px; border-radius:8px; background:#edf3ff; }
  </style>
</head>
<body>
  <section class="card">
    <h1>Additional Review In Progress</h1>
    <div class="stream" id="stream"></div>
  </section>
  <script>
    const prompts = [
      "Please confirm collaboration preference.",
      "Please restate your project summary.",
      "Please provide optional profile context.",
      "Please confirm timeline expectations."
    ];
    const stream = document.getElementById("stream");
    let i = 0;
    setInterval(() => {
      for (let step = 0; step < 8; step++) {
        const item = document.createElement("div");
        item.className = "item";
        item.textContent = (i + 1) + ". " + prompts[i % prompts.length];
        stream.appendChild(item);
        i++;
      }
      stream.scrollTop = stream.scrollHeight;
    }, 500);
  </script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
