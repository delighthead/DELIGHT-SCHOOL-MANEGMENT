document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const tableBody = document.getElementById("attendanceTableBody");
  const printBtn = document.getElementById("printAttendanceBtn");

  let attendanceRecords = [];

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function isBranchAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function pickArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.attendance)) return data.attendance;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  function formatStatus(status) {
    const value = String(status || "").toLowerCase();

    if (value === "present") return "Present";
    if (value === "absent") return "Absent";
    if (value === "late") return "Late";

    return status || "";
  }

  function updateSummary(records) {
    const present = records.filter(r => String(r.status || "").toLowerCase() === "present").length;
    const absent = records.filter(r => String(r.status || "").toLowerCase() === "absent").length;
    const total = records.length;

    const presentBox = document.getElementById("attendancePresentCount");
    const absentBox = document.getElementById("attendanceAbsentCount");
    const totalBox = document.getElementById("attendanceTotalCount");

    if (presentBox) presentBox.textContent = present;
    if (absentBox) absentBox.textContent = absent;
    if (totalBox) totalBox.textContent = total;
  }

  async function loadAttendanceRecords() {
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="10">Loading attendance...</td></tr>`;

    try {
      let url = `${API}/api/attendance`;

      if (isBranchAdmin() && getBranchId()) {
        url += `?branch_id=${getBranchId()}`;
      }

      const res = await fetch(url, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load attendance.");
      }

      attendanceRecords = pickArray(data);
      updateSummary(attendanceRecords);

      if (attendanceRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10">No attendance records found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = "";

      attendanceRecords.forEach(record => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${record.branch_name || ""}</td>
          <td>${record.student_name || record.full_name || ""}</td>
          <td>${record.admission_number || record.admission_no || ""}</td>
          <td>${record.class_name || ""}</td>
          <td>${record.teacher_name || record.teacher || ""}</td>
          <td>${record.attendance_date ? String(record.attendance_date).slice(0, 10) : ""}</td>
          <td>${record.term || ""}</td>
          <td>${record.academic_year || ""}</td>
          <td>${formatStatus(record.status)}</td>
          <td>${record.remarks || ""}</td>
          <td>
            <button type="button" class="small-btn edit-attendance-btn"
              data-record="${encodeURIComponent(JSON.stringify(record))}">
              Edit
            </button>
            <button type="button" class="small-btn print-single-attendance-btn"
              data-record="${encodeURIComponent(JSON.stringify(record))}">
              Print
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Attendance records final load error:", error);
      updateSummary([]);
      tableBody.innerHTML = `<tr><td colspan="10">${error.message}</td></tr>`;
    }
  }

  function printAttendanceSheet() {
    const rows = attendanceRecords.map(record => `
      <tr>
        <td>${record.branch_name || ""}</td>
        <td>${record.student_name || record.full_name || ""}</td>
        <td>${record.admission_number || record.admission_no || ""}</td>
        <td>${record.class_name || ""}</td>
        <td>${record.teacher_name || record.teacher || ""}</td>
        <td>${record.attendance_date ? String(record.attendance_date).slice(0, 10) : ""}</td>
        <td>${record.term || ""}</td>
        <td>${record.academic_year || ""}</td>
        <td>${formatStatus(record.status)}</td>
        <td>${record.remarks || ""}</td>
      </tr>
    `).join("");

    const win = window.open("", "_blank", "width=1000,height=700");

    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Sheet</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body {
            font-family: Arial, sans-serif;
            color: #000;
            font-size: 12px;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #073b70;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }

          .header h1 {
            margin: 0;
            color: #073b70;
            font-size: 22px;
          }

          .summary {
            display: flex;
            gap: 25px;
            margin: 15px 0;
            font-weight: bold;
            font-size: 14px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th, td {
            border: 1px solid #333;
            padding: 6px;
            text-align: left;
            font-size: 11px;
          }

          th {
            background: #073b70;
            color: white;
          }

          .footer {
            margin-top: 45px;
            display: flex;
            justify-content: space-between;
          }

          .line {
            width: 250px;
            border-top: 1px solid #000;
            padding-top: 6px;
            text-align: center;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Delight International School</h1>
          <p><strong>Attendance Sheet</strong></p>
        </div>

        <div class="summary">
          <div>Total Present: ${document.getElementById("attendancePresentCount")?.textContent || "0"}</div>
          <div>Total Absent: ${document.getElementById("attendanceAbsentCount")?.textContent || "0"}</div>
          <div>Total Records: ${document.getElementById("attendanceTotalCount")?.textContent || "0"}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Student</th>
              <th>Admission No.</th>
              <th>Class</th>
              <th>Teacher</th>
              <th>Date</th>
              <th>Term</th>
              <th>Academic Year</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="10">No attendance records found.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          <div class="line">Teacher Signature</div>
          <div class="line">Head / Admin Signature</div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    win.document.close();
  }

  if (printBtn) {
    printBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      printAttendanceSheet();
      return false;
    }, true);
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest("#printAttendanceBtn");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    printAttendanceSheet();
    return false;
  }, true);

  loadAttendanceRecords();
  setTimeout(loadAttendanceRecords, 1200);
});

document.addEventListener("click", function (event) {
  const btn = event.target.closest(".print-single-attendance-btn");
  if (!btn) return;

  event.preventDefault();
  event.stopPropagation();

  let record = {};

  try {
    record = JSON.parse(decodeURIComponent(btn.dataset.record || "{}"));
  } catch (e) {
    alert("Could not read attendance record.");
    return;
  }

  const admissionNo = record.admission_number || record.admission_no || "";
  const studentName = record.student_name || record.full_name || "";

  const tableRows = Array.from(document.querySelectorAll("#attendanceTableBody tr"));

  const studentRows = tableRows.filter(row => {
    const cells = row.querySelectorAll("td");
    const rowStudent = (cells[1]?.textContent || "").trim();
    const rowAdmission = (cells[2]?.textContent || "").trim();

    return rowAdmission === String(admissionNo) || rowStudent === String(studentName);
  });

  let totalAttendance = studentRows.length;
  let totalPresent = 0;
  let totalAbsent = 0;

  studentRows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const status = (cells[8]?.textContent || "").trim().toLowerCase();

    if (status === "present") totalPresent++;
    if (status === "absent") totalAbsent++;
  });

  const win = window.open("", "_blank", "width=900,height=650");

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Individual Attendance Record</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 35px;
          color: #000;
        }

        .header {
          text-align: center;
          border-bottom: 3px solid #073b70;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .header h1 {
          color: #073b70;
          margin: 0;
          font-size: 24px;
        }

        .header p {
          margin: 6px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th, td {
          border: 1px solid #333;
          padding: 10px;
          text-align: left;
          font-size: 14px;
        }

        th {
          background: #073b70;
          color: white;
          width: 35%;
        }

        .footer {
          margin-top: 55px;
          display: flex;
          justify-content: space-between;
        }

        .line {
          width: 250px;
          border-top: 1px solid #000;
          padding-top: 6px;
          text-align: center;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Delight International School</h1>
        <p><strong>Individual Attendance Record</strong></p>
      </div>

      <div style="display:flex; gap:20px; margin:20px 0; font-weight:bold;">
        <div>Total Attendance: ${totalAttendance}</div>
        <div>Present: ${totalPresent}</div>
        <div>Absent: ${totalAbsent}</div>
      </div>

      <table>
        <tbody>
          <tr><th>Branch</th><td>${record.branch_name || ""}</td></tr>
          <tr><th>Student</th><td>${record.student_name || record.full_name || ""}</td></tr>
          <tr><th>Admission No.</th><td>${record.admission_number || record.admission_no || ""}</td></tr>
          <tr><th>Class</th><td>${record.class_name || ""}</td></tr>
          <tr><th>Teacher</th><td>${record.teacher_name || record.teacher || ""}</td></tr>
          <tr><th>Date</th><td>${record.attendance_date ? String(record.attendance_date).slice(0, 10) : ""}</td></tr>
          <tr><th>Term</th><td>${record.term || ""}</td></tr>
          <tr><th>Academic Year</th><td>${record.academic_year || ""}</td></tr>
          <tr><th>Status</th><td>${record.status || ""}</td></tr>
          <tr><th>Remarks</th><td>${record.remarks || ""}</td></tr>
        </tbody>
      </table>

      <div class="footer">
        <div class="line">Teacher Signature</div>
        <div class="line">Head / Admin Signature</div>
      </div>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);

  win.document.close();
}, true);
