/*
 * DELIGHT INTERNATIONAL SCHOOL
 * Basic 9 Mock Examination Report Card
 * Independent from terminal examination reports.
 */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatMark(value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(1) : "—";
  }

  function safeImageUrl(value) {
    const path = String(value || "").trim();

    if (!path) return "";

    try {
      const url = new URL(path, window.location.origin);

      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.origin !== window.location.origin
      ) {
        return "";
      }

      return escapeHtml(url.href);
    } catch {
      return "";
    }
  }

  function studentName(student) {
    return student.full_name ||
      [
        student.first_name,
        student.other_name,
        student.surname
      ].filter(Boolean).join(" ") ||
      "—";
  }

  // STEP 440N — SUBJECT MAXIMUM MARKS
  function buildReportCard({
    student = {},
    exam = {},
    subjects = [],
    scores = [],
    settings, reportRemarks = {} = {},
    pageNumber = 1,
    totalPages = 1
  } = {}) {
    const safe = escapeHtml;

    const logoUrl = safeImageUrl(settings.school_logo);
    const photoUrl = safeImageUrl(student.profile_picture);

    const logo = logoUrl
      ? `<img src="${logoUrl}" alt="School logo" class="mock-report-logo">`
      : "";

    const photo = photoUrl
      ? `<img src="${photoUrl}" alt="Student photograph" class="mock-report-photo">`
      : "";

    let totalMarks = 0;
    let scoredSubjects = 0;

    const subjectRows = subjects.map((subject, index) => {
      const score = scores.find(item =>
        Number(item.student_id) === Number(student.id) &&
        Number(item.subject_setting_id) === Number(subject.id)
      );

      if (
        score &&
        score.total_score !== null &&
        score.total_score !== undefined &&
        score.total_score !== ""
      ) {
        const mark = Number(score.total_score);

        if (Number.isFinite(mark)) {
          totalMarks += mark;
          scoredSubjects++;
        }
      }

      return `
        <tr>
          <td>${index + 1}</td>
          <td class="mock-report-subject">${safe(subject.subject)}</td>
          <td>${formatMark(score?.objectives_score)}/${safe(subject.objectives_max ?? "—")}</td>
          <td>${formatMark(score?.written_score)}/${safe(subject.written_max ?? "—")}</td>
          <td>${formatMark(score?.total_score)}/${safe(
            Number(subject.objectives_max ?? 0) +
            Number(subject.written_max ?? 0)
          )}</td>
          <td>${safe(score?.grade || "—")}</td>
          <td class="mock-report-remark">${safe(score?.remarks || "—")}</td>
        </tr>
      `;
    }).join("");

    const average = scoredSubjects
      ? (totalMarks / scoredSubjects).toFixed(2)
      : "—";


    // BASIC 9 BECE AGGREGATE - STEP 5
    // Four core subjects plus two best electives.
    // An incomplete aggregate must not be displayed
    // as a final examination aggregate.

    function calculateMockAggregate() {
      const core = {
        english: null,
        mathematics: null,
        science: null,
        social: null
      };

      const electives = [];

      subjects.forEach(subject => {
        const result = scores.find(item =>
          Number(item.student_id) === Number(student.id) &&
          Number(item.subject_setting_id) === Number(subject.id)
        );

        if (!result) return;

        if (
          result.total_score === null ||
          result.total_score === undefined ||
          result.total_score === ""
        ) return;

        const grade = Number(result.grade);

        if (
          !Number.isInteger(grade) ||
          grade < 1 ||
          grade > 9
        ) return;

        const name = String(subject.subject || "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, " ");

        if (
          name === "english" ||
          name === "english language"
        ) {
          core.english = grade;

        } else if (
          name === "mathematics" ||
          name === "maths" ||
          name === "core mathematics"
        ) {
          core.mathematics = grade;

        } else if (
          name === "science" ||
          name === "integrated science" ||
          name === "general science"
        ) {
          core.science = grade;

        } else if (
          name === "social studies"
        ) {
          core.social = grade;

        } else {
          electives.push(grade);
        }
      });

      const coreGrades = Object.values(core);

      if (
        coreGrades.some(value => value === null) ||
        electives.length < 2
      ) {
        return {
          complete: false,
          aggregate: null,
          message: "Pending"
        };
      }

      electives.sort((a, b) => a - b);

      const aggregate =
        coreGrades.reduce((sum, grade) => sum + grade, 0) +
        electives[0] +
        electives[1];

      return {
        complete: true,
        aggregate,
        message: String(aggregate)
      };
    }

    const mockAggregate = calculateMockAggregate();

    return `
      <section class="mock-report-page">
        <header class="mock-report-header">
          <div class="mock-report-brand">
            <div class="mock-report-logo-box">${logo}</div>
            <h1>${safe(
              settings.school_name || "DELIGHT INTERNATIONAL SCHOOL"
            )}</h1>
            <div class="mock-report-photo-box">${photo}</div>
          </div>

          <div>${safe(settings.school_motto || "")}</div>
          <div>${safe(settings.school_address || "")}</div>
          <div>
            ${safe(settings.school_phone || "")}
            ${settings.school_email
              ? " | " + safe(settings.school_email)
              : ""}
          </div>

          <h2>BASIC 9 MOCK EXAMINATION REPORT</h2>
        </header>

        <div class="mock-report-student-info">
          <div><strong>Name:</strong> ${safe(studentName(student))}</div>
          <div><strong>Admission No.:</strong>
            ${safe(student.admission_number || student.student_id || "—")}
          </div>
          <div><strong>Class:</strong>
            ${safe(student.class_name || exam.class_name || "Basic 9")}
          </div>
          <div><strong>Mock:</strong> ${safe(exam.mock_name || "—")}</div>
          <div><strong>Academic Year:</strong>
            ${safe(exam.academic_year || "—")}
          </div>
          <div><strong>Branch:</strong>
            ${safe(student.branch_name || exam.branch_name || "—")}
          </div>
        </div>

        <table class="mock-report-subject-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Subject</th>
              <th>Objectives</th>
              <th>Written</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${subjectRows || `
              <tr>
                <td colspan="7">No mock examination subjects configured.</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="mock-report-summary">
          <span><strong>Subjects Scored:</strong> ${scoredSubjects}</span>
          <span><strong>Total Marks:</strong>
            ${scoredSubjects ? totalMarks.toFixed(2) : "—"}
          </span>
          <span><strong>Average:</strong> ${average}</span>
          <span>
            <strong>BECE Aggregate:</strong>
            ${safe(mockAggregate.message)}
          </span>
        </div>



        <!-- STEP 450E — SAVED REMARKS -->
        <div class="mock-report-comments"
             style="margin-top:12px;font-size:11px;line-height:1.5;">

          <div style="margin-bottom:8px;">
            <strong>Class Teacher's Remarks:</strong>
            <div style="border-bottom:1px solid #777;
                        min-height:22px;
                        overflow-wrap:anywhere;
                        white-space:pre-wrap;">${safe(
                          reportRemarks.class_teacher_remark || ""
                        )}</div>
          </div>

          <div style="margin-bottom:8px;">
            <strong>Headteacher's Remarks:</strong>
            <div style="border-bottom:1px solid #777;
                        min-height:22px;
                        overflow-wrap:anywhere;
                        white-space:pre-wrap;">${safe(
                          reportRemarks.headteacher_remark || ""
                        )}</div>
          </div>

        </div>

        <div class="mock-report-signatures">
          <!-- STEP 451B — CLASS TEACHER SIGNATURE POSITION -->
          <div class="mock-report-class-teacher-signature"
               style="position:relative;top:6.7mm;">
            ________________________<br>
            Class Teacher
          </div>
          <div>
            <img
              src="/images/signature%20.png"
              alt="Headteacher signature"
              class="mock-report-headteacher-signature"
              style="display:block;width:110px;height:36px;
                     object-fit:contain;margin:0 auto 2px;"
            >
            ________________________<br>
            Headteacher
          </div>
        </div>

        <footer class="mock-report-footer">
          <span>
            Designed &amp; Developed by CRS Tech Solutions
            0270556797 / 0244113286
          </span>
          <span>Page ${pageNumber} of ${totalPages}</span>
        </footer>
      </section>
    `;
  }

  const REPORT_STYLES = `

  /* BASIC 9 A4 PRINT LAYOUT - STEP 7 */

  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  @media print {

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    .mock-report-page {
      width: 100% !important;
      min-height: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 8mm !important;
      box-shadow: none !important;
      border: 1px solid #ccc !important;
      page-break-after: always;
      break-after: page;
    }

    .mock-report-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .mock-report-header {
      text-align: center;
    }

    .mock-report-subject-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    .mock-report-subject-table th,
    .mock-report-subject-table td {
      padding: 5px 4px;
      border: 1px solid #555;
    }

    .mock-report-subject-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .mock-report-comments {
      margin-top: 12px !important;
      break-inside: avoid;
    }

    .mock-report-signatures {
      margin-top: 18px;
      break-inside: avoid;
    }

    .mock-report-footer {
      position: static !important;
      margin-top: 14px;
    }

    .mock-report-summary {
      break-inside: avoid;
    }

    img {
      max-width: 100%;
    }
  }

    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      color: #172033;
      background: white;
    }

    .mock-report-page {
      position: relative;
      width: 100%;
      min-height: 270mm;
      padding: 5mm 5mm 16mm;
      background: white;
      break-after: page;
      page-break-after: always;
      font-size: 11px;
    }

    .mock-report-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .mock-report-header {
      text-align: center;
      border-bottom: 2px solid #17365d;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .mock-report-brand {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 75px;
      padding: 0 75px;
    }

    .mock-report-logo-box {
      position: absolute;
      left: 0;
      top: 4px;
    }

    .mock-report-photo-box {
      position: absolute;
      right: 0;
      top: 4px;
    }

    .mock-report-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }

    .mock-report-photo {
      width: 60px;
      height: 70px;
      object-fit: cover;
      border: 1px solid #596579;
    }

    .mock-report-header h1 {
      margin: 4px 0;
      color: #17365d;
      font-size: 20px;
    }

    .mock-report-header h2 {
      margin: 10px 0 3px;
      font-size: 14px;
      letter-spacing: 0.6px;
    }

    .mock-report-student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px 12px;
      margin: 14px 0;
      font-size: 12px;
    }

    .mock-report-subject-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    .mock-report-subject-table th,
    .mock-report-subject-table td {
      border: 1px solid #596579;
      padding: 7px 5px;
      text-align: center;
      overflow-wrap: anywhere;
    }

    .mock-report-subject-table th {
      background: #eaf0f8;
    }

    .mock-report-subject,
    .mock-report-remark {
      text-align: left !important;
    }

    .mock-report-summary {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
      margin-top: 14px;
      padding: 10px;
      border: 1px solid #596579;
    }

    .mock-report-signatures {
      display: flex;
      justify-content: space-between;
      text-align: center;
      margin-top: 45px;
      line-height: 1.7;
    }

    .mock-report-footer {
      position: absolute;
      bottom: 5mm;
      left: 5mm;
      right: 5mm;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-top: 1px solid #ccc;
      padding-top: 6px;
      font-size: 9px;
    }

    @media screen {
      body {
        background: #e5e7eb;
      }

      .mock-report-page {
        width: 190mm;
        margin: 12px auto;
        box-shadow: 0 3px 12px #0002;
      }
    }

    @media print {
      body {
        background: white;
      }

      .mock-report-page {
        margin: 0;
        box-shadow: none;
      }

      .mock-report-subject-table thead {
        display: table-header-group;
      }
    }
  `;

  window.DelightMockReport = {
    buildReportCard,
    REPORT_STYLES
  };
})();
