// static/js/goals.js

document.addEventListener("DOMContentLoaded", () => {
  // Only run on the Goals page
  const popularContainer = document.getElementById("popularGoalsContainer");
  const customContainer = document.getElementById("customGoalsContainer");
  const savedList = document.getElementById("savedGoalsList");

  if (!popularContainer || !customContainer || !savedList) {
    return;
  }

  // -----------------------------
  // CSRF helper
  // -----------------------------
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  }
  const csrftoken = getCookie("csrftoken");

  // -----------------------------
  // State
  // -----------------------------
  let POPULAR = [];
  let CUSTOM = [];
  let SAVED = [];

  // -----------------------------
  // Load from backend
  // -----------------------------
  async function loadGoals() {
    try {
      const res = await fetch("/api/goals/data/");
      const data = await res.json();

      POPULAR = data.popular || [];
      CUSTOM = data.custom || [];
      SAVED = data.saved || [];

      renderPopular();
      renderCustom();
      renderSaved();
    } catch (err) {
      console.error("Error loading goals:", err);
    }
  }

  // -----------------------------
  // Render Popular Goals (ALL)
  // -----------------------------
  function renderPopular() {
    popularContainer.innerHTML = "";

    if (!POPULAR.length) {
      popularContainer.innerHTML =
        '<p class="text-muted">No popular goals available.</p>';
      return;
    }

    POPULAR.forEach((g) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 mb-2";

      // 🔥 FIXED: Button MUST reflect selected state!
      col.innerHTML = `
        <button class="btn w-100 goal-select ${
          g.selected ? "btn-success" : "btn-outline-secondary"
        }" data-id="${g.id}">
          ${g.selected ? "✓ " : ""}${g.title}
        </button>
      `;

      popularContainer.appendChild(col);
    });
  }

  // -----------------------------
  // Render Custom Goals (ALL)
  // -----------------------------
  function renderCustom() {
    customContainer.innerHTML = "";

    if (!CUSTOM.length) {
      customContainer.innerHTML =
        '<p class="text-muted">No custom goals yet — add one below.</p>';
      return;
    }

    CUSTOM.forEach((g) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 mb-2";

      // 🔥 FIXED: Selected → green + checkmark
      col.innerHTML = `
        <button class="btn w-100 goal-select ${
          g.selected ? "btn-success" : "btn-outline-secondary"
        }" data-id="${g.id}">
          ${g.selected ? "✓ " : ""}${g.title}
        </button>
      `;

      customContainer.appendChild(col);
    });
  }

  // -----------------------------
  // Render Saved Goals
  // -----------------------------
  function renderSaved() {
    savedList.innerHTML = "";

    if (!SAVED.length) {
      const empty = document.createElement("div");
      empty.className =
        "list-group-item bg-transparent text-muted text-center border-secondary";
      empty.textContent = "No saved goals yet — choose some on the first tab.";
      savedList.appendChild(empty);
      return;
    }

    const sorted = [...SAVED].sort((a, b) => a.order - b.order);

    sorted.forEach((g, idx) => {
      const row = document.createElement("div");
      row.className =
        "list-group-item bg-dark text-light d-flex justify-content-between align-items-center draggable-goal";
      row.dataset.id = g.id;

      if (idx < 5) row.classList.add("top-five-highlight");

      let controlHtml = "";

      if (g.goal_type === "progress") {
        const progress = g.progress ?? 0;
        controlHtml = `
          <div class="d-flex align-items-center gap-2">
            <input type="range" min="0" max="100" step="10"
                   value="${progress}"
                   class="form-range goal-progress"
                   data-id="${g.id}">
            <span class="badge bg-info progress-label" data-id="${g.id}">
              ${progress}%
            </span>
          </div>
        `;
      } else {
        controlHtml = `
          <div class="form-check me-2">
            <input type="checkbox"
                   class="form-check-input goal-check"
                   data-id="${g.id}"
                   ${g.completed ? "checked" : ""}>
          </div>
        `;
      }

      row.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-grip-vertical drag-handle me-1"></i>
          <strong>${g.title}</strong>
        </div>

        <div class="d-flex align-items-center gap-2">
          ${controlHtml}
          <button class="btn btn-sm btn-outline-danger goal-delete" data-id="${g.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;

      savedList.appendChild(row);
    });

    enableDragAndDrop();
  }

  // -----------------------------
  // Toggle selection
  // -----------------------------
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".goal-select");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    try {
      await fetch(`/api/goals/toggle/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
      });

      await loadGoals();
    } catch (err) {
      console.error("Error toggling goal selection:", err);
    }
  });

  // -----------------------------
  // Add custom goal
  // -----------------------------
  const addBtn = document.getElementById("addCustomBtn");
  const titleInput = document.getElementById("newGoalText");
  const typeSelect = document.getElementById("newGoalType");

  if (addBtn && titleInput && typeSelect) {
    addBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      if (!title) return;

      const goalType = typeSelect.value || "static";

      try {
        await fetch("/api/goals/create/", {
          method: "POST",
          headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ title, goal_type: goalType }),
        });

        titleInput.value = "";
        await loadGoals();
      } catch (err) {
        console.error("Error creating goal:", err);
      }
    });
  }

  // -----------------------------
  // Update progress
  // -----------------------------
  document.addEventListener("input", async (e) => {
    const slider = e.target.closest(".goal-progress");
    if (!slider) return;

    const id = slider.dataset.id;
    const progress = slider.value;

    const label = savedList.querySelector(`.progress-label[data-id="${id}"]`);
    if (label) label.textContent = `${progress}%`;

    if (parseInt(progress) === 100 && typeof confetti === "function") {
      confetti({ particleCount: 60, spread: 70 });
    }

    try {
      await fetch(`/api/goals/progress/${id}/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrftoken,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ progress }),
      });
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  });

  // -----------------------------
  // Toggle static goal completion
  // -----------------------------
  document.addEventListener("change", async (e) => {
    const check = e.target.closest(".goal-check");
    if (!check) return;

    const id = check.dataset.id;
    const completed = check.checked ? "1" : "0";

    try {
      await fetch(`/api/goals/progress/${id}/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrftoken,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ completed }),
      });
    } catch (err) {
      console.error("Error toggling static goal:", err);
    }
  });

  // -----------------------------
  // Delete
  // -----------------------------
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".goal-delete");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (!confirm("Remove this goal? You can re-add it later.")) return;

    try {
      await fetch(`/api/goals/delete/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
      });

      await loadGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  });

  // -----------------------------
  // Drag and drop reorder
  // -----------------------------
  function enableDragAndDrop() {
    const rows = savedList.querySelectorAll(".draggable-goal");

    rows.forEach((row) => {
      row.draggable = true;

      row.addEventListener("dragstart", () => {
        row.classList.add("dragging");
      });

      row.addEventListener("dragend", async () => {
        row.classList.remove("dragging");

        const ids = [...savedList.querySelectorAll(".draggable-goal")].map(
          (el) => el.dataset.id
        );

        try {
          await fetch("/api/goals/reorder/", {
            method: "POST",
            headers: {
              "X-CSRFToken": csrftoken,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(ids.map((id) => ["order[]", id])),
          });
        } catch (err) {
          console.error("Error reordering goals:", err);
        }
      });
    });

    savedList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const after = getDragAfterElement(savedList, e.clientY);
      const dragging = savedList.querySelector(".dragging");
      if (!dragging) return;

      if (!after) savedList.appendChild(dragging);
      else savedList.insertBefore(dragging, after);
    });
  }

  function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll(".draggable-goal:not(.dragging)")];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

    els.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        closest = { offset, element: child };
      }
    });

    return closest.element;
  }

  // -----------------------------
  // Save button glow
  // -----------------------------
  const saveBtn = document.getElementById("saveGoalsBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      await loadGoals();
      saveBtn.textContent = "Saved ✓";
      setTimeout(() => (saveBtn.textContent = "Save Goals"), 1500);
    });
  }

  // Initial load
  loadGoals();
});
