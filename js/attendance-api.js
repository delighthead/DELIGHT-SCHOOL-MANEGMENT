document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const attendanceForm = document.getElementById("attendanceForm");
  const attendanceTableBody = document.getElementById("attendanceTableBody");
  const branchSelect = document.getElementById("attendance_branch_id");
  const studentSelect = document.getElementById("attendance_student_id");
  const teacherSelect = document.getElementById("attendance_teacher_id");
  const attendanceIdInput = document.getElementById("attendance_id");
  const attendanceDateInput = document.getElementById("attendance_date");
  const attendanceTermInput = document.getElementById("attendance_term");
  const attendanceYearInput = document.getElementById("attendance_academic_year");
  const attendanceStatusInput = document.getElementById("attendance_status");
  const attendanceRemarksInput = document.getElementById("attendance_remarks");
  const printBtn = document.getElementById("printAttendanceBtn");

  const quickBranch = document.getElementById("quick_branch_id");
  const quickClass = document.getElementById("quick_class_id");
  const quickDate = document.getElementById("quick_attendance_date");
  const quickTerm = document.getElementById("quick_term");
  const quickYear = document.getElementById("quick_academic_year");
  const quickBox = document.getElementById("quickAttendanceBox");
  const loadQuickBtn = document.getElementById("loadQuickStudentsBtn");
  const saveQuickBtn = document.getElementById("saveQuickAttendanceBtn");
  const quickMarkAllButtons = document.getElementById("quickMarkAllButtons");
  const markAllPresentBtn = document.getElementById("markAllPresentBtn");
  const markAllAbsentBtn = document.getElementById("markAllAbsentBtn");

  let attendanceRecords = [];

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders(json) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
  }

  function isBranchAdmin() {
    return String(getUser().role || "").toLowerCase() === "branch_admin";
  }

  function getAdminBranchId() {
    return getUser().branch_id || "";
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
    const present = records.filter((r) => String(r.status || "").toLowerCase() === "present").length;
    const absent = records.filter((r) => String(r.status || "").toLowerCase() === "absent").length;
    const total = records.length;

    const presentBox = document.getElementById("attendancePresentCount");
    const absentBox = document.getElementById("attendanceAbsentCount");
    const totalBox = document.getElementById("attendanceTotalCount");

    if (presentBox) presentBox.textContent = String(present);
    if (absentBox) absentBox.textContent = String(absent);
    if (totalBox) totalBox.textContent = String(total);
  }

  async function loadSettingsToAttendanceFields() {
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

      if (quickTerm && settings.current_term) {
        quickTerm.value = settings.current_term;
      }
      if (quickYear && settings.academic_year) {
        quickYear.value = settings.academic_year;
      }
    } catch (error) {
      console.error("Could not load settings:", error);
    }

    if (attendanceDateInput && !attendanceDateInput.value) {
      attendanceDateInput.value = new Date().toISOString().slice(0, 10);
    }

    if (quickDate && !quickDate.value) {
      quickDate.value = new Date().toISOString().slice(0, 10);
    }
  }

  async function loadBranchesInto(selectElement, includePlaceholder) {
    if (!selectElement) return;

    try {
      const response = await fetch(`${API}/api/branches`, { headers: authHeaders(false) });
      const data = await response.json();
      const branches = data.branches || [];

      selectElement.innerHTML = includePlaceholder
        ? '<option value="">Select branch</option>'
        : "";

      branches.forEach((branch) => {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.branch_name || "Branch";
        selectElement.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load branches:", error);
      selectElement.innerHTML = '<option value="">Could not load branches</option>';
    }
  }

  async function loadClassesInto(selectElement) {
    if (!selectElement) return;

    try {
      const response = await fetch(`${API}/api/classes`, { headers: authHeaders(false) });
      const data = await response.json();
      const classes = data.classes || [];

      selectElement.innerHTML = '<option value="">Select class</option>';

      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls.id;
        option.textContent = cls.class_name || "Class";
        selectElement.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load classes:", error);
      selectElement.innerHTML = '<option value="">Could not load classes</option>';
    }
  }

  async function loadStudentsByBranch(branchId, selectElement) {
    if (!selectElement) return;

    if (!branchId) {
      selectElement.innerHTML = '<option value="">Select branch first</option>';
      return;
    }

    try {
      const response = await fetch(`${API}/api/students?branch_id=${encodeURIComponent(branchId)}`, {
        headers: authHeaders(false)
      });
      const data = await response.json();
      const students = data.students || [];

      selectElement.innerHTML = '<option value="">Select student</option>';

      students.forEach((student) => {
        const option = document.createElement("option");
        option.value = student.id;
        option.dataset.classId = student.class_id || "";
        option.textContent = `${student.full_name || ""} - ${student.admission_number || ""}`;
        selectElement.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load students:", error);
      selectElement.innerHTML = '<option value="">Could not load students</option>';
    }
  }

  async function loadTeachersByBranch(branchId) {
    if (!teacherSelect) return;

    if (!branchId) {
      teacherSelect.innerHTML = '<option value="">Select teacher</option>';
      return;
    }

    try {
      const response = await fetch(`${API}/api/teachers?branch_id=${encodeURIComponent(branchId)}`, {
        headers: authHeaders(false)
      });
      const data = await response.json();
      const teachers = data.teachers || [];

      teacherSelect.innerHTML = '<option value="">Select teacher</option>';

      teachers.forEach((teacher) => {
        const option = document.createElement("option");
        option.value = teacher.id;
        option.textContent = teacher.full_name || teacher.teacher_id || "Teacher";
        teacherSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load teachers:", error);
      teacherSelect.innerHTML = '<option value="">Could not load teachers</option>';
    }
  }

  async function loadAttendanceRecords() {
    if (!attendanceTableBody) return;

    attendanceTableBody.innerHTML = '<tr><td colspan="11">Loading attendance...</td></tr>';

    try {
      let url = `${API}/api/attendance`;

      if (isBranchAdmin() && getAdminBranchId()) {
        url += `?branch_id=${encodeURIComponent(getAdminBranchId())}`;
      }

      const response = await fetch(url, { headers: authHeaders(false) });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load attendance records.");
      }

      attendanceRecords = data.attendance || [];
      updateSummary(attendanceRecords);

      if (attendanceRecords.length === 0) {
        attendanceTableBody.innerHTML = '<tr><td colspan="11">No attendance records found.</td></tr>';
        return;
      }

      attendanceTableBody.innerHTML = "";

      attendanceRecords.forEach((record) => {
        const encoded = encodeURIComponent(JSON.stringify(record));
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${safe(record.branch_name)}</td>
          <td>${safe(record.student_name)}</td>
          <td>${safe(record.admission_number)}</td>
          <td>${safe(record.class_name)}</td>
          <td>${safe(record.teacher_name)}</td>
          <td>${safe(record.attendance_date ? String(record.attendance_date).slice(0, 10) : "")}</td>
          <td>${safe(record.term)}</td>
          <td>${safe(record.academic_year)}</td>
          <td>${safe(formatStatus(record.status))}</td>
          <td>${safe(record.remarks)}</td>
          <td>
            <button type="button" class="small-btn edit-attendance-btn" data-record="${encoded}">Edit</button>
          </td>
        `;

        attendanceTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      updateSummary([]);
      attendanceTableBody.innerHTML = `<tr><td colspan="11">${safe(error.message || "Cannot connect to backend.")}</td></tr>`;
    }
  }

  async function saveAttendance(event) {
    event.preventDefault();

    const branchId = isBranchAdmin() ? getAdminBranchId() : (branchSelect ? branchSelect.value : "");
    const selectedStudent = studentSelect ? studentSelect.selectedOptions[0] : null;

    const payload = {
      branch_id: branchId,
      student_id: studentSelect ? studentSelect.value : "",
      class_id: selectedStudent ? selectedStudent.dataset.classId || null : null,
      teacher_id: teacherSelect ? (teacherSelect.value || null) : null,
      attendance_date: attendanceDateInput ? attendanceDateInput.value : "",
      term: attendanceTermInput ? attendanceTermInput.value : "",
      academic_year: attendanceYearInput ? attendanceYearInput.value.trim() : "",
      status: attendanceStatusInput ? attendanceStatusInput.value : "",
      remarks: attendanceRemarksInput ? attendanceRemarksInput.value.trim() : ""
    };

    if (!payload.branch_id || !payload.student_id || !payload.attendance_date || !payload.status) {
      alert("Branch, student, date and status are required.");
      return;
    }

    if (!["present", "absent"].includes(String(payload.status).toLowerCase())) {
      alert("Attendance status must be Present or Absent.");
      return;
    }

    const editingId = attendanceIdInput ? attendanceIdInput.value : "";
    const url = editingId ? `${API}/api/attendance/${editingId}` : `${API}/api/attendance`;

    try {
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save attendance.");
      }

      alert(editingId ? "Attendance updated successfully." : "Attendance saved successfully.");

      if (attendanceForm) attendanceForm.reset();
      if (attendanceIdInput) attendanceIdInput.value = "";

      const submitBtn = attendanceForm ? attendanceForm.querySelector("button[type='submit']") : null;
      if (submitBtn) submitBtn.textContent = "Save Attendance";

      await loadSettingsToAttendanceFields();
      await loadStudentsByBranch(branchId, studentSelect);
      await loadTeachersByBranch(branchId);
      await loadAttendanceRecords();
    } catch (error) {
      console.error(error);
      alert(error.message || "Cannot connect to backend.");
    }
  }

  async function startEditAttendance(record) {
    if (attendanceIdInput) attendanceIdInput.value = record.id || "";

    const branchId = String(record.branch_id || "");

    if (branchSelect && !branchSelect.disabled) {
      branchSelect.value = branchId;
    }

    await loadStudentsByBranch(branchId, studentSelect);
    await loadTeachersByBranch(branchId);

    if (studentSelect) studentSelect.value = record.student_id || "";
    if (teacherSelect) teacherSelect.value = record.teacher_id || "";
    if (attendanceDateInput) attendanceDateInput.value = record.attendance_date ? String(record.attendance_date).slice(0, 10) : "";
    if (attendanceTermInput) attendanceTermInput.value = record.term || "";
    if (attendanceYearInput) attendanceYearInput.value = record.academic_year || "";
    if (attendanceStatusInput) attendanceStatusInput.value = record.status || "present";
    if (attendanceRemarksInput) attendanceRemarksInput.value = record.remarks || "";

    const submitBtn = attendanceForm ? attendanceForm.querySelector("button[type='submit']") : null;
    if (submitBtn) submitBtn.textContent = "Update Attendance";

    if (attendanceForm) {
      attendanceForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function updateQuickTotals() {
    const statuses = Array.from(document.querySelectorAll(".quick-status"));
    const total = statuses.length;
    const present = statuses.filter((el) => el.value === "present").length;
    const absent = statuses.filter((el) => el.value === "absent").length;

    const totalBox = document.getElementById("quick_total_count");
    const presentBox = document.getElementById("quick_present_count");
    const absentBox = document.getElementById("quick_absent_count");

    if (totalBox) totalBox.textContent = String(total);
    if (presentBox) presentBox.textContent = String(present);
    if (absentBox) absentBox.textContent = String(absent);
  }

  function setAllQuickStatuses(status) {
    document.querySelectorAll(".quick-status").forEach((select) => {
      select.value = status;
    });
    updateQuickTotals();
  }

  async function loadQuickStudents() {
    if (!quickBranch || !quickClass || !quickBox || !saveQuickBtn) return;

    if (!quickBranch.value || !quickClass.value) {
      alert("Please select branch and class.");
      return;
    }

    quickBox.innerHTML = "<p>Loading students...</p>";

    try {
      const response = await fetch(`${API}/api/students?branch_id=${encodeURIComponent(quickBranch.value)}`, {
        headers: authHeaders(false)
      });
      const data = await response.json();
      const students = (data.students || []).filter((student) =>
        String(student.class_id || "") === String(quickClass.value) &&
        String(student.status || "").toLowerCase() === "active"
      );

      if (students.length === 0) {
        quickBox.innerHTML = "<p>No active students found for selected class.</p>";
        saveQuickBtn.style.display = "none";
        if (quickMarkAllButtons) quickMarkAllButtons.style.display = "none";
        return;
      }

      let html = `
        <div id="quickAttendanceTotals" style="display:flex; gap:20px; margin:15px 0; font-weight:bold;">
          <div>Total Students: <span id="quick_total_count">0</span></div>
          <div>Present: <span id="quick_present_count">0</span></div>
          <div>Absent: <span id="quick_absent_count">0</span></div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Admission No.</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
      `;

      students.forEach((student) => {
        html += `
          <tr>
            <td>${safe(student.full_name)}</td>
            <td>${safe(student.admission_number)}</td>
            <td>
              <select class="quick-status" data-student-id="${student.id}">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </td>
            <td>
              <input type="text" class="quick-remarks" data-student-id="${student.id}" placeholder="Optional">
            </td>
          </tr>
        `;
      });

      html += "</tbody></table>";
      quickBox.innerHTML = html;

      document.querySelectorAll(".quick-status").forEach((select) => {
        select.addEventListener("change", updateQuickTotals);
      });

      saveQuickBtn.style.display = "inline-block";
      if (quickMarkAllButtons) quickMarkAllButtons.style.display = "block";
      updateQuickTotals();
    } catch (error) {
      console.error(error);
      quickBox.innerHTML = "<p>Could not load students.</p>";
      saveQuickBtn.style.display = "none";
      if (quickMarkAllButtons) quickMarkAllButtons.style.display = "none";
    }
  }

  async function saveQuickAttendance() {
    if (!quickBranch || !quickClass || !quickDate || !quickTerm || !quickYear || !saveQuickBtn) return;

    if (!quickBranch.value || !quickClass.value || !quickDate.value || !quickTerm.value || !quickYear.value) {
      alert("Please select branch, class, date, term, and academic year.");
      return;
    }

    const statuses = Array.from(document.querySelectorAll(".quick-status"));
    if (statuses.length === 0) {
      alert("No students loaded.");
      return;
    }

    const records = statuses.map((select) => {
      const studentId = select.dataset.studentId;
      const remarksInput = document.querySelector(`.quick-remarks[data-student-id="${studentId}"]`);

      return {
        branch_id: quickBranch.value,
        student_id: studentId,
        class_id: quickClass.value,
        teacher_id: teacherSelect ? (teacherSelect.value || null) : null,
        attendance_date: quickDate.value,
        term: quickTerm.value,
        academic_year: quickYear.value,
        status: select.value,
        remarks: remarksInput ? remarksInput.value.trim() : ""
      };
    });

    saveQuickBtn.disabled = true;
    saveQuickBtn.textContent = "Saving...";

    try {
      const response = await fetch(`${API}/api/attendance/bulk`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ records })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save quick attendance.");
      }

      alert("Quick attendance saved successfully.");
      await loadAttendanceRecords();
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not save quick attendance.");
    } finally {
      saveQuickBtn.disabled = false;
      saveQuickBtn.textContent = "Save Quick Attendance";
    }
  }

  function printAttendanceSheet() {
    const rows = attendanceRecords.map((record) => `
      <tr>
        <td>${safe(record.branch_name)}</td>
        <td>${safe(record.student_name)}</td>
        <td>${safe(record.admission_number)}</td>
        <td>${safe(record.class_name)}</td>
        <td>${safe(record.teacher_name)}</td>
        <td>${safe(record.attendance_date ? String(record.attendance_date).slice(0, 10) : "")}</td>
        <td>${safe(record.term)}</td>
        <td>${safe(record.academic_year)}</td>
        <td>${safe(formatStatus(record.status))}</td>
        <td>${safe(record.remarks)}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank", "width=1100,height=750");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; padding: 18px; }
          .header { text-align: center; border-bottom: 3px solid #073b70; margin-bottom: 14px; padding-bottom: 8px; }
          .header h1 { margin: 0; color: #073b70; }
          .summary { display: flex; gap: 22px; margin-bottom: 12px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 6px; font-size: 12px; text-align: left; }
          th { background: #073b70; color: #fff; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Print</button>
        <div class="header">
          <h1>Delight International School</h1>
          <p><strong>Attendance Sheet</strong></p>
        </div>
        <div class="summary">
          <div>Present: ${safe(document.getElementById("attendancePresentCount")?.textContent || "0")}</div>
          <div>Absent: ${safe(document.getElementById("attendanceAbsentCount")?.textContent || "0")}</div>
          <div>Total: ${safe(document.getElementById("attendanceTotalCount")?.textContent || "0")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Branch</th><th>Student</th><th>Admission No.</th><th>Class</th><th>Teacher</th>
              <th>Date</th><th>Term</th><th>Academic Year</th><th>Status</th><th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="10">No attendance records found.</td></tr>'}
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

  if (attendanceTableBody) {
    attendanceTableBody.addEventListener("click", function (event) {
      const editBtn = event.target.closest(".edit-attendance-btn");
      if (!editBtn) return;

      try {
        const record = JSON.parse(decodeURIComponent(editBtn.dataset.record || ""));
        startEditAttendance(record);
      } catch (error) {
        console.error(error);
        alert("Could not open attendance record for editing.");
      }
    });
  }

  if (branchSelect) {
    branchSelect.addEventListener("change", async function () {
      const branchId = branchSelect.value;
      await loadStudentsByBranch(branchId, studentSelect);
      await loadTeachersByBranch(branchId);
    });
  }

  if (loadQuickBtn) {
    loadQuickBtn.addEventListener("click", loadQuickStudents);
  }

  if (saveQuickBtn) {
    saveQuickBtn.addEventListener("click", saveQuickAttendance);
  }

  if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener("click", function () {
      setAllQuickStatuses("present");
    });
  }

  if (markAllAbsentBtn) {
    markAllAbsentBtn.addEventListener("click", function () {
      setAllQuickStatuses("absent");
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", function (event) {
      event.preventDefault();
      printAttendanceSheet();
    });
  }

  (async function init() {
    await loadSettingsToAttendanceFields();

    if (isBranchAdmin()) {
      const branchId = String(getAdminBranchId() || "");

      if (branchSelect) {
        branchSelect.innerHTML = `<option value="${safe(branchId)}">My Branch</option>`;
        branchSelect.value = branchId;
        branchSelect.disabled = true;
      }

      if (quickBranch) {
        quickBranch.innerHTML = `<option value="${safe(branchId)}">My Branch</option>`;
        quickBranch.value = branchId;
        quickBranch.disabled = true;
      }

      await loadStudentsByBranch(branchId, studentSelect);
      await loadTeachersByBranch(branchId);
    } else {
      await loadBranchesInto(branchSelect, true);
      await loadBranchesInto(quickBranch, true);
    }

    await loadClassesInto(quickClass);
    await loadAttendanceRecords();
  })();
});
