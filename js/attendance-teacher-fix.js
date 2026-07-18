document.addEventListener("DOMContentLoaded", function () {
  const branchSelect =
    document.getElementById("attendance_branch_id") ||
    document.getElementById("branch_id") ||
    document.getElementById("fee_branch_id");

  const teacherSelect =
    document.getElementById("teacher_id") ||
    document.getElementById("attendance_teacher_id");

  if (!teacherSelect) return;

  function getToken() {
    return localStorage.getItem("token");
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${getToken()}`
    };
  }

  function teacherName(teacher) {
    return (
      teacher.full_name ||
      teacher.teacher_name ||
      `${teacher.first_name || ""} ${teacher.surname || ""}`.trim() ||
      teacher.name ||
      "Unnamed Teacher"
    );
  }

  async function loadTeachers() {
    try {
      teacherSelect.innerHTML = '<option value="">Loading teachers...</option>';

      let url = "http://127.0.0.1:5000/api/teachers";

      if (branchSelect && branchSelect.value) {
        url += `?branch_id=${branchSelect.value}`;
      }

      const res = await fetch(url, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load teachers");
      }

      const teachers = data.teachers || [];

      teacherSelect.innerHTML = '<option value="">Select teacher</option>';

      const activeTeachers = teachers.filter(t => {
        const status = String(t.status || "active").toLowerCase();
        return status === "active";
      });

      activeTeachers.forEach(teacher => {
        const opt = document.createElement("option");
        opt.value = teacher.id;
        opt.textContent = teacherName(teacher);
        teacherSelect.appendChild(opt);
      });

      if (activeTeachers.length === 0) {
        teacherSelect.innerHTML = '<option value="">No active teachers found</option>';
      }
    } catch (error) {
      console.error(error);
      teacherSelect.innerHTML = '<option value="">Cannot load teachers</option>';
    }
  }

  if (branchSelect) {
    branchSelect.addEventListener("change", loadTeachers);
  }

  loadTeachers();
});
