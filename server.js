const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/submit", (req, res) => {
  const payload = req.body || {};
  const guardFields = ["input_3", "input_5", "input_7"];
  const triggered = guardFields.some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (triggered) {
    console.log("AI Detected: Honeypot triggered");
    return res.status(403).json({
      ok: false,
      message: "אתה AI",
      route: "tarpit"
    });
  }

  console.log("Human Verified");
  return res.status(200).json({
    ok: true,
    message: "תודה"
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
