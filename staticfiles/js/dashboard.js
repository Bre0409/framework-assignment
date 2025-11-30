// static/js/dashboard.js
// DASHBOARD-SPECIFIC JS (tasks card + notes)

document.addEventListener("DOMContentLoaded", () => {
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }
  const csrftoken = getCookie("csrftoken");

  // 1️⃣ TASK TOGGLE (HOME CARD)
  const taskList = document.getElementById("taskList");

  if (taskList) {
    taskList.addEventListener("change", (e) => {
      const checkbox = e.target.closest(".dashboard-task-toggle");
      if (!checkbox) return;

      const id = checkbox.dataset.id;
      if (!id) return;

      const li = checkbox.closest("li");
      const textSpan = li.querySelector("span");
      const badge = li.querySelector(".badge");
      const completed = checkbox.checked;

      if (textSpan) {
        if (completed) {
          textSpan.classList.add("text-decoration-line-through", "text-muted");
        } else {
          textSpan.classList.remove("text-decoration-line-through", "text-muted");
        }
      }

      if (badge) {
        if (completed) {
          badge.textContent = "Done";
          badge.classList.remove("bg-warning", "text-dark");
          badge.classList.add("bg-success");
        } else {
          badge.textContent = "Pending";
          badge.classList.remove("bg-success");
          badge.classList.add("bg-warning", "text-dark");
        }
      }

      // Persist to backend
      fetch(`/api/tasks/toggle/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
      })
        .then(() => {
          // 🔔 Tell main.js to update the weekly chart
          document.dispatchEvent(new CustomEvent("dashboardTasksChanged"));
        })
        .catch((err) => console.error("Error toggling task:", err));
    });
  }

  // 2️⃣ NOTES (DB-backed)
  const notesList = document.getElementById("notesList");
  const noteInput = document.getElementById("noteInput");
  const addNoteBtn = document.getElementById("addNoteBtn");

  if (notesList && noteInput && addNoteBtn) {
    function renderNotes(notes) {
      notesList.innerHTML = "";

      if (!notes.length) {
        const li = document.createElement("li");
        li.className =
          "list-group-item bg-transparent text-muted text-center border-secondary";
        li.textContent = "No notes yet — add one above.";
        notesList.appendChild(li);
        return;
      }

      notes.forEach((n) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center";

        li.innerHTML = `
          <div class="d-flex align-items-center">
            <input type="checkbox"
                   class="form-check-input me-2 note-toggle"
                   data-id="${n.id}"
                   ${n.completed ? "checked" : ""}>
            <span class="${n.completed ? "text-decoration-line-through text-muted" : ""}">
              ${n.text}
            </span>
          </div>
          <button class="btn btn-sm btn-danger note-delete" data-id="${n.id}">X</button>
        `;

        notesList.appendChild(li);
      });
    }

    async function loadNotes() {
      try {
        const res = await fetch("/api/notes/list/");
        const data = await res.json();
        renderNotes(data.notes || []);
      } catch (err) {
        console.error("Error loading notes:", err);
      }
    }

    addNoteBtn.addEventListener("click", async () => {
      const text = noteInput.value.trim();
      if (!text) return;

      try {
        await fetch("/api/notes/create/", {
          method: "POST",
          headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ text }),
        });
        noteInput.value = "";
        loadNotes();
      } catch (err) {
        console.error("Error creating note:", err);
      }
    });

    noteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addNoteBtn.click();
      }
    });

    notesList.addEventListener("click", async (e) => {
      const toggle = e.target.closest(".note-toggle");
      const delBtn = e.target.closest(".note-delete");

      if (toggle) {
        const id = toggle.dataset.id;
        try {
          await fetch(`/api/notes/toggle/${id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrftoken },
          });
          loadNotes();
        } catch (err) {
          console.error("Error toggling note:", err);
        }
        return;
      }

      if (delBtn) {
        const id = delBtn.dataset.id;
        try {
          await fetch(`/api/notes/delete/${id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrftoken },
          });
          loadNotes();
        } catch (err) {
          console.error("Error deleting note:", err);
        }
      }
    });

    loadNotes();
  }
});
