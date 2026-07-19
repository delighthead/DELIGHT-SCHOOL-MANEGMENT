document.addEventListener("DOMContentLoaded", function () {
  const attendanceTableBody = document.getElementById("parentAttendanceTableBody");
  const attendanceCountText = document.getElementById("parentAttendanceCountText");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  async function loadParentAttendance() {
    if (!attendanceTableBody) {
      console.error("parentAttendanceTableBody not found");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/attendance", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();
      console.log("Parent attendance response:", data);

      attendanceTableBody.innerHTML = "";

      if (!response.ok) {
        attendanceTableBody.innerHTML = `
          <tr>
            <td colspan="8">${data.message || "Could not load attendance."}</td>
          </tr>
        `;
        return;
      }

      const attendance = data.attendance || [];

      if (attendanceCountText) {
        attendanceCountText.textContent = `Showing ${attendance.length} attendance record(s)`;
      }

      if (attendance.length === 0) {
        attendanceTableBody.innerHTML = `
          <tr>
            <td colspan="8">No attendance records found for active children.</td>
          </tr>
        `;
        return;
      }

      attendance.forEach(function (record) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${record.student_name || ""}</td>
          <td>${record.admission_number || ""}</td>
          <td>${record.class_name || ""}</td>
          <td>${formatDate(record.attendance_date)}</td>
          <td>${record.term || ""}</td>
          <td>${record.academic_year || ""}</td>
          <td>${record.status || ""}</td>
          <td>${record.remarks || ""}</td>
        `;

        attendanceTableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Parent attendance error:", error);

      attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="8">Cannot connect to backend.</td>
        </tr>
      `;
    }
  }

  loadParentAttendance();
});
