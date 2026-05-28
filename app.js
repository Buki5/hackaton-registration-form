const form = document.getElementById("registrationForm");
const resultBanner = document.getElementById("resultBanner");

async function postForm(payload) {
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
    const { data } = await postForm(payload);
    resultBanner.textContent = data.message || "Submitted";
    resultBanner.classList.remove("ok", "warn");
  } catch (error) {
    resultBanner.textContent = "Network error. Please try again.";
    resultBanner.classList.remove("ok");
    resultBanner.classList.add("warn");
  }
});
