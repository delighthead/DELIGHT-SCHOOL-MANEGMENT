document.addEventListener("DOMContentLoaded", function () {
  const childBox = document.getElementById("parentChildBox");
  const selectorWrap = document.getElementById("parentChildSelectorWrap");
  const selector = document.getElementById("parentChildSelector");

  const childrenTotal = document.getElementById("summaryChildren");
  const attendanceTotal = document.getElementById("summaryAttendance");
  const feesTotal = document.getElementById("summaryFees");
  const resultsTotal = document.getElementById("summaryResults");

  const attendanceBox = document.getElementById("parentAttendanceSummary");
  const feesBox = document.getElementById("parentFeesSummary");
  const resultsBox = document.getElementById("parentResultsSummary");
  const reportsBox = document.getElementById("parentReportsSummary");
  const welcomeText = document.getElementById("parentWelcomeText");

  let children = [];
  let attendance = [];
  let fees = [];
  let scores = [];
  let reports = [];
  let selectedChildId = null;

  function headers() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function money(value) {
    const number = Number(value || 0);
    return `GHS ${number.toFixed(2)}`;
  }

  function normalizeStatus(value) {
    return String(value || "").trim().toLowerCase();
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: headers() });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Could not load ${url}`);
    }

    return data;
  }

  function getSelectedChild() {
    return children.find(
      child => Number(child.id) === Number(selectedChildId)
    ) || children[0] || null;
  }

  function rowsForChild(rows) {
    return rows.filter(
      row => Number(row.student_id) === Number(selectedChildId)
    );
  }

  function renderChild() {
    const child = getSelectedChild();

    if (!child) {
      childBox.innerHTML =
        `<div class="parent-empty">No active child is linked to this account.</div>`;
      return;
    }

    const photo = child.profile_picture
      ? `<img src="${safe(child.profile_picture)}" alt="Student Photo">`
      : `<span>${safe((child.full_name || "S").charAt(0).toUpperCase())}</span>`;

    childBox.innerHTML = `
      <div class="parent-child-summary">
        <div class="parent-child-photo">
          ${photo}
        </div>

        <div class="parent-child-info">
          <h3>${safe(child.full_name)}</h3>
          <p><strong>Student ID:</strong> ${safe(child.student_id || child.admission_number)}</p>
          <p><strong>Class:</strong> ${safe(child.class_name || "Not assigned")}</p>
          <p><strong>Branch:</strong> ${safe(child.branch_name || "")}</p>
          <p><strong>Status:</strong> ${safe(
            child.status
              ? child.status.charAt(0).toUpperCase() + child.status.slice(1)
              : ""
          )}</p>
        </div>
      </div>
    `;
  }

  function renderAttendance() {
    const rows = rowsForChild(attendance);

    if (!rows.length) {
      attendanceTotal.textContent = "--";
      attendanceBox.innerHTML =
        `<div class="parent-empty">No attendance records available yet.</div>`;
      return;
    }

    let present = 0;
    let absent = 0;
    let late = 0;
    let other = 0;

    rows.forEach(row => {
      const status = normalizeStatus(row.status);

      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
      else other++;
    });

    const percentage = rows.length
      ? Math.round((present / rows.length) * 100)
      : 0;

    attendanceTotal.textContent = `${percentage}%`;

    attendanceBox.innerHTML = `
      <div class="parent-stat-list">
        <div class="parent-stat-item">
          <strong>Present</strong>
          <span>${present}</span>
        </div>

        <div class="parent-stat-item">
          <strong>Absent</strong>
          <span>${absent}</span>
        </div>

        <div class="parent-stat-item">
          <strong>Late</strong>
          <span>${late}</span>
        </div>

        <div class="parent-stat-item">
          <strong>Total Records</strong>
          <span>${rows.length}</span>
        </div>
      </div>
    `;
  }

  function renderFees() {
    const rows = rowsForChild(fees).filter(row =>
      row.amount_payable !== null ||
      row.amount_paid !== null ||
      row.balance !== null
    );

    if (!rows.length) {
      feesTotal.textContent = "--";
      feesBox.innerHTML =
        `<div class="parent-empty">No fee records available yet.</div>`;
      return;
    }

    const payable = rows.reduce(
      (sum, row) => sum + Number(row.amount_payable || 0),
      0
    );

    const paid = rows.reduce(
      (sum, row) => sum + Number(row.amount_paid || 0),
      0
    );

    const balance = rows.reduce(
      (sum, row) => sum + Number(row.balance || 0),
      0
    );

    feesTotal.textContent = money(balance);

    feesBox.innerHTML = `
      <div class="parent-stat-list">
        <div class="parent-stat-item">
          <strong>Total Fees</strong>
          <span>${money(payable)}</span>
        </div>

        <div class="parent-stat-item">
          <strong>Amount Paid</strong>
          <span>${money(paid)}</span>
        </div>

        <div class="parent-stat-item">
          <strong>Balance</strong>
          <span>${money(balance)}</span>
        </div>

        <div class="parent-stat-item">
          <strong>Fee Records</strong>
          <span>${rows.length}</span>
        </div>
      </div>
    `;
  }

  function renderScores() {
    const rows = rowsForChild(scores).filter(
      row => row.total_score !== null && row.total_score !== ""
    );

    if (!rows.length) {
      resultsTotal.textContent = "--";
      resultsBox.innerHTML =
        `<div class="parent-empty">No approved results available yet.</div>`;
      return;
    }

    const average =
      rows.reduce((sum, row) => sum + Number(row.total_score || 0), 0) /
      rows.length;

    resultsTotal.textContent = `${average.toFixed(1)}%`;

    const latest = rows.slice(0, 4);

    resultsBox.innerHTML = `
      <div class="parent-stat-list">
        <div class="parent-stat-item">
          <strong>Average Score</strong>
          <span>${average.toFixed(1)}%</span>
        </div>

        <div class="parent-stat-item">
          <strong>Approved Subjects</strong>
          <span>${rows.length}</span>
        </div>
      </div>

      <div style="margin-top:14px;">
        ${latest.map(row => `
          <div class="parent-report-item">
            <strong>${safe(row.subject || "Subject")}</strong>
            <p>
              ${safe(row.term || "")}
              ${row.academic_year ? " • " + safe(row.academic_year) : ""}
              ${row.total_score !== null ? " • " + safe(row.total_score) + "%" : ""}
              ${row.grade ? " • Grade " + safe(row.grade) : ""}
            </p>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderReports() {
    if (!reports.length) {
      reportsBox.innerHTML =
        `<div class="parent-empty">No reports available yet.</div>`;
      return;
    }

    reportsBox.innerHTML = reports.slice(0, 4).map(report => `
      <div class="parent-report-item">
        <strong>${safe(report.report_name || "School Report")}</strong>
        <p>
          ${safe(report.report_type || "")}
          ${report.term ? " • " + safe(report.term) : ""}
          ${report.academic_year ? " • " + safe(report.academic_year) : ""}
          ${report.class_name ? " • " + safe(report.class_name) : ""}
        </p>
      </div>
    `).join("");
  }

  function renderAll() {
    childrenTotal.textContent = children.length;

    renderChild();
    renderAttendance();
    renderFees();
    renderScores();
    renderReports();
  }

  function setupSelector() {
    if (!children.length) {
      selectorWrap.style.display = "none";
      return;
    }

    selector.innerHTML = children.map(child => `
      <option value="${safe(child.id)}">
        ${safe(child.full_name)}${child.class_name ? " - " + safe(child.class_name) : ""}
      </option>
    `).join("");

    selectedChildId = children[0].id;
    selector.value = String(selectedChildId);

    selectorWrap.style.display =
      children.length > 1 ? "block" : "none";

    selector.addEventListener("change", function () {
      selectedChildId = this.value;
      renderAll();
    });
  }

  function setWelcomeName() {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const name = stored.full_name || stored.name || "";

      if (name) {
        welcomeText.textContent =
          `Welcome, ${name}. Here is an overview of your child's school information.`;
      }
    } catch (_) {}
  }

  async function loadDashboard() {
    setWelcomeName();

    try {
      const [
        childrenData,
        attendanceData,
        feesData,
        scoresData,
        reportsData
      ] = await Promise.all([
        fetchJson("/api/parents/my/children"),
        fetchJson("/api/parents/my/attendance"),
        fetchJson("/api/parents/my/fees"),
        fetchJson("/api/parents/my/scores"),
        fetchJson("/api/parents/my/reports")
      ]);

      children = childrenData.children || [];
      attendance = attendanceData.attendance || [];
      fees = feesData.fees || [];
      scores = scoresData.scores || [];
      reports = reportsData.reports || [];

      setupSelector();
      renderAll();

    } catch (error) {
      console.error("Parent dashboard error:", error);

      childBox.innerHTML =
        `<div class="parent-empty">${safe(error.message || "Could not load dashboard.")}</div>`;

      attendanceBox.innerHTML =
        `<div class="parent-empty">Could not load attendance.</div>`;

      feesBox.innerHTML =
        `<div class="parent-empty">Could not load fees.</div>`;

      resultsBox.innerHTML =
        `<div class="parent-empty">Could not load results.</div>`;

      reportsBox.innerHTML =
        `<div class="parent-empty">Could not load reports.</div>`;
    }
  }

  loadDashboard();
});
