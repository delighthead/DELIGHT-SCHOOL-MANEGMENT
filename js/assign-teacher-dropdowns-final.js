document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function authHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    };
  }

  function getArray(data, key) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadAssignTeachers() {
    const select = document.getElementById("assign_teacher_id");
    if (!select) return;

    select.innerHTML = `<option value="">Loading teachers...</option>`;

    try {
      const res = await fetch(`${API}/api/teachers`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teachers");
      }

      const teachers = getArray(data, "teachers");

      select.innerHTML = `<option value="">Select teacher</option>`;

      teachers.forEach(teacher => {
        const option = document.createElement("option");
        option.value = teacher.id || teacher.teacher_id;
        option.textContent = `${teacher.full_name || teacher.name || ""} - ${teacher.teacher_id || ""}`;
        select.appendChild(option);
      });

      if (teachers.length === 0) {
        select.innerHTML = `<option value="">No teachers found</option>`;
      }
    } catch (error) {
      console.error("Assign teachers load error:", error);
      select.innerHTML = `<option value="">Failed to load teachers</option>`;
    }
  }

  async function loadAssignClasses() {
    const select = document.getElementById("assign_class_id");
    if (!select) return;

    select.innerHTML = `<option value="">Loading classes...</option>`;

    try {
      const res = await fetch(`${API}/api/classes`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load classes");
      }

      const classes = getArray(data, "classes");

      select.innerHTML = `<option value="">Select class</option>`;

      classes.forEach(cls => {
        const option = document.createElement("option");
        option.value = cls.id || cls.class_id;
        option.textContent = cls.class_name || cls.name || cls.className || "";
        select.appendChild(option);
      });

      if (classes.length === 0) {
        select.innerHTML = `<option value="">No classes found</option>`;
      }
    } catch (error) {
      console.error("Assign classes load error:", error);
      select.innerHTML = `<option value="">Failed to load classes</option>`;
    }
  }

  loadAssignTeachers();
  loadAssignClasses();

  setTimeout(function () {
    loadAssignTeachers();
    loadAssignClasses();
  }, 800);
});
