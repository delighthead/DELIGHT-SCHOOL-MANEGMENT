document.addEventListener("DOMContentLoaded", function () {
  const classBox = document.getElementById("teacherClassBox");
  const studentTableBody = document.getElementById("teacherClassStudentTableBody");

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }

  async function getLoggedInTeacher() {
    const user = getLoggedInUser();

    if (!user || user.role !== "teacher") {
      throw new Error("Please login as a teacher.");
    }

    const response = await fetch(`http://127.0.0.1:5000/api/teachers/by-user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Teacher record not found.");
    }

    return data.teacher;
  }

  function studentName(student) {
    return student.full_name || `${student.first_name || ""} ${student.surname || ""}`.trim();
  }

  async function loadAssignedClass() {
    try {
      const teacher = await getLoggedInTeacher();

      const response = await fetch(`http://127.0.0.1:5000/api/teachers/${teacher.id}/students`);
      const data = await response.json();

      const students = data.students || [];
      const firstStudent = students[0] || {};

      if (classBox) {
        classBox.innerHTML = `
          <div class="dashboard-card">
            <h2>Teacher Name</h2>
            <p>${teacher.full_name || ""}</p>
          </div>

          <div class="dashboard-card">
            <h2>Teacher ID</h2>
            <p>${teacher.teacher_id || ""}</p>
          </div>

          <div class="dashboard-card">
            <h2></h2>
            <p>${teacher.branch_name || ""}</p>
          </div>

          <div class="dashboard-card">
            <h2>Assigned Class</h2>
            <p>${firstStudent.class_name || "No class assigned"}</p>
          </div>

          <div class="dashboard-card">
            <h2>Assigned Students</h2>
            <p>${students.length}</p>
          </div>
        `;
      }

      if (studentTableBody) {
        studentTableBody.innerHTML = "";

        if (students.length === 0) {
          studentTableBody.innerHTML = `
            <tr>
              <td colspan="5">No assigned students found.</td>
            </tr>
          `;
          return;
        }

        students.forEach(function (student) {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${student.student_id || ""}</td>
            <td>${student.admission_number || ""}</td>
            <td>${studentName(student)}</td>
            <td>${student.class_name || ""}</td>
            <td>${student.status || ""}</td>
          `;

          studentTableBody.appendChild(row);
        });
      }
    } catch (error) {
      console.error(error);

      if (classBox) {
        classBox.innerHTML = `<p>${error.message}</p>`;
      }

      if (studentTableBody) {
        studentTableBody.innerHTML = `
          <tr>
            <td colspan="5">${error.message}</td>
          </tr>
        `;
      }
    }
  }

  loadAssignedClass();
});


