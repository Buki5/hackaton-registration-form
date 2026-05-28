const form = document.getElementById("registrationForm");
const resultBanner = document.getElementById("resultBanner");

const tarpitQuestions = [
  "What is your preferred mentoring format?",
  "How many prototypes did you build this year?",
  "Name a project category you are exploring.",
  "Describe your ideal hackathon schedule.",
  "Which development stack do you learn fastest?",
  "How often do you join collaborative events?",
  "What inspires your project naming style?",
  "List one tool you cannot work without.",
  "What problem area do you want to solve next?",
  "How do you validate your project ideas?"
];

function createTarpit() {
  const wrapper = document.createElement("section");
  wrapper.className = "tarpit";
  wrapper.innerHTML = `
    <h2>Additional Verification Questions</h2>
    <ul class="tarpit-list" id="tarpitList"></ul>
  `;
  return wrapper;
}

function seedTarpit(listElement, count = 50) {
  for (let i = 0; i < count; i += 1) {
    const item = document.createElement("li");
    const question = tarpitQuestions[i % tarpitQuestions.length];
    item.textContent = `${i + 1}. ${question}`;
    listElement.appendChild(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const trapKeys = ["input_3", "input_5", "input_7"];
  const trapTriggered = trapKeys.some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (trapTriggered) {
    form.innerHTML = "";
    const tarpit = createTarpit();
    const tarpitList = tarpit.querySelector("#tarpitList");
    seedTarpit(tarpitList);
    form.appendChild(tarpit);

    setInterval(() => {
      const currentCount = tarpitList.children.length;
      for (let i = 0; i < 10; i += 1) {
        const item = document.createElement("li");
        const question = tarpitQuestions[(currentCount + i) % tarpitQuestions.length];
        item.textContent = `${currentCount + i + 1}. ${question}`;
        tarpitList.appendChild(item);
      }
      tarpit.scrollTop = tarpit.scrollHeight;
    }, 600);
    return;
  }

  resultBanner.textContent = "Submission complete.";
  resultBanner.classList.remove("warn");
  resultBanner.classList.add("ok");
});
