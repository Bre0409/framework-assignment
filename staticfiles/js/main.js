// static/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggleBtn = document.getElementById("themeToggle");
  const dateSpan = document.getElementById("currentDate");
  const banner = document.getElementById("motivationBanner");
  let weeklyChart = null;

  // ----------------------------
  // 1. Current Date
  // ----------------------------
  if (dateSpan) {
    const today = new Date();
    dateSpan.textContent = today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  // ----------------------------
  // 2. Theme Toggle
  // ----------------------------
  if (toggleBtn) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      body.classList.add("light-mode");
      toggleBtn.textContent = "🌞";
      toggleBtn.classList.replace("btn-outline-light", "btn-outline-dark");
    }

    toggleBtn.addEventListener("click", () => {
      body.classList.toggle("light-mode");
      const isLight = body.classList.contains("light-mode");
      toggleBtn.textContent = isLight ? "🌞" : "🌙";
      toggleBtn.classList.toggle("btn-outline-dark", isLight);
      toggleBtn.classList.toggle("btn-outline-light", !isLight);
      localStorage.setItem("theme", isLight ? "light" : "dark");
    });
  }

  // ----------------------------
  // 3. Progress Rings on Home
  // ----------------------------
  const rings = document.querySelectorAll(".progress-ring.small");

  rings.forEach((ring) => {
    const value = parseInt(ring.dataset.value || "0", 10);
    const circle = ring.querySelector(".progress-ring-fill");
    if (!circle) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, value));
    const offset = circumference - (clamped / 100) * circumference;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    setTimeout(() => (circle.style.strokeDashoffset = offset), 250);

    // Colors
    circle.style.stroke =
      clamped >= 90 ? "#00ff88" : clamped >= 70 ? "#00b4ff" : "#ff4d4d";

    const textEl = ring.querySelector(".progress-ring-text");
    if (textEl) textEl.textContent = `${clamped}%`;
  });

  // ----------------------------
  // 4. Motivation Banner
  // ----------------------------
  if (banner) {
    const messages = [
      "Keep pushing forward — your consistency is paying off! 💪",
      "Small progress is still progress. 🌱",
      "You’re doing amazing — stay focused! 🚀",
      "Remember why you started. 💭",
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % messages.length;
      banner.textContent = messages[idx];
    }, 6000);
  }

  // ----------------------------
  // 5. Sidebar Collapse (main sidebar)
  // ----------------------------
  const sidebar = document.querySelector(".sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  if (sidebar && sidebarToggle) {
    if (localStorage.getItem("sidebarCollapsed") === "1") {
      sidebar.classList.add("collapsed");
    }

    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebarCollapsed",
        sidebar.classList.contains("collapsed") ? "1" : "0"
      );
    });
  }

  // ----------------------------
// Messaging Sidebar Toggle (Final Working Version)
// ----------------------------
const messagesToggle = document.getElementById("messagesToggle");
const messagesGroup = document.getElementById("messagesGroup");

if (messagesToggle && messagesGroup) {
    messagesToggle.addEventListener("click", (e) => {
        e.preventDefault();

        // Toggle the CSS class controlling visibility
        messagesGroup.classList.toggle("show");

        // Rotate the chevron icon
        const chevron = messagesToggle.querySelector(".chevron-icon");
        if (chevron) {
            chevron.classList.toggle("open");
        }
    });
}

  // ----------------------------
  // 7. Weekly Chart Helpers
  // ----------------------------
  function todayIndex() {
    return (new Date().getDay() + 6) % 7; // Monday = 0
  }

  function getTaskPercent() {
    const list = document.getElementById("taskList");
    if (!list) return 0;

    const boxes = list.querySelectorAll(".dashboard-task-toggle");
    if (!boxes.length) return 0;

    let done = 0;
    boxes.forEach((b) => {
      if (b.checked) done++;
    });

    return Math.round((done / boxes.length) * 100);
  }

  function getGoalPercent() {
    const rings = document.querySelectorAll(".progress-ring.small");
    if (!rings.length) return 0;

    let total = 0;
    rings.forEach((r) => {
      total += parseInt(r.dataset.value || "0", 10);
    });

    return Math.round(total / rings.length);
  }

  function updateWeeklyChart() {
    if (!weeklyChart) return;

    const idx = todayIndex();
    weeklyChart.data.datasets[0].data[idx] = getGoalPercent();
    weeklyChart.data.datasets[1].data[idx] = getTaskPercent();
    weeklyChart.update();
  }

  // Events from dashboard.js + goals.js
  document.addEventListener("goalProgressChanged", updateWeeklyChart);
  document.addEventListener("dashboardTasksChanged", updateWeeklyChart);

  // ----------------------------
  // 8. Weekly Chart Creation
  // ----------------------------
  const ctx = document.getElementById("progressChart");
  if (ctx && window.Chart) {
    if (ctx._weeklyChartInstance) ctx._weeklyChartInstance.destroy();

    weeklyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Goals %",
            data: [0, 0, 0, 0, 0, 0, 0],
            borderRadius: 8,
            backgroundColor: "#00b4ff",
          },
          {
            label: "Tasks %",
            data: [0, 0, 0, 0, 0, 0, 0],
            borderRadius: 8,
            backgroundColor: "#00ff88",
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: { color: "#ccc" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: "#ccc" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          x: {
            ticks: { color: "#ccc" },
            grid: { display: false },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    ctx._weeklyChartInstance = weeklyChart;

    updateWeeklyChart();
  }
});
