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

  // -------- GOALS & RING --------
  const goalList = document.getElementById("goalList");
  let goals = JSON.parse(localStorage.getItem("goals")) || [
    { text: "Drink water", done: true },
    { text: "Jogging", done: false },
    { text: "Read", done: false },
  ];

  const renderGoals = () => {
    goalList.innerHTML = "";
    goals.forEach((goal, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <label class="d-flex align-items-center mb-2">
          <input type="checkbox" ${goal.done ? "checked" : ""} data-index="${i}" class="form-check-input me-2">
          <span>${goal.text}</span>
        </label>`;
      goalList.appendChild(li);
    });
    updateProgressRing();
  };

  goalList.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      const index = e.target.dataset.index;
      goals[index].done = e.target.checked;
      localStorage.setItem("goals", JSON.stringify(goals));
      updateProgressRing();
    }
  });

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
  // const ctx = document.getElementById("progressChart");
  // if (ctx) {
  //   new Chart(ctx, {
  //     type: "line",
  //     data: {
  //       labels: ["M", "T", "W", "T", "F", "S", "S"],
  //       datasets: [
  //         {
  //           data: [4, 6, 7, 8, 6, 8, 10],
  //           borderColor: "#00b4ff",
  //           tension: 0.4,
  //           fill: false,
  //         },
  //       ],
  //     },
  //     options: {
  //       plugins: { legend: { display: false } },
  //       scales: {
  //         y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" } },
  //         x: { grid: { color: "transparent" } },
  //       },
  //     },
  //   });
  // }

  // renderTasks();
  // renderNotes();
  // renderGoals();
});
