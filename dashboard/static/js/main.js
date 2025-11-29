// static/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggleBtn = document.getElementById("themeToggle");
  const dateSpan = document.getElementById("currentDate");
  const banner = document.getElementById("motivationBanner");

  // ----------------------------
  // 1. Current Date
  // ----------------------------
  const today = new Date();
  if (dateSpan) {
    dateSpan.textContent = today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  // ----------------------------
  // 2. Theme toggle (dark / light)
  // ----------------------------
  if (toggleBtn) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      body.classList.add("light-mode");
      toggleBtn.textContent = "🌞";
      toggleBtn.classList.remove("btn-outline-light");
      toggleBtn.classList.add("btn-outline-dark");
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
  // 3. Progress rings (dashboard goals)
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

    // animate in
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 250);

    // Color by progress
    if (clamped >= 90) {
      circle.style.stroke = "#00ff88"; // green
    } else if (clamped >= 70) {
      circle.style.stroke = "#00b4ff"; // blue
    } else {
      circle.style.stroke = "#ff4d4d"; // red
    }

    const textEl = ring.querySelector(".progress-ring-text");
    if (textEl) {
      textEl.textContent = `${clamped}%`;
    }
  });

  // ----------------------------
  // 4. Motivation banner cycle
  // ----------------------------
  const messages = [
    "Keep pushing forward — your consistency is paying off! 💪",
    "Small progress is still progress. 🌱",
    "You’re doing amazing — stay focused! 🚀",
    "Remember why you started. 💭",
  ];

  if (banner) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % messages.length;
      banner.textContent = messages[idx];
    }, 6000);
  }

  // ----------------------------
  // 5. Sidebar collapse
  // ----------------------------
  const sidebar = document.querySelector(".sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  if (sidebar && sidebarToggle) {
    if (localStorage.getItem("sidebarCollapsed") === "1") {
      sidebar.classList.add("collapsed");
    }

    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      const collapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
    });
  }

  // ----------------------------
  // 6. Messages submenu (Inbox / Sent / etc)
  // ----------------------------
  const messagesToggle = document.getElementById("messagesToggle");
  const messagesGroup = document.getElementById("messagesGroup");

  if (messagesToggle && messagesGroup) {
    messagesToggle.addEventListener("click", () => {
      messagesGroup.classList.toggle("show");
      messagesToggle.classList.toggle("open");
    });
  }

  // ----------------------------
  // 7. Weekly progress chart
  // ----------------------------
  const ctx = document.getElementById("progressChart");
  if (ctx && window.Chart) {
    // Avoid double-init if some other script ever touches it
    if (ctx._weeklyChartInstance) {
      ctx._weeklyChartInstance.destroy();
    }

    ctx._weeklyChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Progress %",
            data: [65, 80, 70, 90, 75, 85, 95],
            borderRadius: 8,
            backgroundColor: (chartCtx) => {
              const index = chartCtx.dataIndex;
              const value = chartCtx.dataset.data[index];
              if (value >= 90) return "#00ff88";
              if (value >= 70) return "#00b4ff";
              return "#ff4d4d";
            },
          },
        ],
      },
      options: {
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
        plugins: {
          legend: { display: false },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
});
