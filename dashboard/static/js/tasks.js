// static/js/tasks.js
(function () {
  const STORAGE_KEY = "productivity_tasks_v1";

  const POPULAR = [
    "Walk the dog",
    "Make the bed",
    "Do the dishes",
    "Check emails",
    "Go for a run",
    "Water the plants",
    "Plan meals",
    "Clean the kitchen",
    "Read for 20 minutes",
    "Call a family member",
    "Meditate",
    "Take vitamins",
    "Do laundry",
    "Tidy workspace",
    "Pay bills"
  ];

  // Helpers - storage
  function loadTasksRaw() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function seedTasks() {
    // seed structure: { id, title, selected(bool), completed(bool), order(int), custom(bool) }
    const seeded = POPULAR.map((t, i) => ({
      id: `p${i + 1}`,
      title: t,
      selected: false,
      completed: false,
      order: i,
      custom: false
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function loadTasks() {
    const raw = loadTasksRaw();
    if (!raw) return seedTasks();
    // ensure all popular items exist if user storage older
    const existingIds = new Set(raw.map(x => x.id));
    let changed = false;
    POPULAR.forEach((t, i) => {
      const id = `p${i + 1}`;
      if (!existingIds.has(id)) {
        raw.push({ id, title: t, selected: false, completed: false, order: raw.length, custom: false });
        changed = true;
      }
    });
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    return raw;
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    // notify other parts of the app (dashboard) to refresh top-5
    window.dispatchEvent(new CustomEvent('tasks:updated', { detail: { tasks } }));
  }

  // DOM render helpers
  function createPill(task) {
    const wrapper = document.createElement('div');
    wrapper.className = 'col-md-3 col-sm-6';
    const activeClass = task.selected ? 'active' : '';
    wrapper.innerHTML = `<div class="goal-pill task-pill ${activeClass}" data-id="${task.id}">${escapeHtml(task.title)}</div>`;
    const pill = wrapper.querySelector('.task-pill');
    pill.addEventListener('click', () => {
      toggleSelect(task.id);
    });
    return wrapper;
  }

  function escapeHtml(s){ return s.replace(/[&<>"'`]/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;' }[m])); }

  // Manage actions
  function toggleSelect(id) {
    const tasks = loadTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.selected = !t.selected;
    if (t.selected && typeof t.order !== 'number') t.order = tasks.length;
    saveTasks(tasks);
    renderManage();
    renderSaved();
  }

  function renderManage() {
    const container = document.getElementById('popularTasksContainer');
    const customContainer = document.getElementById('customTasksContainer');
    if (!container || !customContainer) return;

    const tasks = loadTasks();
    container.innerHTML = '';
    customContainer.innerHTML = '';

    // Popular (by POPULAR order)
    POPULAR.forEach((title, idx) => {
      const id = `p${idx + 1}`;
      const task = tasks.find(t => t.id === id) || { id, title, selected: false };
      container.appendChild(createPill(task));
    });

    // Custom (any tasks with custom===true)
    tasks.filter(t => t.custom).forEach(t => {
      const wrapper = document.createElement('div');
      wrapper.className = 'col-md-3 col-sm-6';
      wrapper.innerHTML = `
        <div class="goal-pill d-flex justify-content-between align-items-center" data-id="${t.id}">
          <span>${escapeHtml(t.title)}</span>
          <button class="btn btn-sm btn-outline-danger ms-2 remove-custom" data-id="${t.id}">✕</button>
        </div>
      `;
      wrapper.querySelector('.remove-custom').addEventListener('click', (e) => {
        e.stopPropagation();
        removeCustom(t.id);
      });
      // clicking the pill toggles selection
      wrapper.querySelector('.goal-pill').addEventListener('click', () => toggleSelect(t.id));
      customContainer.appendChild(wrapper);
    });
  }

  function addCustomTask(text) {
    if (!text) return;
    const tasks = loadTasks();
    const id = 'c' + Date.now();
    tasks.push({ id, title: text, selected: true, completed: false, order: tasks.length, custom: true });
    saveTasks(tasks);
    renderManage();
    renderSaved();
  }

  function removeCustom(id) {
    let tasks = loadTasks();
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(tasks);
    renderManage();
    renderSaved();
  }

  // Saved tab
  function renderSaved() {
    const list = document.getElementById('savedTasksList');
    if (!list) return;
    const tasks = loadTasks().filter(t => t.selected).sort((a,b) => (a.order||0)-(b.order||0));
    list.innerHTML = '';

    if (tasks.length === 0) {
      list.innerHTML = `<div class="list-group-item bg-transparent text-muted">No saved tasks — pick some from Manage.</div>`;
      return;
    }

    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center mb-2';
      item.draggable = true;
      item.dataset.id = task.id;

      item.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          <input class="form-check-input saved-task-toggle" type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
          <div>${escapeHtml(task.title)}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-danger remove-saved" data-id="${task.id}">Remove</button>
        </div>
      `;

      // checkbox handler
      item.querySelector('.saved-task-toggle').addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const all = loadTasks();
        const t = all.find(x => x.id === id);
        if (!t) return;
        t.completed = e.target.checked;
        saveTasks(all);
        // let dashboard update via event
      });

      // remove handler (unselect)
      item.querySelector('.remove-saved').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const all = loadTasks();
        const t = all.find(x => x.id === id);
        if (!t) return;
        t.selected = false;
        saveTasks(all);
        renderManage();
        renderSaved();
      });

      // drag events for reorder
      item.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', task.id);
        ev.dataTransfer.effectAllowed = 'move';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));

      list.appendChild(item);
    });

    // drop handling on container (allow reordering)
    list.addEventListener('dragover', (ev) => ev.preventDefault());
    list.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const draggedId = ev.dataTransfer.getData('text/plain');
      const target = ev.target.closest('.list-group-item');
      if (!target) return;
      const targetId = target.dataset.id;
      if (!draggedId || !targetId || draggedId === targetId) return;

      let all = loadTasks();
      const saved = all.filter(t => t.selected).sort((a,b) => (a.order||0)-(b.order||0));
      const draggedIdx = saved.findIndex(s => s.id === draggedId);
      const targetIdx = saved.findIndex(s => s.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return;

      const [dragged] = saved.splice(draggedIdx, 1);
      saved.splice(targetIdx, 0, dragged);

      // write back order for just saved items; keep others unchanged
      let orderCounter = 0;
      saved.forEach(s => {
        const t = all.find(x => x.id === s.id);
        if (t) {
          t.order = orderCounter++;
        }
      });

      saveTasks(all);
      renderSaved();
      renderManage();
    });
  }

  // top-5 convenience event (dashboard listens)
  function notifyDashboard() {
    const all = loadTasks();
    window.dispatchEvent(new CustomEvent('tasks:updated', { detail: { tasks: all } }));
  }

  // bindings
  function bindUI() {
    const addBtn = document.getElementById('addCustomTaskBtn');
    const input = document.getElementById('newTaskInput');
    const saveBtn = document.getElementById('saveTasksBtn');

    addBtn.addEventListener('click', () => {
      const txt = input.value.trim();
      if (!txt) return alert('Enter a task name');
      addCustomTask(txt);
      input.value = '';
      notifyDashboard();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { addBtn.click(); }
    });

    saveBtn.addEventListener('click', () => {
      // explicit save (redundant since each change saves), but keep for UX
      const all = loadTasks();
      saveTasks(all);
      alert('Tasks saved');
      notifyDashboard();
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    loadTasks();      // ensure seeded
    renderManage();
    renderSaved();
    bindUI();
  });

  // react to external storage changes (other tabs or code)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      renderManage();
      renderSaved();
    }
  });

})();
