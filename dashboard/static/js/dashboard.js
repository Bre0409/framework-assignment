document.addEventListener("DOMContentLoaded", () => {
  // -------- TASKS --------
  const taskList = document.getElementById("taskList");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const newTaskInput = document.getElementById("newTaskInput");
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  const renderTasks = () => {
    taskList.innerHTML = "";
    tasks.forEach((task, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <label class="d-flex align-items-center mb-2">
          <input type="checkbox" ${task.done ? "checked" : ""} data-index="${i}" class="form-check-input me-2">
          <span>${task.text}</span>
        </label>`;
      taskList.appendChild(li);
    });
  };

  taskList.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      const index = e.target.dataset.index;
      tasks[index].done = e.target.checked;
      localStorage.setItem("tasks", JSON.stringify(tasks));
      updateProgressRing();
    }
  });

  addTaskBtn.addEventListener("click", () => {
    const text = newTaskInput.value.trim();
    if (text) {
      tasks.push({ text, done: false });
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTasks();
      newTaskInput.value = "";
    }
  });

  // -------- NOTES --------
  const addNoteBtn = document.getElementById("addNoteBtn");
  const noteInput = document.getElementById("noteInput");
  const notesList = document.getElementById("notesList");
  let notes = JSON.parse(localStorage.getItem("notes")) || [];

  const renderNotes = () => {
    notesList.innerHTML = "";
    notes.forEach((note, i) => {
      const li = document.createElement("li");
      li.className = "mb-2";
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-center bg-dark p-2 rounded">
          <span>${note}</span>
          <button class="btn btn-sm btn-outline-danger remove-note" data-index="${i}">✕</button>
        </div>`;
      notesList.appendChild(li);
    });
  };

  notesList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-note")) {
      const i = e.target.dataset.index;
      notes.splice(i, 1);
      localStorage.setItem("notes", JSON.stringify(notes));
      renderNotes();
    }
  });

  addNoteBtn.addEventListener("click", () => {
    const noteText = noteInput.value.trim();
    if (noteText) {
      notes.push(noteText);
      localStorage.setItem("notes", JSON.stringify(notes));
      renderNotes();
      noteInput.value = "";
    }
  });
// -------- GOALS (Top 5 from goals.js) --------
const goalList = document.getElementById("goalList");

// Load all goals from goals.js storage
function loadAllGoals() {
  return JSON.parse(localStorage.getItem("productivity_goals_v4")) || [];
}

// Extract the selected goals and take only the first 5
function getTopFiveGoals() {
  let all = loadAllGoals().filter(g => g.selected);
  all.sort((a, b) => (a.order || 0) - (b.order || 0));
  return all.slice(0, 5);
}

let topGoals = getTopFiveGoals();

// Render on dashboard
function renderGoals() {
  topGoals = getTopFiveGoals();
  goalList.innerHTML = "";

  topGoals.forEach((goal, i) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <label class="d-flex align-items-center mb-2">
        <input type="checkbox" ${goal.progress === 100 ? "checked" : ""} 
               data-id="${goal.id}" 
               class="form-check-input me-2 goal-toggle">
        <span>${goal.title}</span>
      </label>
    `;

    goalList.appendChild(li);
  });

  updateProgressRing();
}

// Checkbox event → update storage + ring
goalList.addEventListener("change", (e) => {
  if (!e.target.classList.contains("goal-toggle")) return;

  const id = e.target.dataset.id;
  let all = loadAllGoals();
  const goal = all.find(g => g.id === id);

  if (!goal) return;

  goal.progress = e.target.checked ? 100 : 0;
  localStorage.setItem("productivity_goals_v4", JSON.stringify(all));

  renderGoals();
});

  // -------- GOALS & RING --------
  // const goalList = document.getElementById("goalList");
  // let goals = JSON.parse(localStorage.getItem("goals")) || [
  //   { text: "Drink water", done: true },
  //   { text: "Jogging", done: false },
  //   { text: "Read", done: false },
  // ];

  // const renderGoals = () => {
  //   goalList.innerHTML = "";
  //   goals.forEach((goal, i) => {
  //     const li = document.createElement("li");
  //     li.innerHTML = `
  //       <label class="d-flex align-items-center mb-2">
  //         <input type="checkbox" ${goal.done ? "checked" : ""} data-index="${i}" class="form-check-input me-2">
  //         <span>${goal.text}</span>
  //       </label>`;
  //     goalList.appendChild(li);
  //   });
  //   updateProgressRing();
  // };

  // goalList.addEventListener("change", (e) => {
  //   if (e.target.type === "checkbox") {
  //     const index = e.target.dataset.index;
  //     goals[index].done = e.target.checked;
  //     localStorage.setItem("goals", JSON.stringify(goals));
  //     updateProgressRing();
  //   }
  // });

  // -------- PROGRESS RING --------
  const circle = document.querySelector(".progress-ring-fill");
  const progressText = document.getElementById("goalProgress");
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = circumference;

  function updateProgressRing() {
    const doneCount = goals.filter((g) => g.done).length;
    const percent = Math.round((doneCount / goals.length) * 100);
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = percent >= 80 ? "#00ff88" : percent >= 50 ? "#00b4ff" : "#ff4d4d";
    progressText.textContent = `${percent}%`;
  }

  // -------- CHART --------
  const ctx = document.getElementById("progressChart");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["M", "T", "W", "T", "F", "S", "S"],
        datasets: [
          {
            data: [4, 6, 7, 8, 6, 8, 10],
            borderColor: "#00b4ff",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" } },
          x: { grid: { color: "transparent" } },
        },
      },
    });
  }

  renderTasks();
  renderNotes();
  renderGoals();
});


// storage
(function () {
  const STORAGE_KEY = "productivity_goals_v4";

  function loadGoals() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  }

  /** Convert 0–100 progress to ring stroke offset */
  function ringOffset(progress) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    return circumference - (progress / 100) * circumference;
  }

  /** Render top 5 selected goals */
  function renderTopGoals() {
    const container = document.getElementById("topGoalsContainer");
    if (!container) return;

    const goals = loadGoals()
      .filter(g => g.selected)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .slice(0, 5);

    container.innerHTML = "";

    goals.forEach(g => {
      const progress = g.progress || 0;
      const numeric = g.type === "numeric";

      const item = document.createElement("div");
      item.className = "col-md-4 mb-3";

      item.innerHTML = `
        <div class="goal-box p-3 rounded border bg-dark text-white d-flex align-items-center gap-3">

          ${
            numeric
              ? `
              <!-- Ring -->
              <svg width="90" height="90">
                  <circle cx="45" cy="45" r="40" stroke="#333" stroke-width="8" fill="none" />
                  <circle cx="45" cy="45" r="40" stroke="#00b4ff" stroke-width="8" fill="none"
                          stroke-dasharray="251"
                          stroke-dashoffset="${ringOffset(progress)}"
                          stroke-linecap="round"
                          class="ring-prog" />
              </svg>
            `
              : `
              <!-- Static goal checkbox icon -->
              <div class="static-check text-center">
                <input type="checkbox" ${progress === 100 ? "checked" : ""} class="static-toggle"
                       data-id="${g.id}" style="transform: scale(1.5);">
              </div>
            `
          }

          <div>
            <strong>${g.title}</strong><br>
            <small class="text-muted">${numeric ? progress + "%" : "Static Goal"}</small>
          </div>
        </div>
      `;

      container.appendChild(item);
    });

    bindStaticCheckboxEvents();
  }

  /** Allow static goals to update progress when toggled from dashboard */
  function bindStaticCheckboxEvents() {
    document.querySelectorAll(".static-toggle").forEach(box => {
      box.addEventListener("change", e => {
        const id = e.target.dataset.id;
        const goals = loadGoals();
        const g = goals.find(goal => goal.id === id);
        if (g) {
          g.progress = e.target.checked ? 100 : 0;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
          renderTopGoals(); // Refresh rings
        }
      });
    });
  }

  /** Live update rings when localStorage changes (from goals.js) */
  window.addEventListener("storage", () => {
    renderTopGoals();
  });

  document.addEventListener("DOMContentLoaded", () => {
    renderTopGoals();
  });
})();
