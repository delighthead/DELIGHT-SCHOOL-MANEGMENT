document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function token() {
    return localStorage.getItem("token") || "";
  }

  function user() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }

  function isSuperAdmin() {
    return user().role === "super_admin";
  }

  function addMakeAdminButtons() {
    if (!isSuperAdmin()) return;

    document.querySelectorAll(".edit-teacher-btn").forEach(editBtn => {
      const row = editBtn.closest("tr");
      if (!row) return;

      const actionCell = editBtn.closest("td");
      if (!actionCell) return;

      if (actionCell.querySelector(".make-teacher-admin-btn")) return;

      const teacherId = editBtn.dataset.id;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "small-btn make-teacher-admin-btn";
      btn.dataset.id = teacherId;
      btn.textContent = "Make Admin";
      btn.style.background = "#ffcc00";
      btn.style.color = "#002b5c";
      btn.style.border = "none";
      btn.style.padding = "6px 10px";
      btn.style.borderRadius = "5px";
      btn.style.fontWeight = "bold";
      btn.style.marginLeft = "5px";
      btn.style.cursor = "pointer";

      actionCell.appendChild(btn);
    });
  }

  async function makeTeacherAdmin(teacherId) {
    if (!teacherId) return;

    if (!confirm("Make this teacher also a Branch Admin?")) return;

    try {
      const res = await fetch(`${API}/api/teachers/${teacherId}/make-admin`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to make teacher admin.");
      }

      alert(data.message || "Teacher is now also admin.");
    } catch (error) {
      alert(error.message);
    }
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".make-teacher-admin-btn");
    if (!btn) return;

    event.preventDefault();
    makeTeacherAdmin(btn.dataset.id);
  });

  setInterval(addMakeAdminButtons, 1000);
});


