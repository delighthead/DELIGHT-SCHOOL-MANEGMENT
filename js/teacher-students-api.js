document.addEventListener("DOMContentLoaded", function () {
  const studentTableBody = document.getElementById("teacherStudentTableBody");

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

    const response = await fetch(`/api/teachers/by-user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Teacher record not found.");
    }

    return data.teacher;
  }

  async function loadTeacherStudents() {
    if (!studentTableBody) return;

    try {
      const teacher = await getLoggedInTeacher();

      const response = await fetch(`/api/teachers/${teacher.id}/students`);
      const data = await response.json();

      studentTableBody.innerHTML = "";

      if (!response.ok) {
        studentTableBody.innerHTML = `
          <tr>
            <td colspan="6">${data.message || "Could not load students."}</td>
          </tr>
        `;
        return;
      }

      if (!data.students || data.students.length === 0) {
        studentTableBody.innerHTML = `
          <tr>
            <td colspan="6">No assigned students found.</td>
          </tr>
        `;
        return;
      }

      data.students.forEach(function (student) {
        const row = document.createElement("tr");

        const displayName =
          student.full_name ||
          student.student_name ||
          `${student.first_name || ""} ${student.surname || ""}`.trim();

        row.innerHTML = `
          <td>${student.student_id || ""}</td>
          <td>${student.admission_number || ""}</td>
          <td>${displayName}</td>
          <td>${student.sex || ""}</td>
          <td>${student.class_name || ""}</td>
          <td>${student.status || ""}</td>
        `;

        studentTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      studentTableBody.innerHTML = `
        <tr>
          <td colspan="6">${error.message}</td>
        </tr>
      `;
    }
  }

  loadTeacherStudents();
});
