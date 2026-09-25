document.addEventListener("DOMContentLoaded", function () {
  const childrenSelector =
    document.getElementById("resultsChildrenSelector");

  const resultsTableBody =
    document.getElementById("parentResultsTableBody");

  const resultsCountText =
    document.getElementById("parentResultsCountText");

  const resultsHeading =
    document.getElementById("resultsHeading");

  const academicYearSelect =
    document.getElementById("resultsAcademicYear");

  const termSelect =
    document.getElementById("resultsTerm");

  const averageBox =
    document.getElementById("resultsAverage");

  const subjectCountBox =
    document.getElementById("resultsSubjectCount");

  const highestBox =
    document.getElementById("resultsHighest");

  const approvedCountBox =
    document.getElementById("resultsApprovedCount");

  const printButton =
    document.getElementById("printParentResultsBtn");

  let children = [];
  let scores = [];
  let selectedChildId = null;
  let gradingSettings = null;

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

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function oneDecimal(value) {
    return number(value).toFixed(1);
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: headers()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load results."
      );
    }

    return data;
  }

  function getSelectedChild() {
    return children.find(
      child =>
        Number(child.id) ===
        Number(selectedChildId)
    ) || children[0] || null;
  }

  function childScores() {
    return scores.filter(
      score =>
        Number(score.student_id) ===
        Number(selectedChildId)
    );
  }

  function filteredScores() {
    const year = academicYearSelect
      ? academicYearSelect.value
      : "";

    const term = termSelect
      ? termSelect.value
      : "";

    return childScores().filter(score => {
      const yearMatches =
        !year ||
        String(score.academic_year || "") === year;

      const termMatches =
        !term ||
        String(score.term || "") === term;

      return yearMatches && termMatches;
    });
  }

  function gradeFor(score) {
    if (
      gradingSettings &&
      typeof calculateGradeFromSettings === "function"
    ) {
      const calculated =
        calculateGradeFromSettings(
          score.total_score,
          gradingSettings
        );

      if (calculated) {
        return {
          grade:
            calculated.grade ||
            score.grade ||
            "",
          remark:
            calculated.remark ||
            score.remarks ||
            ""
        };
      }
    }

    return {
      grade: score.grade || "",
      remark: score.remarks || ""
    };
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
          Number(child.id) ===
          Number(selectedChildId)
            ? " active"
            : "";

        return `
          <button
            type="button"
            class="results-child-card${active}"
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
      .querySelectorAll(".results-child-card")
      .forEach(button => {
        button.addEventListener("click", function () {
          selectedChildId = this.dataset.childId;

          renderChildren();
          buildFilters();
          renderResults();
        });
      });
  }

  function uniqueSorted(values) {
    return [...new Set(
      values.filter(Boolean).map(String)
    )].sort((a, b) =>
      b.localeCompare(a, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );
  }

  function buildFilters() {
    const records = childScores();

    const previousYear =
      academicYearSelect.value;

    const previousTerm =
      termSelect.value;

    const years = uniqueSorted(
      records.map(score => score.academic_year)
    );

    const terms = uniqueSorted(
      records.map(score => score.term)
    );

    academicYearSelect.innerHTML =
      '<option value="">All Academic Years</option>' +
      years
        .map(year => `
          <option value="${safe(year)}">
            ${safe(year)}
          </option>
        `)
        .join("");

    termSelect.innerHTML =
      '<option value="">All Terms</option>' +
      terms
        .map(term => `
          <option value="${safe(term)}">
            ${safe(term)}
          </option>
        `)
        .join("");

    if (years.includes(previousYear)) {
      academicYearSelect.value = previousYear;
    }

    if (terms.includes(previousTerm)) {
      termSelect.value = previousTerm;
    }
  }

  function renderSummary(records) {
    if (!records.length) {
      averageBox.textContent = "--";
      subjectCountBox.textContent = "--";
      highestBox.textContent = "--";
      approvedCountBox.textContent = "--";
      return;
    }

    const totals = records.map(
      score => number(score.total_score)
    );

    const average =
      totals.reduce((sum, total) => sum + total, 0) /
      totals.length;

    const subjects = new Set(
      records
        .map(score => score.subject)
        .filter(Boolean)
    );

    averageBox.textContent =
      `${average.toFixed(1)}%`;

    subjectCountBox.textContent =
      String(subjects.size);

    highestBox.textContent =
      `${Math.max(...totals).toFixed(1)}%`;

    approvedCountBox.textContent =
      String(records.length);
  }

  function renderResults() {
    const child = getSelectedChild();

    if (!child) {
      renderSummary([]);

      resultsHeading.textContent =
        "Approved Results";

      resultsCountText.textContent = "";

      resultsTableBody.innerHTML = `
        <tr>
          <td colspan="9">
            No active child is linked to this account.
          </td>
        </tr>
      `;

      return;
    }

    const records = filteredScores();

    resultsHeading.textContent =
      `${child.full_name || "Student"} - Results`;

    resultsCountText.textContent =
      records.length
        ? `Showing ${records.length} approved result record(s)`
        : "No approved results available yet.";

    renderSummary(records);

    if (!records.length) {
      resultsTableBody.innerHTML = `
        <tr>
          <td colspan="9">
            No approved results found for
            ${safe(child.full_name || "this child")}.
          </td>
        </tr>
      `;

      return;
    }

    resultsTableBody.innerHTML = records
      .map(score => {
        const grading = gradeFor(score);

        return `
          <tr>
            <td>
              ${safe(score.subject || "")}
            </td>

            <td>
              ${safe(score.term || "")}
            </td>

            <td>
              ${safe(score.academic_year || "")}
            </td>

            <td>
              ${oneDecimal(score.assessment_score)}
            </td>

            <td>
              ${oneDecimal(score.examination_score)}
            </td>

            <td>
              <strong>
                ${oneDecimal(score.total_score)}
              </strong>
            </td>

            <td>
              ${safe(grading.grade)}
            </td>

            <td>
              ${safe(score.position || "")}
            </td>

            <td>
              ${safe(grading.remark)}
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function printResults() {
    const child = getSelectedChild();
    const records = filteredScores();

    if (!child || !records.length) {
      alert("No approved results available to print.");
      return;
    }

    const totals = records.map(
      score => number(score.total_score)
    );

    const average =
      totals.reduce((sum, total) => sum + total, 0) /
      totals.length;

    const rows = records
      .map(score => {
        const grading = gradeFor(score);

        return `
          <tr>
            <td>${safe(score.subject || "")}</td>
            <td>${safe(score.term || "")}</td>
            <td>${safe(score.academic_year || "")}</td>
            <td>${oneDecimal(score.assessment_score)}</td>
            <td>${oneDecimal(score.examination_score)}</td>
            <td>${oneDecimal(score.total_score)}</td>
            <td>${safe(grading.grade)}</td>
            <td>${safe(score.position || "")}</td>
            <td>${safe(grading.remark)}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1100,height=750"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print results."
      );
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scores & Results</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111827;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #073b70;
            padding-bottom: 15px;
            margin-bottom: 22px;
          }

          .header h1 {
            color: #073b70;
            margin: 0 0 6px;
          }

          .student-info {
            margin-bottom: 18px;
          }

          .student-info p {
            margin: 5px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }

          th {
            background: #073b70;
            color: #fff;
          }
        </style>
      </head>

      <body>

        <div class="header">
          <h1>Delight International School</h1>
          <strong>Scores & Results</strong>
        </div>

        <div class="student-info">
          <p>
            <strong>Student:</strong>
            ${safe(child.full_name || "")}
          </p>

          <p>
            <strong>Student ID:</strong>
            ${safe(child.student_id || "")}
          </p>

          <p>
            <strong>Class:</strong>
            ${safe(child.class_name || "")}
          </p>

          <p>
            <strong>Branch:</strong>
            ${safe(child.branch_name || "")}
          </p>

          <p>
            <strong>Academic Average:</strong>
            ${average.toFixed(1)}%
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Term</th>
              <th>Academic Year</th>
              <th>Assessment</th>
              <th>Exam</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Position</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        <\/script>

      </body>
      </html>
    `);

    printWindow.document.close();
  }

  async function loadResultsPage() {
    try {
      const [childrenData, scoresData] =
        await Promise.all([
          fetchJson("/api/parents/my/children"),
          fetchJson("/api/parents/my/scores")
        ]);

      children = childrenData.children || [];
      scores = scoresData.scores || [];

      selectedChildId =
        children.length ? children[0].id : null;

      if (
        typeof getGradingSettings === "function"
      ) {
        try {
          gradingSettings =
            await getGradingSettings();
        } catch (error) {
          console.warn(
            "Could not load grading settings:",
            error
          );
        }
      }

      renderChildren();
      buildFilters();
      renderResults();

    } catch (error) {
      console.error(
        "Parent results error:",
        error
      );

      if (childrenSelector) {
        childrenSelector.innerHTML =
          `<p>${safe(error.message)}</p>`;
      }

      if (resultsTableBody) {
        resultsTableBody.innerHTML = `
          <tr>
            <td colspan="9">
              ${safe(error.message)}
            </td>
          </tr>
        `;
      }

      renderSummary([]);
    }
  }

  academicYearSelect.addEventListener(
    "change",
    renderResults
  );

  termSelect.addEventListener(
    "change",
    renderResults
  );

  if (printButton) {
    printButton.addEventListener(
      "click",
      printResults
    );
  }

  loadResultsPage();
});
