document.addEventListener("DOMContentLoaded", () => {
  const popularGoals = [
    "Drink 8 glasses of water",
    "Read for 30 minutes",
    "Exercise for 20 minutes",
    "Meditate for 10 minutes",
    "Walk 5,000 steps",
    "Sleep 8 hours",
    "Eat 3 healthy meals",
    "Plan tomorrow’s schedule",
    "Avoid junk food",
    "Clean your workspace",
    "Write in a journal",
    "Check finances",
    "Learn something new",
    "Connect with a friend",
    "Take a short walk",
    "Do deep breathing",
    "Smile more 😄",
    "Organize your day",
    "Spend time outside",
    "Practice gratitude"
  ];

  const popularGoalsList = document.getElementById("popularGoalsList");
  const customGoalsList = document.getElementById("customGoalsList");
  const addGoalBtn = document.getElementById("addGoalBtn");
  const customGoalInput = document.getElementById("customGoalInput");
  const saveGoalsBtn = document.getElementById("saveGoalsBtn");

  let savedGoals = JSON.parse(localStorage.getItem("userGoals")) || [];

  // Render popular goals
  popularGoalsList.innerHTML = "";
  popularGoals.forEach(goal => {
    const div = document.createElement("div");
    div.className = "col-md-6";
    div.innerHTML = `
      <div class="form-check soft-item">
        <input class="form-check-input" type="checkbox" id="${goal}" ${savedGoals.includes(goal) ? "checked" : ""}>
        <label class="form-check-label" for="${goal}">${goal}</label>
      </div>
    `;
    popularGoalsList.appendChild(div);
  });

  // Render saved goals
  function renderSavedGoals() {
    customGoalsList.innerHTML = "";
    savedGoals.forEach(goal => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center soft-item";
      li.innerHTML = `
        <span>${goal}</span>
        <button class="btn btn-sm btn-outline-danger remove-goal">✕</button>
      `;
      customGoalsList.appendChild(li);
    });
  }
  renderSavedGoals();

  // Add custom goal
  addGoalBtn.addEventListener("click", () => {
    const goalText = customGoalInput.value.trim();
    if (goalText && !savedGoals.includes(goalText)) {
      savedGoals.push(goalText);
      localStorage.setItem("userGoals", JSON.stringify(savedGoals));
      renderSavedGoals();
      customGoalInput.value = "";
    }
  });

  // Remove saved goal
  customGoalsList.addEventListener("click", e => {
    if (e.target.classList.contains("remove-goal")) {
      const goalText = e.target.closest("li").querySelector("span").textContent;
      savedGoals = savedGoals.filter(g => g !== goalText);
      localStorage.setItem("userGoals", JSON.stringify(savedGoals));
      renderSavedGoals();
    }
  });

  // Save selected popular goals
  saveGoalsBtn.addEventListener("click", () => {
    const selected = [];
    document.querySelectorAll("#popularGoalsList input[type='checkbox']:checked").forEach(cb => {
      selected.push(cb.id);
    });
    savedGoals = Array.from(new Set([...savedGoals, ...selected]));
    localStorage.setItem("userGoals", JSON.stringify(savedGoals));
    renderSavedGoals();
    alert("✅ Goals updated successfully!");
  });
});
