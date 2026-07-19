document.addEventListener("DOMContentLoaded", function () {
  const dashboardCards = document.getElementById("teacherDashboardCards");

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

    if (!user) {
      throw new Error("No logged-in teacher found. Please login again.");
    }

    if (user.role !== "teacher") {
      throw new Error("This dashboard is for teachers only.");
    }

    const response = await fetch(`http://127.0.0.1:5000/api/teachers/by-user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Teacher record not found.");
    }

    return data.teacher;
  }

  async function loadTeacherDashboard() {
    if (!dashboardCards) return;

    try {
      const teacher = await getLoggedInTeacher();

      const studentsResponse = await fetch(`http://127.0.0.1:5000/api/teachers/${teacher.id}/students`);
      const studentsData = await studentsResponse.json();

      const students = studentsData.students || [];

      dashboardCards.innerHTML = `
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
          <h2>Status</h2>
          <p>${teacher.status || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2>Assigned Students</h2>
          <p>${students.length}</p>
        </div>
      `;
    } catch (error) {
      console.error(error);
      dashboardCards.innerHTML = `<p>${error.message}</p>`;
    }
  }

  loadTeacherDashboard();
});


