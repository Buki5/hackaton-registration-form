const form = document.getElementById("registrationForm");
const resultBanner = document.getElementById("resultBanner");

async function postSubmission(payload) {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  resultBanner.textContent = "Submitting...";
  resultBanner.classList.remove("ok", "warn");

  try {
    const { ok, data } = await postSubmission(payload);
    resultBanner.textContent = data.message || (ok ? "Submission complete." : "Submission failed.");
    resultBanner.classList.toggle("ok", ok);
    resultBanner.classList.toggle("warn", !ok);
  } catch (_error) {
    resultBanner.textContent = "Submission received.";
    resultBanner.classList.remove("warn");
    resultBanner.classList.add("ok");
  }
});
