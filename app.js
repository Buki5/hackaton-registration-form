const form = document.getElementById("registrationForm");
const resultBanner = document.getElementById("resultBanner");
const fieldsGrid = document.getElementById("fieldsGrid");
const maskLayer = fieldsGrid.querySelector(".form-texture-layer");

async function postSubmission(payload) {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

async function fetchFormConfig() {
  const response = await fetch("/api/form-config", {
    method: "GET",
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error("Unable to load form configuration");
  }
  const data = await response.json();
  return data.fields || [];
}

function renderFields(fields) {
  fieldsGrid.querySelectorAll(".input-group").forEach((node) => node.remove());
  fields.forEach((field) => {
    const row = document.createElement("div");
    row.className = "input-group";

    const label = document.createElement("label");
    label.setAttribute("for", field.id);
    label.textContent = field.label;

    const input = document.createElement("input");
    input.id = field.id;
    input.name = field.name;
    input.type = field.type || "text";
    input.autocomplete = field.autocomplete || "off";

    row.appendChild(label);
    row.appendChild(input);
    fieldsGrid.insertBefore(row, maskLayer);
  });

  maskLayer.style.backgroundImage = `url("/api/mask.svg?v=${Date.now()}")`;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const fields = await fetchFormConfig();
    renderFields(fields);
  } catch (_error) {
    resultBanner.textContent = "Unable to load the form right now.";
    resultBanner.classList.remove("ok");
    resultBanner.classList.add("warn");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  resultBanner.textContent = "Submitting...";
  resultBanner.classList.remove("ok", "warn");

  try {
    const { ok, data } = await postSubmission(payload);
    if (data?.nextUrl) {
      window.location.href = data.nextUrl;
      return;
    }
    resultBanner.textContent = data.message || (ok ? "Submission complete." : "Submission failed.");
    resultBanner.classList.toggle("ok", ok);
    resultBanner.classList.toggle("warn", !ok);
  } catch (_error) {
    resultBanner.textContent = "Verification service unavailable. Please try again later.";
    resultBanner.classList.remove("ok");
    resultBanner.classList.add("warn");
  }
});
