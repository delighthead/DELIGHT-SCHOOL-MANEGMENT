document.addEventListener("DOMContentLoaded", function () {
  const API = "";

  const body = document.getElementById("teacherAttendanceRegisterBody");
  const foot = document.getElementById("teacherAttendanceRegisterFoot");

  const branchInput = document.getElementById("admin_attendance_branch");
  const classInput = document.getElementById("admin_attendance_class");

  const termInput = document.getElementById("teacher_attendance_term");
  const yearInput = document.getElementById("teacher_academic_year");
  const weekInput = document.getElementById("teacherAttendanceWeek");
  const weekStartInput = document.getElementById("teacherAttendanceWeekStart");

  const teacherNameEl = document.getElementById("teacherAttendanceTeacherName");
  const classNameEl = document.getElementById("teacherAttendanceClassName");
  const boysCountEl = document.getElementById("teacherAttendanceBoysCount");
  const girlsCountEl = document.getElementById("teacherAttendanceGirlsCount");
  const enrolmentEl = document.getElementById("teacherAttendanceEnrolment");
  const weekHeadingEl = document.getElementById("teacherAttendanceWeekHeading");
  const messageEl = document.getElementById("teacherAttendanceMessage");

  const markAllPresentBtn = document.getElementById("teacherMarkAllPresentBtn");
  const markAllAbsentBtn = document.getElementById("teacherMarkAllAbsentBtn");
  const saveBtn = document.getElementById("teacherSaveAttendanceBtn");
  const printBtn = document.getElementById("teacherPrintAttendanceBtn");

  const dayHeadingIds = [
    "attendanceHeadingMon",
    "attendanceHeadingTue",
    "attendanceHeadingWed",
    "attendanceHeadingThu",
    "attendanceHeadingFri"
  ];

  let loggedInTeacher = null;
  let branches = [];
  let classes = [];
  let students = [];
  let allAttendance = [];
  let weekDates = [];

  function token() {
    return localStorage.getItem("token") || "";
  }

  function headers(json = false) {
    const h = {};
    if (json) h["Content-Type"] = "application/json";
    if (token()) h.Authorization = `Bearer ${token()}`;
    return h;
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showMessage(text, type = "success") {
    if (!messageEl) return;

    messageEl.textContent = text;
    messageEl.className = `register-message ${type}`;

    window.setTimeout(() => {
      messageEl.className = "register-message";
      messageEl.textContent = "";
    }, 5000);
  }

  function normalizeSex(value) {
    const sex = String(value || "").trim().toLowerCase();

    if (sex === "male" || sex === "m" || sex === "boy") return "Male";
    if (sex === "female" || sex === "f" || sex === "girl") return "Female";

    return String(value || "").trim();
  }

  function sexLetter(value) {
    const sex = normalizeSex(value);
    if (sex === "Male") return "M";
    if (sex === "Female") return "F";
    return sex ? sex.charAt(0).toUpperCase() : "";
  }

  function studentName(student) {
    return (
      student.full_name ||
      [student.first_name, student.other_name, student.surname]
        .filter(Boolean)
        .join(" ")
    ).trim();
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseIsoDate(value) {
    const parts = String(value || "").split("-").map(Number);

    if (
      parts.length !== 3 ||
      !parts[0] ||
      !parts[1] ||
      !parts[2]
    ) {
      return null;
    }

    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function mondayOf(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const difference = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + difference);
    return d;
  }

  function formatHeadingDate(iso) {
    const date = parseIsoDate(iso);
    if (!date) return "";

    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  function getTermWeekOneMonday() {
    const academicYear = String(yearInput.value || "").trim();
    const term = String(termInput.value || "").trim();

    if (academicYear === "2026/2027" && term === "Term 1") {
      // School reopens Tuesday, 1 September 2026.
      // Monday 31 August is retained as the Week 1 Monday position,
      // but is treated as a non-school day.
      return new Date(2026, 7, 31);
    }

    const selected = parseIsoDate(weekStartInput.value);

    if (selected) {
      return mondayOf(selected);
    }

    return mondayOf(new Date());
  }

  function isNonSchoolDay(date) {
    const iso = toIsoDate(date);
    const academicYear = String(yearInput.value || "").trim();
    const term = String(termInput.value || "").trim();

    // Week 1 begins when school reopens on Tuesday, 1 September 2026.
    // Monday 31 August remains only as the Monday position in the
    // five-day register grid. It cannot be marked or counted.
    return (
      academicYear === "2026/2027" &&
      term === "Term 1" &&
      iso === "2026-08-31"
    );
  }

  function isWithinSelectedTerm(dateValue) {
    const iso = String(dateValue || "").slice(0, 10);
    const academicYear = String(yearInput.value || "").trim();
    const term = String(termInput.value || "").trim();

    if (academicYear === "2026/2027" && term === "Term 1") {
      return iso >= "2026-09-01" && iso <= "2026-12-17";
    }

    return true;
  }

  function calculateWeekDates() {
    const weekNumber = Math.max(
      1,
      Math.min(16, Number(weekInput.value || 1))
    );

    const weekOneMonday = getTermWeekOneMonday();
    const monday = new Date(weekOneMonday);

    monday.setDate(
      weekOneMonday.getDate() + ((weekNumber - 1) * 7)
    );

    weekStartInput.value = toIsoDate(monday);

    weekDates = [];

    for (let i = 0; i < 5; i += 1) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      weekDates.push({
        iso: toIsoDate(date),
        nonSchoolDay: isNonSchoolDay(date)
      });
    }

    if (weekHeadingEl) {
      weekHeadingEl.textContent =
        `Week ${weekNumber} (${formatHeadingDate(weekDates[0].iso)} - ${formatHeadingDate(weekDates[4].iso)})`;
    }

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    dayHeadingIds.forEach((id, index) => {
      const el = document.getElementById(id);

      if (!el) return;

      const day = weekDates[index];

      el.innerHTML =
        `${labels[index]}<br><small>${safe(formatHeadingDate(day.iso))}</small>`;
    });
  }

  function recordDate(record) {
    return record.attendance_date
      ? String(record.attendance_date).slice(0, 10)
      : "";
  }

  function findAttendance(studentId, date) {
    return allAttendance.find(
      (record) =>
        String(record.student_id) === String(studentId) &&
        recordDate(record) === date &&
        String(record.term || "") === String(termInput.value || "") &&
        String(record.academic_year || "") === String(yearInput.value || "")
    );
  }

  function termTotals(studentId) {
    let present = 0;
    let absent = 0;

    allAttendance.forEach((record) => {
      if (
        String(record.student_id) !== String(studentId) ||
        String(record.term || "") !== String(termInput.value || "") ||
        String(record.academic_year || "") !== String(yearInput.value || "") ||
        !isWithinSelectedTerm(recordDate(record))
      ) {
        return;
      }

      const status = String(record.status || "").toLowerCase();

      if (status === "present") present += 1;
      if (status === "absent") absent += 1;
    });

    return { present, absent };
  }

  function statusFromRecord(record) {
    const status = String(record?.status || "").toLowerCase();

    if (status === "present") return "present";
    if (status === "absent") return "absent";

    return "";
  }

  function statusLetter(status) {
    if (status === "present") return "P";
    if (status === "absent") return "A";
    if (status === "holiday") return "H";
    return "";
  }

  function orderedStudents() {
    return [...students].sort((a, b) => {
      const aSex = normalizeSex(a.sex);
      const bSex = normalizeSex(b.sex);

      const rank = (sex) => {
        if (sex === "Male") return 0;
        if (sex === "Female") return 1;
        return 2;
      };

      if (rank(aSex) !== rank(bSex)) {
        return rank(aSex) - rank(bSex);
      }

      return studentName(a).localeCompare(studentName(b));
    });
  }

  function renderSavedAttendance() {
    const savedBody = document.getElementById("teacherSavedAttendanceBody");

    if (!savedBody) return;

    if (!students.length) {
      savedBody.innerHTML = `
        <tr>
          <td colspan="8">No learners found.</td>
        </tr>
      `;
      return;
    }

    const rows = orderedStudents().map((student) => {
      const totalPresent = allAttendance.filter((record) => {
        return (
          String(record.student_id) === String(student.id) &&
          String(record.term || "") === String(termInput.value || "") &&
          String(record.academic_year || "") ===
            String(yearInput.value || "") &&
          isWithinSelectedTerm(recordDate(record)) &&
          String(record.status || "").toLowerCase() === "present"
        );
      }).length;

      return `
        <tr>
          <td>${safe(student.admission_number || "")}</td>
          <td class="student-name">${safe(studentName(student))}</td>
          <td>${safe(sexLetter(student.sex))}</td>
          <td>${safe(student.class_name || "")}</td>
          <td><strong>${safe(totalPresent)}</strong></td>
          <td>${safe(termInput.value || "")}</td>
          <td>${safe(yearInput.value || "")}</td>
          <td>
            <button
              type="button"
              class="primary-btn student-attendance-print-btn"
              data-student-id="${safe(student.id)}"
            >Print</button>
          </td>
        </tr>
      `;
    });

    savedBody.innerHTML = rows.join("");

    savedBody
      .querySelectorAll(".student-attendance-print-btn")
      .forEach((button) => {
        button.addEventListener("click", () => {
          printStudentAttendance(button.dataset.studentId);
        });
      });
  }

  function renderRegister() {
    if (!body || !foot) return;

    calculateWeekDates();

    if (!students.length) {
      body.innerHTML =
        '<tr><td colspan="12">Select a branch and class, or no active students were found for the selected class.</td></tr>';
      foot.innerHTML = "";
      return;
    }

    const rows = [];

    orderedStudents().forEach((student, index) => {
      const cells = weekDates.map((day) => {
        const existing = findAttendance(student.id, day.iso);
        const status = day.nonSchoolDay
          ? "holiday"
          : statusFromRecord(existing);

        return `
          <td class="attendance-cell">
            <button
              type="button"
              class="attendance-toggle"
              data-student-id="${safe(student.id)}"
              data-class-id="${safe(student.class_id || "")}"
              data-date="${safe(day.iso)}"
              data-status="${safe(status)}"
              title="${safe(day.iso)}"
              ${day.nonSchoolDay ? "disabled" : ""}
            >${safe(day.nonSchoolDay ? "" : statusLetter(status))}</button>
          </td>
        `;
      }).join("");

      const term = termTotals(student.id);

      rows.push(`
        <tr data-student-row="${safe(student.id)}">
          <td class="student-number">${index + 1}</td>
          <td class="student-name">${safe(studentName(student))}</td>
          <td class="sex-column">${safe(sexLetter(student.sex))}</td>

          ${cells}

          <td class="weekly-total week-present">0</td>
          <td class="weekly-total week-absent">0</td>

          <td class="term-total term-present">${term.present}</td>
          <td class="term-total term-absent">${term.absent}</td>
        </tr>
      `);
    });

    body.innerHTML = rows.join("");

    body.querySelectorAll(".attendance-toggle").forEach((button) => {
      button.addEventListener("click", function () {
        const current = this.dataset.status || "";

        if (current === "holiday") return;

        let next;

        if (current === "") {
          next = "present";
        } else if (current === "present") {
          next = "absent";
        } else {
          next = "";
        }

        this.dataset.status = next;
        this.textContent = statusLetter(next);

        recalculateRegister();
      });
    });

    recalculateRegister();
    renderSavedAttendance();
  }

  function countDay(index, sex, status) {
    let count = 0;

    body.querySelectorAll("tr[data-student-row]").forEach((row) => {
      const studentId = row.dataset.studentRow;
      const student = students.find(
        (item) => String(item.id) === String(studentId)
      );

      if (!student) return;

      if (sex && normalizeSex(student.sex) !== sex) return;

      const button = row.querySelectorAll(".attendance-toggle")[index];

      if (button && button.dataset.status === status) {
        count += 1;
      }
    });

    return count;
  }

  function summaryRow(label, values, weekPresent = "", weekAbsent = "") {
    return `
      <tr>
        <td colspan="3" class="register-summary-label">${safe(label)}</td>
        ${values.map((value) => `<td>${safe(value)}</td>`).join("")}
        <td class="weekly-total">${safe(weekPresent)}</td>
        <td class="weekly-total">${safe(weekAbsent)}</td>
        <td class="term-total"></td>
        <td class="term-total"></td>
      </tr>
    `;
  }

  function recalculateRegister() {
    if (!body || !foot) return;

    let classWeekPresent = 0;
    let classWeekAbsent = 0;

    body.querySelectorAll("tr[data-student-row]").forEach((row) => {
      const buttons = Array.from(row.querySelectorAll(".attendance-toggle"));

      const present = buttons.filter(
        (button) => button.dataset.status === "present"
      ).length;

      const absent = buttons.filter(
        (button) => button.dataset.status === "absent"
      ).length;

      const presentCell = row.querySelector(".week-present");
      const absentCell = row.querySelector(".week-absent");

      if (presentCell) presentCell.textContent = String(present);
      if (absentCell) absentCell.textContent = String(absent);

      classWeekPresent += present;
      classWeekAbsent += absent;

      const studentId = row.dataset.studentRow;
      const storedTerm = termTotals(studentId);

      let visibleNewPresent = 0;
      let visibleNewAbsent = 0;
      let visibleStoredPresent = 0;
      let visibleStoredAbsent = 0;

      buttons.forEach((button) => {
        const existing = findAttendance(studentId, button.dataset.date);
        const oldStatus = statusFromRecord(existing);
        const newStatus = button.dataset.status;

        if (oldStatus === "present") visibleStoredPresent += 1;
        if (oldStatus === "absent") visibleStoredAbsent += 1;

        if (newStatus === "present") visibleNewPresent += 1;
        if (newStatus === "absent") visibleNewAbsent += 1;
      });

      const termPresent =
        storedTerm.present - visibleStoredPresent + visibleNewPresent;

      const termAbsent =
        storedTerm.absent - visibleStoredAbsent + visibleNewAbsent;

      const termPresentCell = row.querySelector(".term-present");
      const termAbsentCell = row.querySelector(".term-absent");

      if (termPresentCell) termPresentCell.textContent = String(termPresent);
      if (termAbsentCell) termAbsentCell.textContent = String(termAbsent);
    });

    const boysPresent = weekDates.map((_, index) =>
      countDay(index, "Male", "present")
    );

    const girlsPresent = weekDates.map((_, index) =>
      countDay(index, "Female", "present")
    );

    const totalPresent = weekDates.map(
      (_, index) =>
        countDay(index, null, "present")
    );

    const boysAbsent = weekDates.map((_, index) =>
      countDay(index, "Male", "absent")
    );

    const girlsAbsent = weekDates.map((_, index) =>
      countDay(index, "Female", "absent")
    );

    const totalAbsent = weekDates.map(
      (_, index) =>
        countDay(index, null, "absent")
    );

    foot.innerHTML =
      summaryRow(
        "Boys Present",
        boysPresent,
        boysPresent.reduce((a, b) => a + b, 0),
        ""
      ) +
      summaryRow(
        "Girls Present",
        girlsPresent,
        girlsPresent.reduce((a, b) => a + b, 0),
        ""
      ) +
      summaryRow(
        "Total Present",
        totalPresent,
        classWeekPresent,
        ""
      ) +
      summaryRow(
        "Boys Absent",
        boysAbsent,
        "",
        boysAbsent.reduce((a, b) => a + b, 0)
      ) +
      summaryRow(
        "Girls Absent",
        girlsAbsent,
        "",
        girlsAbsent.reduce((a, b) => a + b, 0)
      ) +
      summaryRow(
        "Total Absent",
        totalAbsent,
        "",
        classWeekAbsent
      );
  }

  async function loadSettings() {
    try {
      const response = await fetch(`${API}/api/settings`);
      const data = await response.json();
      const settings = data.settings || {};

      if (settings.current_term && termInput) {
        termInput.value = settings.current_term;
      }

      if (settings.academic_year && yearInput) {
        yearInput.value = settings.academic_year;
      }
    } catch (error) {
      console.error("Could not load school settings:", error);
    }
  }

  function isBranchAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "teacher_admin";
  }

  function adminBranchId() {
    return getUser().branch_id || "";
  }

  async function loadBranches() {
    if (!branchInput) return;

    const response = await fetch(`${API}/api/branches`, {
      headers: headers(false)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load branches.");
    }

    branches = Array.isArray(data.branches) ? data.branches : [];

    branchInput.innerHTML = '<option value="">Select branch</option>';

    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.id;
      option.textContent = branch.branch_name || "Branch";
      branchInput.appendChild(option);
    });

    if (isBranchAdmin()) {
      const ownBranch = String(adminBranchId());

      if (!ownBranch) {
        throw new Error("No branch is assigned to this account.");
      }

      branchInput.value = ownBranch;
      branchInput.disabled = true;
    }
  }

  async function loadClasses() {
    if (!classInput) return;

    classInput.innerHTML = '<option value="">Loading classes...</option>';

    const response = await fetch(`${API}/api/classes`, {
      headers: headers(false)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load classes.");
    }

    classes = Array.isArray(data.classes) ? data.classes : [];

    classInput.innerHTML = '<option value="">Select class</option>';

    classes.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls.id;
      option.textContent = cls.class_name || "Class";
      classInput.appendChild(option);
    });
  }

  async function loadStudents() {
    students = [];

    if (!branchInput?.value || !classInput?.value) {
      updateClassInfo();
      renderRegister();
      return;
    }

    const response = await fetch(
      `${API}/api/students?branch_id=${encodeURIComponent(branchInput.value)}`,
      { headers: headers(false) }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load students.");
    }

    students = (Array.isArray(data.students) ? data.students : [])
      .filter((student) =>
        String(student.class_id || "") === String(classInput.value) &&
        String(student.status || "").toLowerCase() === "active"
      );

    updateClassInfo();
  }

  function updateClassInfo() {
    const boys = students.filter(
      (student) => normalizeSex(student.sex) === "Male"
    ).length;

    const girls = students.filter(
      (student) => normalizeSex(student.sex) === "Female"
    ).length;

    if (boysCountEl) boysCountEl.textContent = String(boys);
    if (girlsCountEl) girlsCountEl.textContent = String(girls);
    if (enrolmentEl) enrolmentEl.textContent = String(students.length);

    if (teacherNameEl) {
      const selected = branchInput?.selectedOptions?.[0];
      teacherNameEl.textContent =
        branchInput?.value && selected
          ? selected.textContent
          : "Select branch";
    }

    if (classNameEl) {
      const selected = classInput?.selectedOptions?.[0];
      classNameEl.textContent =
        classInput?.value && selected
          ? selected.textContent
          : "Select class";
    }
  }

  async function loadAttendance() {
    allAttendance = [];

    if (!branchInput?.value) {
      return;
    }

    const response = await fetch(
      `${API}/api/attendance?branch_id=${encodeURIComponent(branchInput.value)}`,
      {
        headers: headers(false)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load attendance records."
      );
    }

    allAttendance = Array.isArray(data.attendance)
      ? data.attendance
      : [];
  }

  function setWholeWeek(status) {
    body.querySelectorAll(".attendance-toggle").forEach((button) => {
      if (button.dataset.status === "holiday") return;

      button.dataset.status = status;
      button.textContent = statusLetter(status);
    });

    recalculateRegister();
  }

  async function saveRegister() {
    if (!branchInput?.value) {
      showMessage("Please select a branch.", "error");
      return;
    }

    if (!classInput?.value) {
      showMessage("Please select a class.", "error");
      return;
    }

    if (!termInput.value) {
      showMessage("Please select the term.", "error");
      return;
    }

    if (!yearInput.value.trim()) {
      showMessage("Academic year is required.", "error");
      return;
    }

    const buttons = Array.from(
      body.querySelectorAll(".attendance-toggle")
    );

    const records = buttons
      .filter((button) => {
        const original = statusFromRecord(
          findAttendance(button.dataset.studentId, button.dataset.date)
        );
        return button.dataset.status !== original &&
          button.dataset.status !== "holiday";
      })
      .map((button) => ({
        branch_id: branchInput.value,
        student_id: button.dataset.studentId,
        class_id: button.dataset.classId || classInput.value,
        teacher_id: null,
        attendance_date: button.dataset.date,
        term: termInput.value,
        academic_year: yearInput.value.trim(),
        status: button.dataset.status,
        remarks: ""
      }));

    if (!records.length) {
      showMessage(
        "No attendance changes to save.",
        "error"
      );
      return;
    }

    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const response = await fetch(`${API}/api/attendance/bulk`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ records })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save attendance register."
        );
      }

      await loadAttendance();
      renderRegister();

      showMessage(
        "Attendance register saved successfully.",
        "success"
      );
    } catch (error) {
      console.error(error);
      showMessage(
        error.message || "Cannot connect to backend.",
        "error"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  }

  function changeWeek() {
    renderRegister();
  }

  function setDefaultWeekStart() {
    if (!weekStartInput.value) {
      weekStartInput.value = toIsoDate(mondayOf(new Date()));
    }
  }

  function printStudentAttendance(studentId) {
    const student = students.find(
      (item) => String(item.id) === String(studentId)
    );

    if (!student) {
      alert("Learner could not be found.");
      return;
    }

    const records = allAttendance
      .filter((record) => {
        const status = String(record.status || "").toLowerCase();

        return (
          String(record.student_id) === String(student.id) &&
          String(record.term || "") === String(termInput.value || "") &&
          String(record.academic_year || "") ===
            String(yearInput.value || "") &&
          isWithinSelectedTerm(recordDate(record)) &&
          (status === "present" || status === "absent")
        );
      })
      .sort((a, b) => recordDate(a).localeCompare(recordDate(b)));

    const present = records.filter(
      (record) => String(record.status || "").toLowerCase() === "present"
    ).length;

    const absent = records.filter(
      (record) => String(record.status || "").toLowerCase() === "absent"
    ).length;

    const detailRows = records.length
      ? records.map((record, index) => {
          const iso = recordDate(record);
          const date = new Date(`${iso}T12:00:00`);
          const day = date.toLocaleDateString("en-GB", {
            weekday: "long"
          });
          const displayDate = date.toLocaleDateString("en-GB");
          const status =
            String(record.status || "").toLowerCase() === "present"
              ? "Present"
              : "Absent";

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${safe(displayDate)}</td>
              <td>${safe(day)}</td>
              <td>${safe(status)}</td>
            </tr>
          `;
        }).join("")
      : `
          <tr>
            <td colspan="4">No saved attendance records found for this learner.</td>
          </tr>
        `;

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      alert("Please allow pop-ups to print the learner attendance summary.");
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${safe(studentName(student))} - Attendance Summary</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 30px;
      color: #000;
    }

    h1, h2 {
      text-align: center;
      margin: 0 0 10px;
    }

    .student-details {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .student-details td {
      border: 1px solid #000;
      padding: 8px;
    }

    .attendance-details {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    .attendance-details th,
    .attendance-details td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
    }

    .totals {
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }

    @media print {
      body {
        margin: 15mm;
      }
    }
  </style>
</head>
<body>

  <h1>Delight International School</h1>
  <h2>Individual Learner Attendance Summary</h2>

  <table class="student-details">
    <tr>
      <td><strong>Admission No.</strong></td>
      <td>${safe(student.admission_number || "")}</td>
      <td><strong>Name</strong></td>
      <td>${safe(studentName(student))}</td>
    </tr>
    <tr>
      <td><strong>Sex</strong></td>
      <td>${safe(sexLetter(student.sex))}</td>
      <td><strong>Class</strong></td>
      <td>${safe(student.class_name || "")}</td>
    </tr>
    <tr>
      <td><strong>Term</strong></td>
      <td>${safe(termInput.value || "")}</td>
      <td><strong>Academic Year</strong></td>
      <td>${safe(yearInput.value || "")}</td>
    </tr>
  </table>

  <table class="attendance-details">
    <thead>
      <tr>
        <th>No.</th>
        <th>Date</th>
        <th>Day</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${detailRows}
    </tbody>
  </table>

  <div class="totals">
    Present: ${present}
    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    Absent: ${absent}
    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    Total Recorded School Days: ${records.length}
  </div>

</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function printRegister() {
    const section = document.getElementById("savedAttendanceSummarySection");

    if (!section) {
      alert("Saved Attendance Summary could not be found.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=700");

    if (!printWindow) {
      alert("Please allow pop-ups to print the attendance summary.");
      return;
    }

    const printable = section.cloneNode(true);
    const printButton = printable.querySelector("#teacherPrintAttendanceBtn");
    if (printButton) printButton.remove();

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Saved Attendance Summary</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 30px;
      color: #000;
    }
    h2 {
      text-align: center;
      margin-bottom: 10px;
    }
    p {
      text-align: center;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
    }
    th {
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${printable.innerHTML}
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  async function initialize() {
    try {
      setDefaultWeekStart();

      await loadSettings();
      await loadBranches();
      await loadClasses();
      await loadAttendance();

      if (isBranchAdmin() && branchInput.value) {
        updateClassInfo();
      }

      renderRegister();
    } catch (error) {
      console.error(error);

      if (body) {
        body.innerHTML =
          `<tr><td colspan="12">${safe(
            error.message || "Could not load attendance register."
          )}</td></tr>`;
      }

      showMessage(
        error.message || "Could not load attendance register.",
        "error"
      );
    }
  }

  if (branchInput) {
    branchInput.addEventListener("change", async () => {
      try {
        students = [];
        allAttendance = [];
        classInput.value = "";

        updateClassInfo();
        renderRegister();

        if (branchInput.value) {
          await loadAttendance();
        }

        renderRegister();
      } catch (error) {
        console.error(error);
        showMessage(
          error.message || "Could not load branch attendance.",
          "error"
        );
      }
    });
  }

  if (classInput) {
    classInput.addEventListener("change", async () => {
      try {
        await loadStudents();
        renderRegister();
      } catch (error) {
        console.error(error);
        showMessage(
          error.message || "Could not load students.",
          "error"
        );
      }
    });
  }

  if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener("click", () => {
      setWholeWeek("present");
    });
  }

  if (markAllAbsentBtn) {
    markAllAbsentBtn.addEventListener("click", () => {
      setWholeWeek("absent");
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveRegister);
  }

  if (printBtn) {
    printBtn.addEventListener("click", printRegister);
  }

  if (weekInput) {
    weekInput.addEventListener("change", changeWeek);
  }

  if (weekStartInput) {
    weekStartInput.addEventListener("change", changeWeek);
  }

  if (termInput) {
    termInput.addEventListener("change", renderRegister);
  }

  initialize();
});
