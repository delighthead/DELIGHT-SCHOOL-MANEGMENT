document.addEventListener("DOMContentLoaded", function () {
  const reportTableBody = document.getElementById("teacherReportTableBody");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

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

  async function loadTeacherReports() {
    if (!reportTableBody) return;

    try {
      const teacher = await getLoggedInTeacher();

      const response = await fetch(`http://127.0.0.1:5000/api/reports?branch_id=${teacher.branch_id}`, {
        headers: getAuthOnlyHeaders()
      });
      const data = await response.json();

      reportTableBody.innerHTML = "";

      if (!response.ok) {
        reportTableBody.innerHTML = `
          <tr>
            <td colspan="8">${data.message || "Could not load reports."}</td>
          </tr>
        `;
        return;
      }

      if (!data.reports || data.reports.length === 0) {
        reportTableBody.innerHTML = `
          <tr>
            <td colspan="8">No reports found.</td>
          </tr>
        `;
        return;
      }

      data.reports.forEach(function (report) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${report.report_name || ""}</td>
          <td>${report.report_type || ""}</td>
          <td>${report.class_name || ""}</td>
          <td>${report.term || ""}</td>
          <td>${report.academic_year || ""}</td>
          <td>${report.generated_by_name || ""}</td>
          <td>${report.generated_at ? report.generated_at.slice(0, 10) : ""}</td>
          <td>
            <button class="small-btn success" >Print</button>
          </td>
        `;

        reportTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      reportTableBody.innerHTML = `
        <tr>
          <td colspan="8">${error.message}</td>
        </tr>
      `;
    }
  }

  loadTeacherReports();
});
