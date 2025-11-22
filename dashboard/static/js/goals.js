/* goals.js — v4 improved: selection highlighting, saved tab, drag-handle reorder,
   slider touch support, edit/delete buttons styled, no conflicting DOM listeners. */

(function () {
  const STORAGE_KEY = "productivity_goals_v4";

  const POPULAR = [
    { id: "g1", title: "Drink 8 glasses of water", type: "numeric" },
    { id: "g2", title: "Read 20 pages", type: "numeric" },
    { id: "g3", title: "Walk 2000 steps", type: "numeric" },
    { id: "g4", title: "Meditate 10 minutes", type: "static" },
    { id: "g5", title: "Sleep 8 hours", type: "static" },
    { id: "g6", title: "Limit screen time", type: "static" },
    { id: "g7", title: "Exercise 20 minutes", type: "numeric" },
    { id: "g8", title: "Plan tomorrow in advance", type: "static" },
    { id: "g9", title: "Practice gratitude", type: "static" },
    { id: "g10", title: "No junk food today", type: "static" },
    { id: "g11", title: "Spend 15 minutes cleaning", type: "static" },
    { id: "g12", title: "Spend time outdoors", type: "static" },
    { id: "g13", title: "Complete work task", type: "static" },
    { id: "g14", title: "Review finances", type: "static" },
    { id: "g15", title: "Call a friend or family member", type: "static" },
    { id: "g16", title: "Stretch for 10 minutes", type: "numeric" },
    { id: "g17", title: "Journal your thoughts", type: "static" },
    { id: "g18", title: "Cook a healthy meal", type: "static" },
    { id: "g19", title: "Declutter workspace", type: "static" },
    { id: "g20", title: "Practice mindfulness", type: "static" },
  ];

  // Persist / read
  function loadGoals() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = POPULAR.map((g, i) => ({ ...g, selected: false, progress: 0, order: i }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    let parsed = [];
    try { parsed = JSON.parse(raw); } catch (e) { parsed = []; }

    // Inject any newly added popular items (keeps existing user data)
    const ids = new Set(parsed.map(g => g.id));
    POPULAR.forEach((pg, idx) => {
      if (!ids.has(pg.id)) parsed.push({ ...pg, selected: false, progress: 0, order: parsed.length });
    });

    // canonical ordering if missing order
    parsed.forEach((g, i) => { if (g.order === undefined) g.order = i; });
    return parsed;
  }

  function saveGoals(goals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    window.dispatchEvent(new CustomEvent("goals:updated", { detail: { goals } }));
  }

  // Toggle selection (popular pill)
  function toggleGoal(id) {
    const goals = loadGoals();
    const g = goals.find(x => x.id === id);
    if (!g) return;
    g.selected = !g.selected;
    if (g.selected && g.order === undefined) {
      g.order = goals.length;
    }
    saveGoals(goals);
    renderPopularGoals();
    renderSavedGoals();
  }

  // Render popular pills (grid)
  function renderPopularGoals() {
    const container = document.getElementById("popularGoalsContainer");
    if (!container) return;
    const goals = loadGoals();
    container.innerHTML = "";
    POPULAR.forEach(pg => {
      const stored = goals.find(g => g.id === pg.id);
      const active = stored && stored.selected ? "active" : "";
      const col = document.createElement("div");
      col.className = "col-6 col-md-3";
      const pill = document.createElement("div");
      pill.className = `goal-pill ${active}`;
      pill.textContent = pg.title;
      pill.dataset.id = pg.id;
      pill.addEventListener("click", () => toggleGoal(pg.id));
      col.appendChild(pill);
      container.appendChild(col);
    });
  }

  // Render custom goals in management area
  function renderCustomGoals() {
    const container = document.getElementById("customGoalsContainer");
    if (!container) return;
    const goals = loadGoals().filter(g => g.id.startsWith("custom_"));
    container.innerHTML = "";
    goals.forEach(goal => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-3";
      const pill = document.createElement("div");
      pill.className = "goal-pill active d-flex justify-content-between align-items-center";
      pill.innerHTML = `<span>${goal.title}</span>`;
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-danger ms-2";
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        const all = loadGoals().filter(g => g.id !== goal.id);
        saveGoals(all);
        renderCustomGoals();
        renderSavedGoals();
        renderPopularGoals();
      });
      pill.appendChild(btn);
      col.appendChild(pill);
      container.appendChild(col);
    });
  }

  // Add custom goal
  function bindAddCustom() {
    const btn = document.getElementById("addCustomBtn");
    const input = document.getElementById("newGoalText");
    const typeSel = document.getElementById("newGoalType");
    if (!btn || !input || !typeSel) return;
    btn.addEventListener("click", () => {
      const txt = input.value.trim();
      if (!txt) { alert("Please enter a goal title."); return; }
      const goals = loadGoals();
      const id = "custom_" + Date.now();
      goals.push({ id, title: txt, type: typeSel.value, selected: true, progress: 0, order: (goals.length) });
      saveGoals(goals);
      input.value = "";
      renderCustomGoals();
      renderPopularGoals();
      renderSavedGoals();
    });
  }

  // Save explicit button (keeps localStorage in sync)
  function bindSaveButton() {
    const btn = document.getElementById("saveGoalsBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // Already saved on changes, but keep for user reassurance
      const goals = loadGoals();
      saveGoals(goals);
      alert("Goals saved locally.");
    });
  }

  // Saved goals tab list (reorderable + edit + delete + slider/checkbox)
  function renderSavedGoals() {
    const list = document.getElementById("savedGoalsList");
    if (!list) return;
    const all = loadGoals();
    const goals = all.filter(g => g.selected).sort((a,b) => (a.order||0) - (b.order||0));
    list.innerHTML = "";

    goals.forEach(goal => {
      const item = document.createElement("div");
      item.className = "list-group-item bg-transparent text-light border-secondary mb-2 d-flex align-items-center justify-content-between";
      item.dataset.id = goal.id;

      // Left: title + drag handle
      const left = document.createElement("div");
      left.className = "d-flex align-items-center gap-3";
      const handle = document.createElement("div");
      handle.className = "drag-handle px-2 py-1";
      handle.title = "Drag to reorder";
      handle.innerHTML = "☰";
      left.appendChild(handle);
      const title = document.createElement("strong");
      title.textContent = goal.title;
      left.appendChild(title);

      // Right: control + buttons
      const right = document.createElement("div");
      right.className = "d-flex align-items-center gap-2";

      // control: slider or checkbox
      if (goal.type === "numeric") {
        const range = document.createElement("input");
        range.type = "range";
        range.min = "0";
        range.max = "100";
        range.value = goal.progress || 0;
        range.className = "form-range small-range";
        range.style.width = "160px";
        const pct = document.createElement("div");
        pct.className = "ms-2 fw-semibold slider-value";
        pct.textContent = (goal.progress || 0) + "%";

        // update handlers
        range.addEventListener("input", (e) => {
          pct.textContent = e.target.value + "%";
          goal.progress = parseInt(e.target.value, 10);
          saveGoals(all);
          window.dispatchEvent(new CustomEvent("goals:updated", { detail: { goals: all } }));
        });

        right.appendChild(range);
        right.appendChild(pct);
      } else {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = (goal.progress === 100);
        cb.className = "form-check-input";
        cb.addEventListener("change", (e) => {
          goal.progress = e.target.checked ? 100 : 0;
          saveGoals(all);
          window.dispatchEvent(new CustomEvent("goals:updated", { detail: { goals: all } }));
        });
        right.appendChild(cb);
      }

      // Edit + Delete (styled buttons)
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-secondary edit-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        const newTitle = prompt("Edit goal title:", goal.title);
        if (newTitle) {
          goal.title = newTitle.trim();
          saveGoals(all);
          renderSavedGoals();
          renderPopularGoals();
        }
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-outline-danger delete-btn";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        // unselect instead of removing from list
        goal.selected = false;
        saveGoals(all);
        renderSavedGoals();
        renderPopularGoals();
      });

      right.appendChild(editBtn);
      right.appendChild(delBtn);

      item.appendChild(left);
      item.appendChild(right);

      // Drag & drop — only allow drag when dragging from handle.
      item.draggable = true;
      item.addEventListener("dragstart", (e) => {
        // only allow drag if origin is handle
        if (!e.target || !e.target.closest) return;
        // determine if the user started dragging from the handle element
        const origin = e.target;
        const pathTarget = e.path || (e.composedPath && e.composedPath()) || [];
        // check if a drag-handle exists in path
        const startedFromHandle = pathTarget.some(node => node && node.classList && node.classList && node.classList.contains && node.classList.contains('drag-handle'));
        if (!startedFromHandle) {
          // cancel drag
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("text/plain", goal.id);
        // small visual
        item.classList.add('dragging');
      });

      item.addEventListener("dragend", () => item.classList.remove('dragging'));

      list.addEventListener("dragover", (e) => e.preventDefault());
      list.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        const target = e.target.closest(".list-group-item");
        if (!draggedId || !target) return;
        const targetId = target.dataset.id;
        if (!targetId || draggedId === targetId) return;

        // reorder in goals array
        const full = loadGoals().filter(g => g.selected);
        full.sort((a,b) => (a.order||0) - (b.order||0));
        const draggedIdx = full.findIndex(g => g.id === draggedId);
        const targetIdx = full.findIndex(g => g.id === targetId);
        if (draggedIdx < 0 || targetIdx < 0) return;
        const [dragged] = full.splice(draggedIdx, 1);
        full.splice(targetIdx, 0, dragged);
        // write back orders into the main storage array
        const allGoals = loadGoals();
        full.forEach((g, i) => {
          const master = allGoals.find(m => m.id === g.id);
          if (master) master.order = i;
        });
        saveGoals(allGoals);
        renderSavedGoals();
      });

      list.appendChild(item);
    });

    // If no saved goals
    if (goals.length === 0) {
      list.innerHTML = `<div class="text-muted">No saved goals yet — pick some from Popular Goals.</div>`;
    }
  }

  // Initialize everything once
  document.addEventListener("DOMContentLoaded", () => {
    renderPopularGoals();
    renderCustomGoals();
    bindAddCustom();
    bindSaveButton();
    renderSavedGoals();
  });

  // React to external updates (home page may listen to this)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      renderPopularGoals();
      renderCustomGoals();
      renderSavedGoals();
    }
  });

})();

