// ============================
// MAIN DASHBOARD SCRIPT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggleBtn = document.getElementById("themeToggle");
  const dateSpan = document.getElementById("currentDate");
  const banner = document.getElementById("motivationBanner");

  // ----------------------------
  // 1️⃣ Display Current Date
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
  // 2️⃣ Theme Toggle (Dark ↔ Light)
  // ----------------------------
  if (toggleBtn) {
    // Load user’s last saved theme
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
  // 3️⃣ Progress Rings
  // ----------------------------
  const rings = document.querySelectorAll(".progress-ring.small");
  rings.forEach((ring) => {
    const value = parseInt(ring.dataset.value, 10);
    const circle = ring.querySelector(".progress-ring-fill");
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    // Base styling
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    // Animate stroke offset
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 300);

    // Color logic
    if (value >= 90) {
      circle.style.stroke = "#00ff88"; // Green for success
      ring.classList.add("complete");
    } else if (value >= 70) {
      circle.style.stroke = "#00b4ff"; // Blue
    } else {
      circle.style.stroke = "#ff4d4d"; // Red for low
    }
  });

  // ----------------------------
  // 4️⃣ Motivation Banner Cycle
  // ----------------------------
  const messages = [
    "Keep pushing forward — your consistency is paying off! 💪",
    "Small progress is still progress. 🌱",
    "You’re doing amazing — stay focused! 🚀",
    "Remember why you started. 💭",
  ];
  let msgIndex = 0;
  if (banner) {
    setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      banner.textContent = messages[msgIndex];
    }, 6000);
  }

  // ----------------------------
  // 5️⃣ Chart.js (Weekly Trend)
  // ----------------------------
  // const ctx = document.getElementById("progressChart");
  // if (ctx) {
  //   new Chart(ctx, {
  //     type: "bar",
  //     data: {
  //       labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  //       datasets: [
  //         {
  //           label: "Progress %",
  //           data: [65, 80, 70, 90, 75, 85, 95],
  //           borderRadius: 6,
  //           backgroundColor: (ctx) => {
  //             const index = ctx.dataIndex;
  //             const value = ctx.dataset.data[index];
  //             if (value >= 90) return "#00ff88";
  //             if (value >= 70) return "#00b4ff";
  //             return "#ff4d4d";
  //           },
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         y: {
  //           beginAtZero: true,
  //           max: 100,
  //           ticks: { color: "#ccc" },
  //           grid: { color: "rgba(255,255,255,0.05)" },
  //         },
  //         x: {
  //           ticks: { color: "#ccc" },
  //           grid: { color: "transparent" },
  //         },
  //       },
  //       plugins: { legend: { display: false } },
  //       responsive: true,
  //       maintainAspectRatio: false,
  //     },
  //   });
  // }
});
