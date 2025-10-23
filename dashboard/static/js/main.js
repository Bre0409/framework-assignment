document.addEventListener("DOMContentLoaded", function () {
  /* -----------------------------
     CHART INITIALIZATION
  ----------------------------- */
  const ctx = document.getElementById("progressChart");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["M", "T", "W", "T", "F", "S", "S"],
        datasets: [{
          label: "Progress",
          data: [4, 5, 7, 6, 8, 7, 9],
          borderColor: "#00b4ff",
          fill: false,
          tension: 0.3
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  /* -----------------------------
     DATE DISPLAY
  ----------------------------- */
  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    const options = { weekday: "long", month: "short", day: "numeric" };
    dateEl.textContent = new Date().toLocaleDateString(undefined, options);
  }

  /* -----------------------------
     THEME TOGGLE
  ----------------------------- */
  const body = document.body;
  const toggleBtn = document.getElementById("themeToggle");

  // Load saved theme preference
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light-mode");
    toggleBtn.textContent = "🌙";
  } else {
    toggleBtn.textContent = "☀️";
  }

  toggleBtn?.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    const mode = body.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("theme", mode);
    toggleBtn.textContent = mode === "light" ? "🌙" : "☀️";
  });

  /* -----------------------------
     PROGRESS RINGS
  ----------------------------- */
  const rings = document.querySelectorAll(".progress-ring");
  rings.forEach(ring => {
    const circle = ring.querySelector(".progress-ring-fill");
    const value = parseInt(ring.getAttribute("data-value")) || 0;
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = circumference;

    const offset = circumference - (value / 100) * circumference;
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 300);

    const text = ring.querySelector(".progress-text");
    if (text) text.textContent = `${value}%`;
  });

  /* -----------------------------
     MOTIVATIONAL MESSAGES
  ----------------------------- */
  const messages = [
    "Keep pushing forward — your consistency is paying off! 💪",
    "Every small win counts — great job! 🌟",
    "You’re building something amazing. Stay focused! 🚀",
    "Success is built daily — one step at a time. 🏁"
  ];
  const banner = document.getElementById("motivationBanner");
  let index = 0;
  setInterval(() => {
    index = (index + 1) % messages.length;
    banner.textContent = messages[index];
  }, 6000);
});
