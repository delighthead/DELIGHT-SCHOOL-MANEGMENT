document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const attendanceForm = document.getElementById("teacherAttendanceForm");
  const attendanceTableBody = document.getElementById("teacherAttendanceTableBody");
  const recordsTableBody = document.getElementById("teacherAttendanceRecordsBody");
  const attendanceDateInput = document.getElementById("teacher_attendance_date");
  const attendanceTermInput = document.getElementById("teacher_attendance_term");
  const attendanceYearInput = document.getElementById("teacher_academic_year");
  const markAllPresentBtn = document.getElementById("teacherMarkAllPresentBtn");
  const markAllAbsentBtn = document.getElementById("teacherMarkAllAbsentBtn");
  const printBtn = document.getElementById("teacherPrintAttendanceBtn");

  let loggedInTeacher = null;
  let assignedStudents = [];
  let attendanceRecords = [];
  let editingAttendanceId = null;

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders(includeJson) {
    const headers = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
  }

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function safe(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatStatus(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "present") return "Present";
    if (normalized === "absent") return "Absent";
    return status || "";
  }

  function updateSummary(records) {
    const present = records.filter((record) => String(record.status || "").toLowerCase() === "present").length;
    const absent = records.filter((record) => String(record.status || "").toLowerCase() === "absent").length;
    const total = records.length;

    const presentBox = document.getElementById("teacherAttendancePresentCount");
    const absentBox = document.getElementById("teacherAttendanceAbsentCount");
    const totalBox = document.getElementById("teacherAttendanceTotalCount");

    if (presentBox) presentBox.textContent = String(present);
    if (absentBox) absentBox.textContent = String(absent);
    if (totalBox) totalBox.textContent = String(total);
  }

  async function loadSettings() {
    try {
      const response = await fetch(`${API}/api/settings`);
      const data = await response.json();
      const settings = data.settings || {};

      if (attendanceTermInput && settings.current_term) {
        attendanceTermInput.value = settings.current_term;
      }
      if (attendanceYearInput && settings.academic_year) {
        attendanceYearInput.value = settings.academic_year;
      }
    } catch (error) {
      console.error("Could not load settings:", error);
    }

    if (attendanceDateInput && !attendanceDateInput.value) {
      attendanceDateInput.value = new Date().toISOString().slice(0, 10);
    }
  }

  async function getTeacherProfile() {
    const user = getLoggedInUser();

    if (!user || String(user.role || "") !== "teacher") {
      throw new Error("Please login as a teacher.");
    }

    const response = await fetch(`${API}/api/teachers/by-user/${user.id}`, {
      headers: authHeaders(false)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Teacher profile not found.");
    }

    return data.teacher;
  }

  async function loadAssignedStudents() {
    if (!attendanceTableBody) return;

    attendanceTableBody.innerHTML = '<tr><td colspan="5">Loading assigned students...</td></tr>';

    try {
      loggedInTeacher = await getTeacherProfile();

      const response = await fetch(`${API}/api/teachers/${loggedInTeacher.id}/students`, {
        headers: authHeaders(false)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load assigned students.");
      }

      assignedStudents = data.students || [];

      if (assignedStudents.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="5">No assigned students found.</td></tr>';
        return;
      }

      attendanceTableBody.innerHTML = "";

      assignedStudents.forEach((student) => {
        const row = document.createElement("tr");
        const displayName = student.full_name || `${student.first_name || ""} ${student.surname || ""}`.trim();

        row.innerHTML = `
          <td>${safe(student.student_id)}</td>
          <td>${safe(student.admission_number)}</td>
          <td>${safe(displayName)}</td>
          <td>${safe(student.class_name)}</td>
          <td>
            <select class="teacher-attendance-status" data-student-id="${student.id}" data-class-id="${student.class_id || ""}">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </td>
        `;

        attendanceTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      attendanceTableBody.innerHTML = `<tr><td colspan="5">${safe(error.message || "Cannot connect to backend.")}</td></tr>`;
    }
  }

  function setAllStatuses(status) {
    document.querySelectorAll(".teacher-attendance-status").forEach((select) => {
      select.value = status;
    });
  }

  async function loadAttendanceRecords() {
    if (!recordsTableBody) return;

    recordsTableBody.innerHTML = '<tr><td colspan="9">Loading attendance records...</td></tr>';

    try {
      const response = await fetch(`${API}/api/attendance`, { headers: authHeaders(false) });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load attendance records.");
      }

      attendanceRecords = data.attendance || [];
      updateSummary(attendanceRecords);

      if (attendanceRecords.length === 0) {
        recordsTableBody.innerHTML = '<tr><td colspan="9">No attendance records found.</td></tr>';
        return;
      }

      recordsTableBody.innerHTML = "";

      attendanceRecords.forEach((record) => {
        const encoded = encodeURIComponent(JSON.stringify(record));
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${safe(record.student_name)}</td>
          <td>${safe(record.admission_number)}</td>
          <td>${safe(record.class_name)}</td>
          <td>${safe(record.attendance_date ? String(record.attendance_date).slice(0, 10) : "")}</td>
          <td>${safe(record.term)}</td>
          <td>${safe(record.academic_year)}</td>
          <td>${safe(formatStatus(record.status))}</td>
          <td>${safe(record.remarks)}</td>
          <td>
            <button type="button" class="small-btn teacher-edit-attendance-btn" data-record="${encoded}">Edit</button>
          </td>
        `;

        recordsTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      updateSummary([]);
      recordsTableBody.innerHTML = `<tr><td colspan="9">${safe(error.message || "Cannot connect to backend.")}</td></tr>`;
    }
  }

  function applyRecordToForm(record) {
    editingAttendanceId = record.id || null;

    if (attendanceDateInput) {
      attendanceDateInput.value = record.attendance_date ? String(record.attendance_date).slice(0, 10) : "";
    }
    if (attendanceTermInput) {
      attendanceTermInput.value = record.term || "";
    }
    if (attendanceYearInput) {
      attendanceYearInput.value = record.academic_year || "";
    }

    document.querySelectorAll(".teacher-attendance-status").forEach((dropdown) => {
      if (String(dropdown.dataset.studentId) === String(record.student_id)) {
        dropdown.value = String(record.status || "present").toLowerCase();
      }
    });

    const submitBtn = attendanceForm ? attendanceForm.querySelector("button[type='submit']") : null;
    if (submitBtn) {
      submitBtn.textContent = "Update Attendance";
    }

    if (attendanceForm) {
      attendanceForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function saveAttendance(event) {
    event.preventDefault();

    if (!loggedInTeacher || assignedStudents.length === 0) {
      alert("No assigned students found.");
      return;
    }

    if (!attendanceDateInput || !attendanceDateInput.value) {
      alert("Please select attendance date.");
      return;
    }

    if (!attendanceTermInput || !attendanceTermInput.value || !attendanceYearInput || !attendanceYearInput.value.trim()) {
      alert("Term and academic year are required.");
      return;
    }

    if (editingAttendanceId) {
      const targetRecord = attendanceRecords.find((record) => String(record.id) === String(editingAttendanceId));
      if (!targetRecord) {
        alert("Selected attendance record was not found.");
        return;
      }

      const selectedDropdown = document.querySelector(`.teacher-attendance-status[data-student-id="${targetRecord.student_id}"]`);
      const statusValue = selectedDropdown ? selectedDropdown.value : String(targetRecord.status || "present").toLowerCase();

      const payload = {
        branch_id: loggedInTeacher.branch_id,
        student_id: targetRecord.student_id,
        class_id: targetRecord.class_id,
        teacher_id: loggedInTeacher.id,
        attendance_date: attendanceDateInput.value,
        term: attendanceTermInput.value,
        academic_year: attendanceYearInput.value.trim(),
        status: statusValue,
        remarks: targetRecord.remarks || ""
      };

      try {
        const response = await fetch(`${API}/api/attendance/${editingAttendanceId}`, {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to update attendance.");
        }

        alert("Attendance updated successfully.");
      } catch (error) {
        console.error(error);
        alert(error.message || "Cannot connect to backend.");
        return;
      }

      editingAttendanceId = null;
      const submitBtn = attendanceForm ? attendanceForm.querySelector("button[type='submit']") : null;
      if (submitBtn) submitBtn.textContent = "Save Attendance";

      await loadAttendanceRecords();
      return;
    }

    const statuses = Array.from(document.querySelectorAll(".teacher-attendance-status"));

    if (statuses.length === 0) {
      alert("No assigned students loaded.");
      return;
    }

    const records = statuses.map((dropdown) => ({
      branch_id: loggedInTeacher.branch_id,
      student_id: dropdown.dataset.studentId,
      class_id: dropdown.dataset.classId || null,
      teacher_id: loggedInTeacher.id,
      attendance_date: attendanceDateInput.value,
      term: attendanceTermInput.value,
      academic_year: attendanceYearInput.value.trim(),
      status: dropdown.value,
      remarks: ""
    }));

    try {
      const response = await fetch(`${API}/api/attendance/bulk`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ records })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save attendance.");
      }

      alert("Attendance saved successfully.");
      await loadAttendanceRecords();
    } catch (error) {
      console.error(error);
      alert(error.message || "Cannot connect to backend.");
    }
  }

  function printAttendanceSheet() {
    const rows = attendanceRecords.map((record) => `
      <tr>
        <td>${safe(record.student_name)}</td>
        <td>${safe(record.admission_number)}</td>
        <td>${safe(record.class_name)}</td>
        <td>${safe(record.attendance_date ? String(record.attendance_date).slice(0, 10) : "")}</td>
        <td>${safe(record.term)}</td>
        <td>${safe(record.academic_year)}</td>
        <td>${safe(formatStatus(record.status))}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank", "width=1000,height=700");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teacher Attendance Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
          .header { text-align: center; border-bottom: 3px solid #073b70; margin-bottom: 14px; padding-bottom: 8px; }
          .header h1 { margin: 0; color: #073b70; }
          .summary { display: flex; gap: 20px; font-weight: bold; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 7px; font-size: 12px; text-align: left; }
          th { background: #073b70; color: #fff; }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Print</button>
        <div class="header">
          <h1>Delight International School</h1>
          <p><strong>Teacher Attendance Sheet</strong></p>
        </div>
        <div class="summary">
          <div>Present: ${safe(document.getElementById("teacherAttendancePresentCount")?.textContent || "0")}</div>
          <div>Absent: ${safe(document.getElementById("teacherAttendanceAbsentCount")?.textContent || "0")}</div>
          <div>Total: ${safe(document.getElementById("teacherAttendanceTotalCount")?.textContent || "0")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Admission No.</th>
              <th>Class</th>
              <th>Date</th>
              <th>Term</th>
              <th>Academic Year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">No attendance records found.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  if (attendanceForm) {
    attendanceForm.addEventListener("submit", saveAttendance);
  }

  if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener("click", function () {
      setAllStatuses("present");
    });
  }

  if (markAllAbsentBtn) {
    markAllAbsentBtn.addEventListener("click", function () {
      setAllStatuses("absent");
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", function (event) {
      event.preventDefault();
      printAttendanceSheet();
    });
  }

  if (recordsTableBody) {
    recordsTableBody.addEventListener("click", function (event) {
      const editBtn = event.target.closest(".teacher-edit-attendance-btn");
      if (!editBtn) return;

      try {
        const record = JSON.parse(decodeURIComponent(editBtn.dataset.record || ""));
        applyRecordToForm(record);
      } catch (error) {
        console.error(error);
        alert("Could not open attendance record.");
      }
    });
  }

  (async function init() {
    await loadSettings();
    await loadAssignedStudents();
    await loadAttendanceRecords();
  })();
});
