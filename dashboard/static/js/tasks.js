// ===============================
// TASKS PAGE (manage + saved)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const popularContainer = document.getElementById("popularTasksContainer");
  const customContainer = document.getElementById("customTasksContainer");
  const savedList = document.getElementById("savedTasksList");

  const newTaskInput = document.getElementById("newTaskInput");
  const addCustomTaskBtn = document.getElementById("addCustomTaskBtn");
  const saveTasksBtn = document.getElementById("saveTasksBtn");

  if (!popularContainer || !customContainer || !savedList) {
    // Not on tasks page
    return;
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }
  const csrftoken = getCookie("csrftoken");

  let POPULAR_META = [];
  let CUSTOM_LOCAL = []; // {title}
  let CURRENT_TASKS = []; // from backend
  let selectionTitles = new Set(); // titles selected in Manage tab

  function isSelectedTitle(title) {
    return selectionTitles.has(title);
  }

  // -------- Load from backend --------
  async function loadTasks() {
    const res = await fetch("/api/tasks/list/");
    const data = await res.json();

    CURRENT_TASKS = data.tasks || [];
    POPULAR_META = data.popular || [];

    const popularTitles = new Set(POPULAR_META.map((p) => p.title));

    if (Array.isArray(data.custom)) {
      CUSTOM_LOCAL = data.custom.map((t) => ({ title: t.title }));
    } else {
      CUSTOM_LOCAL = CURRENT_TASKS.filter((t) => !popularTitles.has(t.title)).map(
        (t) => ({ title: t.title })
      );
    }

    selectionTitles = new Set(CURRENT_TASKS.map((t) => t.title));

    renderManage();
    renderSaved();
  }

  // -------- Manage tab --------
  function renderManage() {
    renderPopular();
    renderCustom();
  }

  function renderPopular() {
    popularContainer.innerHTML = "";

    POPULAR_META.forEach((p) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 mb-2";

      const selected = isSelectedTitle(p.title);

      col.innerHTML = `
        <button class="btn w-100 task-select ${selected ? "btn-success" : "btn-outline-secondary"}"
                data-title="${p.title}">
          ${selected ? "✓ " : ""}${p.title}
        </button>
      `;
      popularContainer.appendChild(col);
    });
  }

  function renderCustom() {
    customContainer.innerHTML = "";

    if (!CUSTOM_LOCAL.length) {
      const small = document.createElement("small");
      small.className = "text-muted";
      small.textContent = "No custom tasks yet.";
      customContainer.appendChild(small);
      return;
    }

    CUSTOM_LOCAL.forEach((t) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 mb-2";

      const selected = isSelectedTitle(t.title);

      col.innerHTML = `
        <button class="btn w-100 task-select ${selected ? "btn-success" : "btn-outline-secondary"}"
                data-title="${t.title}">
          ${selected ? "✓ " : ""}${t.title}
        </button>
      `;
      customContainer.appendChild(col);
    });
  }

  // -------- Saved tab --------
  function renderSaved() {
    savedList.innerHTML = "";

    if (!CURRENT_TASKS.length) {
      const p = document.createElement("p");
      p.className = "text-muted";
      p.textContent = "No saved tasks yet — select some on the Manage Tasks tab and hit Save.";
      savedList.appendChild(p);
      return;
    }

    CURRENT_TASKS.sort((a, b) => a.order - b.order);

    CURRENT_TASKS.forEach((t, idx) => {
      const row = document.createElement("div");
      row.className =
        "list-group-item bg-dark text-light d-flex justify-content-between align-items-center";

      if (idx < 5) {
        row.classList.add("top-five-highlight");
      }

      row.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <input type="checkbox"
                 class="form-check-input saved-task-toggle"
                 data-id="${t.id}" ${t.completed ? "checked" : ""}>
          <span class="saved-task-title ${t.completed ? "text-decoration-line-through text-muted" : ""}">
            ${t.title}
          </span>
        </div>
        <button class="btn btn-sm btn-outline-danger saved-task-delete" data-id="${t.id}">
          <i class="bi bi-trash"></i>
        </button>
      `;

      savedList.appendChild(row);
    });
  }

  // -------- Select / unselect (Manage) --------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".task-select");
    if (!btn) return;

    const title = btn.dataset.title;
    if (!title) return;

    if (selectionTitles.has(title)) {
      selectionTitles.delete(title);
    } else {
      selectionTitles.add(title);
    }

    renderManage();
  });

  // -------- Add custom task (local) --------
  addCustomTaskBtn?.addEventListener("click", () => {
    const title = newTaskInput.value.trim();
    if (!title) return;

    if (selectionTitles.has(title) || CUSTOM_LOCAL.some((t) => t.title === title)) {
      newTaskInput.value = "";
      return;
    }

    CUSTOM_LOCAL.push({ title });
    selectionTitles.add(title);
    newTaskInput.value = "";
    renderManage();
  });

  // -------- Save selection → backend --------
  saveTasksBtn?.addEventListener("click", async () => {
    const form = new URLSearchParams();

    POPULAR_META.forEach((p) => {
      if (selectionTitles.has(p.title)) {
        form.append("titles[]", p.title);
      }
    });

    CUSTOM_LOCAL.forEach((c) => {
      if (selectionTitles.has(c.title)) {
        form.append("titles[]", c.title);
      }
    });

    await fetch("/api/tasks/save-selection/", {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    loadTasks();
  });

  // -------- Saved tab: toggle complete --------
  savedList.addEventListener("change", async (e) => {
    const checkbox = e.target.closest(".saved-task-toggle");
    if (!checkbox) return;

    const id = checkbox.dataset.id;
    const row = checkbox.closest(".list-group-item");
    const titleSpan = row.querySelector(".saved-task-title");

    const completed = checkbox.checked;
    if (titleSpan) {
      if (completed) {
        titleSpan.classList.add("text-decoration-line-through", "text-muted");
      } else {
        titleSpan.classList.remove("text-decoration-line-through", "text-muted");
      }
    }

    await fetch(`/api/tasks/toggle/${id}/`, {
      method: "POST",
      headers: { "X-CSRFToken": csrftoken },
    });
  });

  // -------- Saved tab: delete --------
  savedList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".saved-task-delete");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!window.confirm("Delete this task?")) return;

    await fetch(`/api/tasks/delete/${id}/`, {
      method: "POST",
      headers: { "X-CSRFToken": csrftoken },
    });

    loadTasks();
  });

  // Initial load
  loadTasks();
});
