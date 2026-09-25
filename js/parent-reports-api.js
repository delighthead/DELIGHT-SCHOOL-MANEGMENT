document.addEventListener("DOMContentLoaded", function () {
  const childrenSelector =
    document.getElementById("reportsChildrenSelector");

  const reportsTableBody =
    document.getElementById("parentReportsTableBody");

  const reportsCountText =
    document.getElementById("parentReportsCountText");

  const reportsHeading =
    document.getElementById("reportsHeading");

  const academicYearSelect =
    document.getElementById("reportsAcademicYear");

  const termSelect =
    document.getElementById("reportsTerm");

  const typeSelect =
    document.getElementById("reportsType");

  const selectedClassBox =
    document.getElementById("reportsSelectedClass");

  const selectedBranchBox =
    document.getElementById("reportsSelectedBranch");

  const availableCountBox =
    document.getElementById("reportsAvailableCount");

  let children = [];
  let reports = [];
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

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: headers()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load reports."
      );
    }

    return data;
  }

  function selectedChild() {
    return children.find(
      child =>
        Number(child.id) ===
        Number(selectedChildId)
    ) || children[0] || null;
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function childReports() {
    const child = selectedChild();

    if (!child) return [];

    const childClass =
      normalize(child.class_name);

    const childBranch =
      normalize(child.branch_name);

    return reports.filter(report => {
      const sameClass =
        normalize(report.class_name) ===
        childClass;

      const sameBranch =
        normalize(report.branch_name) ===
        childBranch;

      return sameClass && sameBranch;
    });
  }

  function filteredReports() {
    const year =
      academicYearSelect.value;

    const term =
      termSelect.value;

    const type =
      typeSelect.value;

    return childReports().filter(report => {
      const yearMatches =
        !year ||
        String(report.academic_year || "") === year;

      const termMatches =
        !term ||
        String(report.term || "") === term;

      const typeMatches =
        !type ||
        String(report.report_type || "") === type;

      return (
        yearMatches &&
        termMatches &&
        typeMatches
      );
    });
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
            class="reports-child-card${active}"
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
      .querySelectorAll(".reports-child-card")
      .forEach(button => {
        button.addEventListener("click", function () {
          selectedChildId =
            this.dataset.childId;

          renderChildren();
          buildFilters();
          renderReports();
        });
      });
  }

  function uniqueSorted(values) {
    return [...new Set(
      values
        .filter(Boolean)
        .map(String)
    )].sort((a, b) =>
      b.localeCompare(
        a,
        undefined,
        {
          numeric: true,
          sensitivity: "base"
        }
      )
    );
  }

  function buildFilters() {
    const records = childReports();

    const previousYear =
      academicYearSelect.value;

    const previousTerm =
      termSelect.value;

    const previousType =
      typeSelect.value;

    const years = uniqueSorted(
      records.map(report => report.academic_year)
    );

    const terms = uniqueSorted(
      records.map(report => report.term)
    );

    const types = uniqueSorted(
      records.map(report => report.report_type)
    );

    academicYearSelect.innerHTML =
      '<option value="">All Academic Years</option>' +
      years.map(year => `
        <option value="${safe(year)}">
          ${safe(year)}
        </option>
      `).join("");

    termSelect.innerHTML =
      '<option value="">All Terms</option>' +
      terms.map(term => `
        <option value="${safe(term)}">
          ${safe(term)}
        </option>
      `).join("");

    typeSelect.innerHTML =
      '<option value="">All Report Types</option>' +
      types.map(type => `
        <option value="${safe(type)}">
          ${safe(type)}
        </option>
      `).join("");

    if (years.includes(previousYear)) {
      academicYearSelect.value =
        previousYear;
    }

    if (terms.includes(previousTerm)) {
      termSelect.value =
        previousTerm;
    }

    if (types.includes(previousType)) {
      typeSelect.value =
        previousType;
    }
  }

  function renderSummary(records) {
    const child = selectedChild();

    if (!child) {
      selectedClassBox.textContent = "--";
      selectedBranchBox.textContent = "--";
      availableCountBox.textContent = "--";
      return;
    }

    selectedClassBox.textContent =
      child.class_name || "--";

    selectedBranchBox.textContent =
      child.branch_name || "--";

    availableCountBox.textContent =
      String(records.length);
  }

  function openReport(report) {
    if (!report.file_path) {
      alert(
        "No report file is available for this report."
      );
      return;
    }

    window.open(
      report.file_path,
      "_blank",
      "noopener"
    );
  }

  function printReport(report) {
    const child = selectedChild();

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=950,height=700"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the report."
      );
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${safe(report.report_name || "Report")}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 35px;
            color: #111827;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #073b70;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .header h1 {
            color: #073b70;
            margin: 0 0 7px;
          }

          .details {
            max-width: 760px;
            margin: 0 auto;
          }

          .details table {
            width: 100%;
            border-collapse: collapse;
          }

          .details th,
          .details td {
            border: 1px solid #cbd5e1;
            padding: 12px;
            text-align: left;
          }

          .details th {
            width: 35%;
            background: #f1f5f9;
          }
        </style>
      </head>

      <body>

        <div class="header">
          <h1>Delight International School</h1>
          <strong>Class Report Information</strong>
        </div>

        <div class="details">

          <table>
            <tr>
              <th>Child</th>
              <td>${safe(child?.full_name || "")}</td>
            </tr>

            <tr>
              <th>Class</th>
              <td>${safe(report.class_name || "")}</td>
            </tr>

            <tr>
              <th>Branch</th>
              <td>${safe(report.branch_name || "")}</td>
            </tr>

            <tr>
              <th>Report Name</th>
              <td>${safe(report.report_name || "")}</td>
            </tr>

            <tr>
              <th>Report Type</th>
              <td>${safe(report.report_type || "")}</td>
            </tr>

            <tr>
              <th>Term</th>
              <td>${safe(report.term || "")}</td>
            </tr>

            <tr>
              <th>Academic Year</th>
              <td>${safe(report.academic_year || "")}</td>
            </tr>

            <tr>
              <th>Generated By</th>
              <td>${safe(report.generated_by_name || "")}</td>
            </tr>

            <tr>
              <th>Date</th>
              <td>${safe(formatDate(report.generated_at))}</td>
            </tr>
          </table>

        </div>

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

  function renderReports() {
    const child = selectedChild();

    if (!child) {
      renderSummary([]);

      reportsHeading.textContent =
        "Available Reports";

      reportsCountText.textContent = "";

      reportsTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No active child is linked to this account.
          </td>
        </tr>
      `;

      return;
    }

    const records = filteredReports();

    renderSummary(records);

    reportsHeading.textContent =
      `${child.full_name || "Student"} - Class Reports`;

    reportsCountText.textContent =
      records.length
        ? `Showing ${records.length} report(s) for ${child.class_name || "this class"}`
        : `No reports available for ${child.class_name || "this class"} yet.`;

    if (!records.length) {
      reportsTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No reports found for
            ${safe(child.full_name || "this child")}'s class.
          </td>
        </tr>
      `;

      return;
    }

    reportsTableBody.innerHTML = records
      .map((report, index) => `
        <tr>
          <td>
            ${safe(report.report_name || "")}
          </td>

          <td>
            ${safe(report.report_type || "")}
          </td>

          <td>
            ${safe(report.term || "")}
          </td>

          <td>
            ${safe(report.academic_year || "")}
          </td>

          <td>
            ${safe(report.generated_by_name || "")}
          </td>

          <td>
            ${safe(formatDate(report.generated_at))}
          </td>

          <td>
            <div class="reports-actions">
              ${
                report.file_path
                  ? `
                    <button
                      type="button"
                      class="small-btn success report-open-btn"
                      data-report-index="${index}"
                    >
                      Open
                    </button>
                  `
                  : ""
              }

              <button
                type="button"
                class="small-btn success report-print-btn"
                data-report-index="${index}"
              >
                Print
              </button>
            </div>
          </td>
        </tr>
      `)
      .join("");

    reportsTableBody
      .querySelectorAll(".report-open-btn")
      .forEach(button => {
        button.addEventListener("click", function () {
          const report =
            records[Number(this.dataset.reportIndex)];

          if (report) {
            openReport(report);
          }
        });
      });

    reportsTableBody
      .querySelectorAll(".report-print-btn")
      .forEach(button => {
        button.addEventListener("click", function () {
          const report =
            records[Number(this.dataset.reportIndex)];

          if (report) {
            printReport(report);
          }
        });
      });
  }

  async function loadReportsPage() {
    try {
      const [childrenData, reportsData] =
        await Promise.all([
          fetchJson("/api/parents/my/children"),
          fetchJson("/api/parents/my/reports")
        ]);

      children =
        childrenData.children || [];

      reports =
        reportsData.reports || [];

      selectedChildId =
        children.length
          ? children[0].id
          : null;

      renderChildren();
      buildFilters();
      renderReports();

    } catch (error) {
      console.error(
        "Parent reports error:",
        error
      );

      if (childrenSelector) {
        childrenSelector.innerHTML =
          `<p>${safe(error.message)}</p>`;
      }

      if (reportsTableBody) {
        reportsTableBody.innerHTML = `
          <tr>
            <td colspan="7">
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
    renderReports
  );

  termSelect.addEventListener(
    "change",
    renderReports
  );

  typeSelect.addEventListener(
    "change",
    renderReports
  );

  loadReportsPage();
});
