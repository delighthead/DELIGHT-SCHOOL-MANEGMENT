document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const branchSelect = document.getElementById("attendance_branch_id");
  const studentSelect = document.getElementById("attendance_student_id");

  if (!branchSelect || !studentSelect) return;

  function token() {
    return localStorage.getItem("token") || "";
  }

  async function loadStudentsForSelectedBranch() {
    const branchId = branchSelect.value;

    if (!branchId) {
      studentSelect.innerHTML = `<option value="">Select branch first</option>`;
      return;
    }

    studentSelect.innerHTML = `<option value="">Loading students...</option>`;

    try {
      const res = await fetch(`${API}/api/students?branch_id=${branchId}`, {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {}
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load students");
      }

      const students = data.students || data.data || [];

      studentSelect.innerHTML = `<option value="">Select student</option>`;

      if (!students.length) {
        studentSelect.innerHTML = `<option value="">No students found</option>`;
        return;
      }

      students.forEach(student => {
        const option = document.createElement("option");
        option.value = student.id;
        option.textContent = `${student.full_name || student.student_name || ""} - ${student.admission_number || ""} - ${student.class_name || ""}`;
        studentSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Attendance student loading failed:", error);
      studentSelect.innerHTML = `<option value="">Failed to load students</option>`;
    }
  }

  branchSelect.addEventListener("change", loadStudentsForSelectedBranch);

  setTimeout(loadStudentsForSelectedBranch, 500);
  setTimeout(loadStudentsForSelectedBranch, 1200);
});
