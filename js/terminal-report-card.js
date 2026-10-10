/*
 * DELIGHT INTERNATIONAL SCHOOL
 * Terminal Examination Report Card
 *
 * This module will generate individual A4 report cards.
 * Existing report creation and database records are preserved.
 */

(function () {
  "use strict";

  const REPORT_TITLE = "TERMINAL EXAMINATION REPORT";

  const FOOTER_TEXT =
    "Designed & Developed by CRS Tech Solutions 0270556797 / 0244113286";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatScore(value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toFixed(1)
      : "—";
  }

  function calculateAttendance(records, studentId) {
    const studentRecords = records.filter(record =>
      String(record.student_id) === String(studentId)
    );

    const dailyAttendance = new Map();

    studentRecords.forEach(record => {
      if (!record.attendance_date) return;

      const date = String(record.attendance_date).slice(0, 10);
      const status = String(record.status || "").toLowerCase();

      if (status === "present" || status === "absent") {
        dailyAttendance.set(date, status);
      }
    });

    const statuses = [...dailyAttendance.values()];

    return {
      recordedDays: statuses.length,
      present: statuses.filter(status => status === "present").length,
      absent: statuses.filter(status => status === "absent").length
    };
  }



  function calculateJhsAggregate(scores, gradingSettings) {
    const normalize = value =>
      String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    const coreSubjects = {
      english: ["ENGLISH", "ENGLISHLANGUAGE"],
      mathematics: ["MATHEMATICS", "MATHS", "MATH"],
      science: [
        "INTEGRATEDSCIENCE",
        "GENERALSCIENCE",
        "SCIENCE"
      ],
      social: ["SOCIALSTUDIES"]
    };

    const validScores = scores
      .filter(score =>
        String(score.approval_status || "").toLowerCase() === "approved" &&
        score.total_score !== null &&
        score.total_score !== "" &&
        Number.isFinite(Number(score.total_score)) &&
        Number(score.total_score) >= 0 &&
        Number(score.total_score) <= 100
      )
      .map(score => {
        const result =
          typeof window.calculateGradeFromSettings === "function"
            ? window.calculateGradeFromSettings(
                Number(score.total_score),
                gradingSettings
              )
            : { grade: "" };

        return {
          subject: normalize(score.subject),
          grade: Number(result.grade)
        };
      })
      .filter(score =>
        Number.isInteger(score.grade) &&
        score.grade >= 1 &&
        score.grade <= 9
      );

    const selected = [];
    const used = new Set();

    for (const aliases of Object.values(coreSubjects)) {
      const index = validScores.findIndex(
        (score, position) =>
          !used.has(position) &&
          aliases.includes(score.subject)
      );

      if (index === -1) {
        return {
          complete: false,
          aggregate: null,
          message: "Incomplete"
        };
      }

      selected.push(validScores[index]);
      used.add(index);
    }

    const electives = validScores
      .filter((score, index) => !used.has(index))
      .sort((a, b) => a.grade - b.grade)
      .slice(0, 2);

    if (electives.length < 2) {
      return {
        complete: false,
        aggregate: null,
        message: "Incomplete"
      };
    }

    const aggregate = [...selected, ...electives]
      .reduce((sum, score) => sum + score.grade, 0);

    return {
      complete: true,
      aggregate,
      message: String(aggregate)
    };
  }

  function buildReportCard(data) {
    const {
      student = {},
      settings = {},
      report = {},
      scores = [],
      attendance = [],
      gradingSettings = null
    } = data;

    const safe = escapeHtml;
    const studentAttendance = calculateAttendance(attendance, student.id);

    const approvedScores = scores.filter(score =>
      String(score.student_id) === String(student.id) &&
      String(score.approval_status || "").toLowerCase() === "approved"
    );

    const className = String(
      student.class_name || report.class_name || ""
    );

    const isJhs = /^\s*BASIC\s*([1-9])\s*$/i.test(className);

    const jhsAggregate = isJhs
      ? calculateJhsAggregate(approvedScores, gradingSettings)
      : null;

    let total = 0;
    let validSubjects = 0;

    const subjectRows = approvedScores.map((score, index) => {
      const numericTotal = Number(score.total_score);
      const validTotal =
        score.total_score !== null &&
        score.total_score !== "" &&
        Number.isFinite(numericTotal);

      if (validTotal) {
        total += numericTotal;
        validSubjects++;
      }

      const calculated = validTotal &&
        typeof window.calculateGradeFromSettings === "function"
          ? window.calculateGradeFromSettings(
              numericTotal,
              gradingSettings
            )
          : {};

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${safe(score.subject)}</td>
          <td>${formatScore(score.assessment_score)}</td>
          <td>${formatScore(score.examination_score)}</td>
          <td>${formatScore(score.total_score)}</td>
          <td>${safe(calculated.grade || score.grade || "—")}</td>
          <td>${safe(calculated.remark || score.remarks || "—")}</td>
        </tr>
      `;
    }).join("");

    const average = validSubjects
      ? (total / validSubjects).toFixed(2)
      : "—";

    const overall = validSubjects &&
      typeof window.calculateGradeFromSettings === "function"
        ? window.calculateGradeFromSettings(
            Number(average),
            gradingSettings
          )
        : { grade: "—", remark: "—" };

    const logo = settings.school_logo
      ? `<img class="school-logo"
              src="${safe(settings.school_logo)}"
              alt="School logo">`
      : "";

    const studentPhotoPath = String(student.profile_picture || "").trim();

    const studentPhoto = studentPhotoPath
      ? `<img class="terminal-student-photo"
              src="${safe(studentPhotoPath)}"
              alt="Student passport photograph">`
      : "";

    return `
      <section class="terminal-report-page">
        <header class="terminal-school-header">
          <div class="terminal-school-brand">
            <div class="terminal-school-logo-box">${logo}</div>
            <h1>${safe(settings.school_name || "DELIGHT INTERNATIONAL SCHOOL")}</h1>
            <div class="terminal-student-photo-box">${studentPhoto}</div>
          </div>
          <div>${safe(settings.school_motto || "")}</div>
          <div>${safe(settings.school_address || "")}</div>
          <div>
            ${safe(settings.school_phone || "")}
            ${settings.school_email ? " | " + safe(settings.school_email) : ""}
          </div>
          <h2>${REPORT_TITLE}</h2>
        </header>

        <div class="terminal-student-info">
          <div><strong>Name:</strong> ${safe(student.full_name)}</div>
          <div><strong>Admission No.:</strong> ${safe(student.admission_number)}</div>
          <div><strong>Class:</strong> ${safe(student.class_name || report.class_name)}</div>
          <div><strong>Gender:</strong> ${safe(student.sex)}</div>
          <div><strong>Branch:</strong> ${safe(student.branch_name || report.branch_name)}</div>
          <div><strong>Term:</strong> ${safe(report.term)}</div>
          <div><strong>Academic Year:</strong> ${safe(report.academic_year)}</div>
        </div>

        <table class="terminal-subject-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Subject</th>
              <th>Assessment</th>
              <th>Exam</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${subjectRows || `
              <tr>
                <td colspan="7">No approved examination scores available.</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="terminal-summary">
          <span><strong>Subjects:</strong> ${validSubjects}</span>
          <span><strong>Total:</strong> ${validSubjects ? total.toFixed(2) : "—"}</span>
          <span><strong>Average:</strong> ${average}</span>
          <span><strong>Overall Grade:</strong> ${escapeHtml(overall.grade || "—")}</span>
          <span><strong>Overall Remark:</strong> ${escapeHtml(overall.remark || "—")}</span>
          ${isJhs ? `
            <span>
              <strong>Aggregate (6 Subjects):</strong>
              ${escapeHtml(jhsAggregate.message)}
            </span>
          ` : ""}
        </div>

        <div class="terminal-attendance">
          <strong>Attendance</strong>
          <span>Days Recorded: ${studentAttendance.recordedDays}</span>
          <span>Present: ${studentAttendance.present}</span>
          <span>Absent: ${studentAttendance.absent}</span>
        </div>

        <div class="terminal-comment">
          <strong>Class Teacher's Comment:</strong>
          ${safe(report.teacher_comment || "____________________________")}
        </div>

        <div class="terminal-comment">
          <strong>Headteacher's Comment:</strong>
          ${safe(report.headteacher_comment || "____________________________")}
        </div>

        <div class="terminal-reopening">
          <strong>Reopening Date:</strong>
          ${safe(report.reopening_date || "____________________________")}
        </div>

        <div class="terminal-signatures">
          <div class="terminal-signature-item">
            <div class="terminal-signature-space"></div>
            <div>________________________</div>
            <div>Class Teacher</div>
          </div>

          <div class="terminal-signature-item">
            <div class="terminal-signature-space">
              <img
                class="terminal-headteacher-signature"
                src="/images/signature%20.png"
                alt="Headteacher signature">
            </div>
            <div>________________________</div>
            <div>Headteacher</div>
          </div>

          <div class="terminal-signature-item">
            <div class="terminal-signature-space"></div>
            <div>________________________</div>
            <div>Parent / Guardian</div>
          </div>
        </div>

        <footer class="terminal-footer">${safe(FOOTER_TEXT)}</footer>
      </section>
    `;
  }

  const REPORT_STYLES = `
    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      color: #172033;
      background: #fff;
    }

    .terminal-report-page {
      width: 100%;
      min-height: 270mm;
      padding: 5mm;
      background: white;
      page-break-after: always;
      break-after: page;
      position: relative;
      font-size: 11px;
    }

    .terminal-report-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .terminal-school-header {
      text-align: center;
      border-bottom: 2px solid #17365d;
      padding-bottom: 7px;
      margin-bottom: 10px;
    }

    .terminal-school-brand {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 58px;
      padding-left: 72px;
      padding-right: 72px;
    }

    .terminal-school-logo-box {
      position: absolute;
      left: 12.7mm;
      top: 6.35mm;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .school-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }

    .terminal-student-photo-box {
      position: absolute;
      right: 6.35mm;
      top: 6.35mm;
      width: 60px;
      height: 70px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .terminal-student-photo {
      width: 60px;
      height: 70px;
      object-fit: cover;
      border: 1px solid #596579;
    }

    .terminal-school-header h1 {
      font-size: 20px;
      color: #17365d;
      margin: 4px 0;
    }

    .terminal-school-header h2 {
      font-size: 14px;
      margin: 9px 0 2px;
      letter-spacing: 1px;
    }

    .terminal-student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px 12px;
      margin: 12px 0;
      font-size: 12px;
    }

    .terminal-subject-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    .terminal-subject-table th,
    .terminal-subject-table td {
      border: 1px solid #596579;
      padding: 6px 5px;
      text-align: center;
      overflow-wrap: anywhere;
    }

    .terminal-subject-table th {
      background: #eaf0f8;
    }

    .terminal-subject-table th:nth-child(2),
    .terminal-subject-table td:nth-child(2),
    .terminal-subject-table th:last-child,
    .terminal-subject-table td:last-child {
      text-align: left;
    }

    .terminal-summary,
    .terminal-attendance {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      border: 1px solid #596579;
      padding: 9px;
      margin-top: 10px;
    }

    .terminal-comment,
    .terminal-reopening {
      margin-top: 13px;
      line-height: 1.6;
    }

    .terminal-signatures {
      display: flex;
      justify-content: space-between;
      text-align: center;
      gap: 15px;
      margin-top: 12px;
      line-height: 1.6;
    }

    .terminal-signature-item {
      flex: 1;
      min-width: 0;
    }

    .terminal-signature-space {
      height: 35px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .terminal-headteacher-signature {
      display: block;
      max-width: 115px;
      max-height: 35px;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .terminal-footer {
      position: absolute;
      bottom: 5mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      border-top: 1px solid #ccc;
      padding-top: 5px;
    }

    @media screen {
      body { background: #e5e7eb; }

      .terminal-report-page {
        width: 190mm;
        margin: 12px auto;
        box-shadow: 0 3px 12px #0002;
      }
    }

    @media print {
      body { background: white; }

      .terminal-report-page {
        margin: 0;
        box-shadow: none;
      }

      .terminal-subject-table thead {
        display: table-header-group;
      }
    }
  `;

  window.DelightTerminalReport = {
    REPORT_TITLE,
    FOOTER_TEXT,
    escapeHtml,
    formatScore,
    calculateAttendance,
    calculateJhsAggregate,
    buildReportCard,
    REPORT_STYLES
  };
})();
