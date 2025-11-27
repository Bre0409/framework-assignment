document.addEventListener("DOMContentLoaded", () => {
  // ✅ Correct CSRF cookie parser
  function getCSRF() {
    const name = "csrftoken=";
    const decoded = decodeURIComponent(document.cookie);
    const cookies = decoded.split("; ");

    for (let c of cookies) {
      if (c.startsWith(name)) return c.substring(name.length);
    }
    return "";
  }

  const csrftoken = getCSRF();

 // ✅ Toggle task from dashboard with instant UI update
document.querySelectorAll(".dashboard-task-toggle").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const id = checkbox.dataset.id;
    const listItem = checkbox.closest("li");
    const titleSpan = listItem.querySelector("span");
    const badge = listItem.querySelector("span.badge");

    fetch(`/api/tasks/toggle/${id}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const completed = data.completed;

        // ✅ Update text styling instantly
        if (completed) {
          titleSpan.classList.add("text-decoration-line-through", "text-muted");
        } else {
          titleSpan.classList.remove("text-decoration-line-through", "text-muted");
        }

        // ✅ Update badge instantly
        if (completed) {
          badge.className = "badge bg-success";
          badge.textContent = "Done";
        } else {
          badge.className = "badge bg-warning text-dark";
          badge.textContent = "Pending";
        }
      })
      .catch((err) => {
        console.error("Task toggle failed:", err);
        checkbox.checked = !checkbox.checked; // revert on failure
      });
  });
});


  // ✅ Local notes widget
  const addNoteBtn = document.getElementById("addNoteBtn");
  const noteInput = document.getElementById("noteInput");
  const notesList = document.getElementById("notesList");

  if (!addNoteBtn) return;

  let notes = JSON.parse(localStorage.getItem("notes")) || [];

  function renderNotes() {
    notesList.innerHTML = "";
    notes.forEach((note, index) => {
      const li = document.createElement("li");
      li.className = "list-group-item bg-dark text-light d-flex justify-content-between";
      li.innerHTML = `
        ${note}
        <button class="btn btn-sm btn-danger" data-index="${index}">X</button>
      `;
      notesList.appendChild(li);
    });
  }

  notesList.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      notes.splice(e.target.dataset.index, 1);
      localStorage.setItem("notes", JSON.stringify(notes));
      renderNotes();
    }
  });

  addNoteBtn.addEventListener("click", () => {
    if (!noteInput.value.trim()) return;
    notes.push(noteInput.value.trim());
    localStorage.setItem("notes", JSON.stringify(notes));
    noteInput.value = "";
    renderNotes();
  });

  renderNotes();
});
