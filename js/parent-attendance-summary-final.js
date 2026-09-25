document.addEventListener("DOMContentLoaded", function () {
  const childrenSelector =
    document.getElementById("attendanceChildrenSelector");

  const tableBody =
    document.getElementById("parentAttendanceTableBody");

  const countText =
    document.getElementById("parentAttendanceCountText");

  const heading =
    document.getElementById("attendanceRecordsHeading");

  const rateBox =
    document.getElementById("attendanceRate");

  const presentBox =
    document.getElementById("attendancePresent");

  const absentBox =
    document.getElementById("attendanceAbsent");

  const lateBox =
    document.getElementById("attendanceLate");

  let children = [];
  let attendance = [];
  let selectedChildId = null;

  function headers() {
    const token = localStorage.getItem("token");

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function titleCase(value) {
    const text = String(value || "").trim();

    if (!text) return "";

    return text
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: headers()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load attendance."
      );
    }

    return data;
  }

  function getSelectedChild() {
    return children.find(
      child => Number(child.id) === Number(selectedChildId)
    ) || children[0] || null;
  }

  function selectedAttendance() {
    return attendance.filter(
      record =>
        Number(record.student_id) ===
        Number(selectedChildId)
    );
  }

  function renderChildren() {
    if (!childrenSelector) return;

    if (!children.length) {
      childrenSelector.innerHTML =
        "<p>No active children found.</p>";
      return;
    }

    childrenSelector.innerHTML = children
      .map(child => {
        const active =
          Number(child.id) === Number(selectedChildId)
            ? " active"
            : "";

        return `
          <button
            type="button"
            class="attendance-child-card${active}"
            data-child-id="${safe(child.id)}"
          >
            <strong>
              ${safe(child.full_name || "Student")}
            </strong>

            <span>
              ${safe(child.class_name || "Class not assigned")}
            </span>

            <span>
              ${safe(child.branch_name || "Branch not assigned")}
            </span>
          </button>
        `;
      })
      .join("");

    childrenSelector
      .querySelectorAll(".attendance-child-card")
      .forEach(button => {
        button.addEventListener("click", function () {
          selectedChildId = this.dataset.childId;

          renderChildren();
          renderAttendance();
        });
      });
  }

  function renderSummary(records) {
    let present = 0;
    let absent = 0;
    let late = 0;

    records.forEach(record => {
      const status =
        String(record.status || "")
          .trim()
          .toLowerCase();

      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
    });

    const total = records.length;

    const rate =
      total > 0
        ? Math.round((present / total) * 100)
        : null;

    rateBox.textContent =
      rate === null ? "--" : `${rate}%`;

    presentBox.textContent =
      total ? String(present) : "--";

    absentBox.textContent =
      total ? String(absent) : "--";

    lateBox.textContent =
      total ? String(late) : "--";
  }

  function renderAttendance() {
    const child = getSelectedChild();

    if (!child) {
      renderSummary([]);

      heading.textContent = "Attendance Records";
      countText.textContent = "";

      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            No active child is linked to this account.
          </td>
        </tr>
      `;

      return;
    }

    const records = selectedAttendance();

    heading.textContent =
      `${child.full_name || "Student"} - Attendance`;

    countText.textContent =
      records.length
        ? `Showing ${records.length} attendance record(s)`
        : "No attendance records available yet.";

    renderSummary(records);

    if (!records.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">
            No attendance records found for
            ${safe(child.full_name || "this child")}.
          </td>
        </tr>
      `;

      return;
    }

    tableBody.innerHTML = records
      .map(record => `
        <tr>
          <td>
            ${safe(formatDate(record.attendance_date))}
          </td>

          <td>
            ${safe(record.term || "")}
          </td>

          <td>
            ${safe(record.academic_year || "")}
          </td>

          <td>
            <span class="attendance-status">
              ${safe(titleCase(record.status))}
            </span>
          </td>

          <td>
            ${safe(record.remarks || "")}
          </td>
        </tr>
      `)
      .join("");
  }

  async function loadAttendancePage() {
    try {
      const [childrenData, attendanceData] =
        await Promise.all([
          fetchJson("/api/parents/my/children"),
          fetchJson("/api/parents/my/attendance")
        ]);

      children = childrenData.children || [];
      attendance = attendanceData.attendance || [];

      selectedChildId =
        children.length ? children[0].id : null;

      renderChildren();
      renderAttendance();

    } catch (error) {
      console.error(
        "Parent attendance error:",
        error
      );

      if (childrenSelector) {
        childrenSelector.innerHTML =
          `<p>${safe(error.message)}</p>`;
      }

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5">
              ${safe(error.message)}
            </td>
          </tr>
        `;
      }

      renderSummary([]);
    }
  }

  loadAttendancePage();
});
