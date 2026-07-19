document.addEventListener("DOMContentLoaded", function () {
  const host = window.location.hostname;
  const API =
    host === "localhost" || host === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "";

  async function loadTeacherDropdownOnly() {
    const select = document.getElementById("assign_teacher_id");
    if (!select) return;

    const token = localStorage.getItem("token");

    select.innerHTML = `<option value="">Loading teachers...</option>`;

    try {
      const res = await fetch(`${API}/api/teachers`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teachers");
      }

      const teachers = data.teachers || data.data || data || [];

      select.innerHTML = `<option value="">Select teacher</option>`;

      if (!Array.isArray(teachers) || teachers.length === 0) {
        select.innerHTML = `<option value="">No teachers found</option>`;
        return;
      }

      teachers.forEach(function (teacher) {
        const option = document.createElement("option");
        option.value = teacher.id || teacher.teacher_id;
        option.textContent = `${teacher.full_name || teacher.name || ""} - ${teacher.teacher_id || ""}`;
        select.appendChild(option);
      });

    } catch (error) {
      console.error("Teacher dropdown error:", error);
      select.innerHTML = `<option value="">Failed to load teachers</option>`;
    }
  }

  loadTeacherDropdownOnly();
  setTimeout(loadTeacherDropdownOnly, 1000);
});
