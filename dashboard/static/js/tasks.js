// dashboard/static/js/tasks.js

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();

  const addCustomBtn = document.getElementById("addCustomTaskBtn");
  const saveTasksBtn = document.getElementById("saveTasksBtn");

  if (addCustomBtn) {
    addCustomBtn.addEventListener("click", onAddCustomTask);
  }
  if (saveTasksBtn) {
    saveTasksBtn.addEventListener("click", onSaveTasks);
  }
});

// ------------ CSRF helper -------------
function getCSRF() {
  const name = "csrftoken=";
  const cookie = document.cookie.split("; ").find((row) => row.startsWith(name));
  return cookie ? cookie.split("=")[1] : "";
}
const csrftoken = getCSRF();

// ------------ State -------------
let popularData = [];
let savedTasks = [];
let stagedTitles = new Set();      // titles user wants saved
let customDraftTitles = new Set(); // new custom tasks not yet in DB

// ------------ Load from backend -------------
function loadTasks() {
  fetch("/api/tasks/list/")
    .then((res) => res.json())
    .then((data) => {
      popularData = data.popular || [];
      savedTasks = data.tasks || [];

      // initial staged set = titles of currently saved tasks
      stagedTitles = new Set(savedTasks.map((t) => t.title));
      customDraftTitles.clear();

      renderManageTab();
      renderSavedTab();
    })
    .catch((err) => console.error("Error loading tasks:", err));
}

// ------------ Manage tab rendering -------------

function renderManageTab() {
  const popularContainer = document.getElementById("popularTasksContainer");
  const customContainer = document.getElementById("customTasksContainer");
  if (!popularContainer || !customContainer) return;

  popularContainer.innerHTML = "";
  customContainer.innerHTML = "";

  // Popular tasks
  popularData.forEach((task) => {
    const title = task.title;
    const isSelected = stagedTitles.has(title);

    const col = document.createElement("div");
    col.className = "col-12";

    col.innerHTML = `
      <div class="task-item border rounded p-2 d-flex justify-content-between align-items-center">
        <span>${title}</span>
        <button
          type="button"
          class="btn btn-sm ${isSelected ? "btn-success" : "btn-outline-success"} task-select-btn"
          data-title="${title}"
        >
          ${isSelected ? "Selected" : "Select"}
        </button>
      </div>
    `;

    popularContainer.appendChild(col);
  });

  // Existing custom tasks from DB = saved tasks that are not in popular list
  const popularTitlesSet = new Set(popularData.map((p) => p.title));
  const customTitlesFromDB = new Set(
    savedTasks
      .map((t) => t.title)
      .filter((title) => !popularTitlesSet.has(title))
  );

  // Merge DB custom titles + drafts
  const allCustomTitles = new Set([...customTitlesFromDB, ...customDraftTitles]);

  allCustomTitles.forEach((title) => {
    const isSelected = stagedTitles.has(title);
    const col = document.createElement("div");
    col.className = "col-12";

    col.innerHTML = `
      <div class="task-item border rounded p-2 d-flex justify-content-between align-items-center">
        <span>${title}</span>
        <button
          type="button"
          class="btn btn-sm ${isSelected ? "btn-success" : "btn-outline-success"} task-select-btn"
          data-title="${title}"
        >
          ${isSelected ? "Selected" : "Select"}
        </button>
      </div>
    `;

    customContainer.appendChild(col);
  });

  // attach button handlers
  document.querySelectorAll(".task-select-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.dataset.title;
      toggleStagedTitle(title, btn);
    });
  });
}

function toggleStagedTitle(title, btn) {
  if (stagedTitles.has(title)) {
    stagedTitles.delete(title);
    btn.textContent = "Select";
    btn.classList.remove("btn-success");
    btn.classList.add("btn-outline-success");
  } else {
    stagedTitles.add(title);
    btn.textContent = "Selected";
    btn.classList.remove("btn-outline-success");
    btn.classList.add("btn-success");
  }
}

// ------------ Add custom task (staged only) -------------

function onAddCustomTask() {
  const input = document.getElementById("newTaskInput");
  if (!input) return;

  const title = (input.value || "").trim();
  if (!title) return;

  customDraftTitles.add(title);
  stagedTitles.add(title);
  input.value = "";
  renderManageTab();
}

// ------------ Save Tasks (write staged state to DB) -------------

function onSaveTasks() {
  const titles = Array.from(stagedTitles);
  if (titles.length === 0) {
    // if user cleared everything, we still sync to delete any existing tasks
    // (so allow empty list)
  }

  const params = new URLSearchParams();
  titles.forEach((t) => params.append("titles[]", t));

  fetch("/api/tasks/save-selection/", {
    method: "POST",
    headers: {
      "X-CSRFToken": csrftoken,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
    .then((res) => res.json())
    .then(() => {
      // after saving, reload from DB so Saved tab + Manage are fresh
      loadTasks();
    })
    .catch((err) => console.error("Error saving tasks:", err));
}

// ------------ Saved tab rendering -------------

function renderSavedTab() {
  const savedList = document.getElementById("savedTasksList");
  if (!savedList) return;

  savedList.innerHTML = "";

  if (savedTasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-group-item text-muted";
    empty.textContent = "No saved tasks yet. Select some from the Manage tab.";
    savedList.appendChild(empty);
    return;
  }

  savedTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "list-group-item";

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <label class="form-check-label mb-0">
          <input type="checkbox"
                 class="form-check-input me-2 saved-task-toggle"
                 data-id="${task.id}"
                 ${task.completed ? "checked" : ""}>
          ${task.title}
        </label>

        <button type="button"
                class="btn btn-danger btn-sm saved-task-remove"
                data-id="${task.id}">
          Remove
        </button>
      </div>
    `;

    savedList.appendChild(div);
  });

  // Toggle completion
  savedList.querySelectorAll(".saved-task-toggle").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      fetch(`/api/tasks/toggle/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
      })
        .then((res) => res.json())
        .then((data) => {
          // we could update local state; simpler to just reload saved list
          loadTasks();
        })
        .catch((err) =>
          console.error("Error toggling task from Saved tab:", err)
        );
    });
  });

  // Remove task
  savedList.querySelectorAll(".saved-task-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      fetch(`/api/tasks/delete/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
      })
        .then((res) => res.json())
        .then(() => {
          loadTasks();
        })
        .catch((err) =>
          console.error("Error deleting task from Saved tab:", err)
        );
    });
  });
}
