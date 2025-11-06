document.addEventListener('DOMContentLoaded', function () {
  const defaultTasks = [
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

  const container = document.getElementById('taskContainer');
  const newTaskInput = document.getElementById('newTaskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');

  // Load from localStorage or use defaults
  let tasks = JSON.parse(localStorage.getItem('userTasks')) || defaultTasks;

  function saveTasks() {
    localStorage.setItem('userTasks', JSON.stringify(tasks));
  }

  function renderTasks() {
    container.innerHTML = '';
    tasks.forEach((task, index) => {
      const col = document.createElement('div');
      col.className = 'col-md-6 mb-2';

      col.innerHTML = `
        <div class="form-check task-item p-3 rounded shadow-sm d-flex justify-content-between align-items-center">
          <div>
            <input class="form-check-input me-2" type="checkbox" id="task${index}">
            <label class="form-check-label" for="task${index}">${task}</label>
          </div>
          <button class="btn btn-sm btn-outline-danger remove-task" data-index="${index}">✖</button>
        </div>
      `;
      container.appendChild(col);
    });

    document.querySelectorAll('.remove-task').forEach(button => {
      button.addEventListener('click', function () {
        const index = this.getAttribute('data-index');
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
      });
    });
  }

  addTaskBtn.addEventListener('click', () => {
    const newTask = newTaskInput.value.trim();
    if (newTask !== '' && !tasks.includes(newTask)) {
      tasks.push(newTask);
      newTaskInput.value = '';
      saveTasks();
      renderTasks();
    }
  });

  renderTasks();
});
