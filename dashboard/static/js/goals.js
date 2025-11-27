// dashboard/static/js/goals.js

document.addEventListener("DOMContentLoaded", () => {
  loadGoals();

  const addBtn = document.getElementById("addCustomBtn");
  const saveBtn = document.getElementById("saveGoalsBtn");

  if (addBtn) addBtn.addEventListener("click", handleAddCustomGoal);
  if (saveBtn) saveBtn.addEventListener("click", saveGoalSelection);
});

/* ---------------- CSRF Helper ---------------- */

function getCSRF() {
  const name = "csrftoken=";
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(name))
    ?.substring(name.length) || "";
}

const csrftoken = getCSRF();

/* ---------------- State ---------------- */

let popularGoals = [];
let customGoals = [];
let savedGoals = [];

let stagedSelectedIds = new Set(); // user selection staging
let stagedCustomDrafts = []; // unsaved custom goals

/* ---------------- Load DB + Popular Goals ---------------- */

function loadGoals() {
  fetch("/api/goals/data/")
    .then((res) => res.json())
    .then((data) => {
      popularGoals = data.popular;
      customGoals = data.custom;
      savedGoals = data.saved;

      stagedSelectedIds = new Set(savedGoals.map((g) => g.id));

      renderManageTab();
      renderSavedTab();
    })
    .catch((err) => console.error("Failed loading goals:", err));
}

/* ---------------- Manage Tab Rendering ---------------- */

function renderManageTab() {
  const pop = document.getElementById("popularGoalsContainer");
  const custom = document.getElementById("customGoalsContainer");

  if (!pop || !custom) return;

  pop.innerHTML = "";
  custom.innerHTML = "";

  // ✅ Popular
  popularGoals.forEach((goal) => {
    const isSelected = stagedSelectedIds.has(goal.id);

    const div = document.createElement("div");
    div.className = "col-12";
    div.innerHTML = `
      <div class="goal-item border rounded p-2 d-flex justify-content-between align-items-center">
        <span>${goal.title}</span>
        <button class="btn btn-sm ${
          isSelected ? "btn-success" : "btn-outline-success"
        } goal-select-btn" data-id="${goal.id}">
          ${isSelected ? "Selected" : "Select"}
        </button>
      </div>
    `;
    pop.appendChild(div);
  });

  // ✅ Custom existing DB goals
  customGoals.forEach((goal) => {
    const isSelected = stagedSelectedIds.has(goal.id);

    const div = document.createElement("div");
    div.className = "col-12";
    div.innerHTML = `
      <div class="goal-item border rounded p-2 d-flex justify-content-between align-items-center">
        <span>${goal.title}</span>
        <button class="btn btn-sm ${
          isSelected ? "btn-success" : "btn-outline-success"
        } goal-select-btn" data-id="${goal.id}">
          ${isSelected ? "Selected" : "Select"}
        </button>
      </div>
    `;
    custom.appendChild(div);
  });

  // ✅ Custom drafts (not DB yet)
  stagedCustomDrafts.forEach((goal, index) => {
    const div = document.createElement("div");
    div.className = "col-12";
    div.innerHTML = `
      <div class="goal-item border rounded p-2 d-flex justify-content-between align-items-center">
        <span>${goal.title} (custom)</span>
        <button class="btn btn-sm btn-success" data-draft="${index}">
          Selected
        </button>
      </div>
    `;
    custom.appendChild(div);
  });

  document.querySelectorAll(".goal-select-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleStaging(btn.dataset.id, btn));
  });
}

function toggleStaging(id, btn) {
  const numericId = Number(id);

  if (stagedSelectedIds.has(numericId)) {
    stagedSelectedIds.delete(numericId);
    btn.textContent = "Select";
    btn.classList.remove("btn-success");
    btn.classList.add("btn-outline-success");
  } else {
    stagedSelectedIds.add(numericId);
    btn.textContent = "Selected";
    btn.classList.remove("btn-outline-success");
    btn.classList.add("btn-success");
  }
}

/* ---------------- Custom Goal Creation ---------------- */

function handleAddCustomGoal() {
  const input = document.getElementById("newGoalText");
  const type = document.getElementById("newGoalType");

  const title = input.value.trim();
  const goal_type = type.value;

  if (!title) return;

  stagedCustomDrafts.push({ title, goal_type });
  stagedSelectedIds.add(`draft-${stagedCustomDrafts.length - 1}`);

  input.value = "";
  renderManageTab();
}

/* ---------------- Save Button — DB Write ---------------- */

function saveGoalSelection() {
  const ids = Array.from(stagedSelectedIds).filter(
    (id) => typeof id === "number"
  );

  const customTitles = stagedCustomDrafts.map((g) => g.title);

  const params = new URLSearchParams();
  ids.forEach((id) => params.append("goal_ids[]", id));
  customTitles.forEach((t) => params.append("custom_titles[]", t));

  fetch("/api/goals/save-selection/", {
    method: "POST",
    headers: {
      "X-CSRFToken": csrftoken,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
    .then((res) => res.json())
    .then(() => {
      stagedCustomDrafts = [];
      loadGoals();
    })
    .catch((err) => console.error("Failed to save goals:", err));
}

/* ---------------- Saved Tab Rendering ---------------- */

function renderSavedTab() {
  const list = document.getElementById("savedGoalsList");
  if (!list) return;

  list.innerHTML = "";

  if (savedGoals.length === 0) {
    list.innerHTML = `<p class="text-muted">No saved goals yet — add some above.</p>`;
    return;
  }

  savedGoals.forEach((goal) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item bg-dark text-light d-flex justify-content-between align-items-center";

    // ✅ Progress goals — slider
    if (goal.goal_type === "progress") {
      item.innerHTML = `
        <strong>${goal.title}</strong>
        <div class="d-flex align-items-center gap-2">
          <input type="range" class="form-range saved-progress"
            min="0" max="100" step="10"
            value="${goal.progress}" data-id="${goal.id}">
          <span class="progress-label">${goal.progress}%</span>
          <button class="btn btn-sm btn-outline-danger goal-delete-btn" data-id="${goal.id}">✕</button>
        </div>
      `;
    }

    // ✅ Static — checkbox
    else {
      item.innerHTML = `
        <div class="form-check d-flex align-items-center gap-2">
          <input type="checkbox" class="form-check-input saved-goal-toggle"
            data-id="${goal.id}" ${goal.completed ? "checked" : ""}>
          <label class="form-check-label">${goal.title}</label>
        </div>
        <button class="btn btn-sm btn-outline-danger goal-delete-btn" data-id="${goal.id}">✕</button>
      `;
    }

    list.appendChild(item);
  });

  // ✅ attach handlers
  document.querySelectorAll(".saved-goal-toggle").forEach((cb) =>
    cb.addEventListener("change", () => toggleGoalCompletion(cb.dataset.id))
  );

  document.querySelectorAll(".saved-progress").forEach((slider) => {
    slider.addEventListener(
      "input",
      () => (slider.nextElementSibling.textContent = `${slider.value}%`)
    );

    slider.addEventListener("change", () =>
      updateGoalProgress(slider.dataset.id, slider.value)
    );
  });

  document.querySelectorAll(".goal-delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => deleteGoal(btn.dataset.id))
  );
}

/* ---------------- API Actions ---------------- */

function toggleGoalCompletion(id) {
  fetch(`/api/goals/toggle/${id}/`, {
    method: "POST",
    headers: { "X-CSRFToken": csrftoken },
  }).catch((err) => console.error("Toggle failed:", err));
}

function updateGoalProgress(id, value) {
  const form = new FormData();
  form.append("progress", value);

  fetch(`/api/goals/progress/${id}/`, {
    method: "POST",
    headers: { "X-CSRFToken": csrftoken },
    body: form,
  }).catch((err) => console.error("Progress update failed:", err));
}

function deleteGoal(id) {
  fetch(`/api/goals/delete/${id}/`, {
    method: "POST",
    headers: { "X-CSRFToken": csrftoken },
  })
    .then(() => loadGoals())
    .catch((err) => console.error("Delete failed:", err));
}
