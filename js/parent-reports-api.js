document.addEventListener("DOMContentLoaded", function () {
  const reportsTableBody = document.getElementById("parentReportsTableBody");
  const reportsCountText = document.getElementById("parentReportsCountText");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function safe(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function loadParentReports() {
    if (!reportsTableBody) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/reports", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();
      reportsTableBody.innerHTML = "";

      if (!response.ok) {
        reportsTableBody.innerHTML = `
          <tr>
            <td colspan="9">${data.message || "Could not load reports."}</td>
          </tr>
        `;
        if (reportsCountText) reportsCountText.textContent = "";
        return;
      }

      const reports = data.reports || [];

      if (reportsCountText) {
        reportsCountText.textContent = `Showing ${reports.length} report(s)`;
      }

      if (reports.length === 0) {
        reportsTableBody.innerHTML = `
          <tr>
            <td colspan="9">No reports found for active children.</td>
          </tr>
        `;
        return;
      }

      reports.forEach(function (report) {
        const actions = report.file_path
          ? `<a class="small-btn success" href="http://127.0.0.1:5000${report.file_path}" target="_blank">Open</a>
             <button type="button" class="small-btn success parent-print-report-btn">Print</button>`
          : `<button type="button" class="small-btn success parent-print-report-btn">Print</button>`;

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${safe(report.report_name)}</td>
          <td>${safe(report.report_type)}</td>
          <td>${safe(report.branch_name)}</td>
          <td>${safe(report.class_name)}</td>
          <td>${safe(report.term)}</td>
          <td>${safe(report.academic_year)}</td>
          <td>${safe(report.generated_by_name)}</td>
          <td>${safe(formatDate(report.generated_at))}</td>
          <td>${actions}</td>
        `;

        reportsTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);

      reportsTableBody.innerHTML = `
        <tr>
          <td colspan="9">Cannot connect to backend.</td>
        </tr>
      `;

      if (reportsCountText) reportsCountText.textContent = "";
    }
  }

  loadParentReports();
});
