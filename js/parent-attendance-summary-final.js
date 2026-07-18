(function () {
  const API = "http://127.0.0.1:5000";
  let latestSummary = [];

  function token() {
    return localStorage.getItem("token") || "";
  }

  function headers() {
    return token() ? { Authorization: `Bearer ${token()}` } : {};
  }

  function getTable() {
    return document.querySelector(".data-table") || document.querySelector("table");
  }

  function getBody() {
    return (
      document.getElementById("parentAttendanceTableBody") ||
      document.getElementById("attendanceTableBody") ||
      document.querySelector("tbody")
    );
  }

  function getRecords(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.attendance)) return data.attendance;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  function makeKey(record) {
    return [
      record.student_id || record.admission_number || record.student_name || "",
      record.class_name || "",
      record.term || "",
      record.academic_year || ""
    ].join("|");
  }

  function groupAttendance(records) {
    const grouped = {};

    records.forEach(record => {
      const key = makeKey(record);

      if (!grouped[key]) {
        grouped[key] = {
          student_name: record.student_name || record.full_name || "",
          admission_number: record.admission_number || "",
          class_name: record.class_name || "",
          term: record.term || "",
          academic_year: record.academic_year || "",
          days_in_school: 0,
          total_present: 0,
          total_absent: 0
        };
      }

      grouped[key].days_in_school += 1;

      const status = String(record.status || "").toLowerCase();

      if (status === "present") grouped[key].total_present += 1;
      if (status === "absent") grouped[key].total_absent += 1;
    });

    return Object.values(grouped);
  }

  function fixHeading() {
    const table = getTable();
    if (!table) return;

    let thead = table.querySelector("thead");

    if (!thead) {
      thead = document.createElement("thead");
      table.prepend(thead);
    }

    thead.innerHTML = `
      <tr>
        <th>Student</th>
        <th>Admission No.</th>
        <th>Class</th>
        <th>Term</th>
        <th>Academic Year</th>
        <th>Days in School</th>
        <th>Total Present</th>
        <th>Total Absent</th>
      </tr>
    `;
  }

  function renderSummary() {
    const body = getBody();
    if (!body) return;

    fixHeading();

    const countText =
      document.getElementById("attendanceCountText") ||
      document.getElementById("parentAttendanceCountText");

    if (countText) {
      countText.textContent = `Showing ${latestSummary.length} attendance summary record(s)`;
    }

    if (!latestSummary.length) {
      body.innerHTML = `<tr><td colspan="8">No attendance records found.</td></tr>`;
      return;
    }

    body.innerHTML = "";

    latestSummary.forEach(item => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.student_name}</td>
        <td>${item.admission_number}</td>
        <td>${item.class_name}</td>
        <td>${item.term}</td>
        <td>${item.academic_year}</td>
        <td>${item.days_in_school}</td>
        <td>${item.total_present}</td>
        <td>${item.total_absent}</td>
      `;

      body.appendChild(row);
    });
  }

  async function loadSummary() {
    const body = getBody();
    if (body) body.innerHTML = `<tr><td colspan="8">Loading attendance...</td></tr>`;

    try {
      const res = await fetch(`${API}/api/parents/my/attendance`, {
        headers: headers()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load attendance.");
      }

      latestSummary = groupAttendance(getRecords(data));
      renderSummary();
      document.body.classList.remove("parent-attendance-loading");

      setTimeout(renderSummary, 500);
      setTimeout(renderSummary, 1500);
      setTimeout(renderSummary, 3000);
    } catch (error) {
      console.error("Parent attendance summary error:", error);
      if (body) body.innerHTML = `<tr><td colspan="8">${error.message}</td></tr>`;
      document.body.classList.remove("parent-attendance-loading");
    }
  }

  function fixPrintButton() {
    document.querySelectorAll("button, a").forEach(btn => {
      const text = String(btn.textContent || "").toLowerCase();
      if (text.includes("print scores")) {
        btn.textContent = "Print Attendance";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fixPrintButton();
    loadSummary();
  });

  setTimeout(fixPrintButton, 300);
  setTimeout(loadSummary, 700);
})();
