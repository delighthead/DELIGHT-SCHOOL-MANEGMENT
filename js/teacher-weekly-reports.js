document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("weeklyReportForm");
  const tbody = document.getElementById("weeklyReportsTableBody");
  const message = document.getElementById("weeklyReportMessage");
  const submitBtn = document.getElementById("weeklyReportSubmitBtn");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);

    return date.toLocaleDateString();
  }

  async function loadWeeklyReports() {
    if (!tbody) return;

    try {
      const response = await fetch("/api/weekly-reports/my", {
        headers: window.getAuthOnlyHeaders
          ? window.getAuthOnlyHeaders()
          : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load weekly reports.");
      }

      const reports = Array.isArray(data.weekly_reports)
        ? data.weekly_reports
        : [];

      if (!reports.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">No weekly reports submitted yet.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = reports.map(report => `
        <tr>
          <td>${formatDate(report.created_at)}</td>
          <td>${escapeHtml(report.class_name || "-")}</td>
          <td>${escapeHtml(report.report_type || "-")}</td>
          <td>${escapeHtml(report.week || "-")}</td>
          <td>${escapeHtml(report.title || "-")}</td>
          <td>
            ${
              report.file_path
                ? `<a href="${escapeHtml(report.file_path)}" target="_blank" rel="noopener">View File</a>`
                : "-"
            }
          </td>
          <td>${escapeHtml(report.status || "Pending")}</td>
          <td>${escapeHtml(report.admin_comment || "-")}</td>
        </tr>
      `).join("");

    } catch (error) {
      console.error(error);

      tbody.innerHTML = `
        <tr>
          <td colspan="8">${escapeHtml(error.message)}</td>
        </tr>
      `;
    }
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      message.textContent = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        const formData = new FormData();

        formData.append(
          "class_name",
          document.getElementById("weekly_class_name").value.trim()
        );

        formData.append(
          "report_type",
          document.getElementById("weekly_report_type").value
        );

        formData.append(
          "week",
          document.getElementById("weekly_week").value.trim()
        );

        formData.append(
          "title",
          document.getElementById("weekly_title").value.trim()
        );

        formData.append(
          "activities",
          document.getElementById("weekly_activities").value.trim()
        );

        formData.append(
          "learner_participation",
          document.getElementById("weekly_participation").value.trim()
        );

        formData.append(
          "progress",
          document.getElementById("weekly_progress").value.trim()
        );

        formData.append(
          "challenges",
          document.getElementById("weekly_challenges").value.trim()
        );

        formData.append(
          "interventions",
          document.getElementById("weekly_interventions").value.trim()
        );

        const file = document.getElementById("weekly_file").files[0];

        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("The selected file is larger than 10 MB.");
          }

          formData.append("report_file", file);
        }

        const response = await fetch("/api/weekly-reports", {
          method: "POST",
          headers: window.getAuthOnlyHeaders
            ? window.getAuthOnlyHeaders()
            : {},
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Weekly report submission failed.");
        }

        message.textContent =
          data.message || "Weekly report submitted successfully.";

        form.reset();
        await loadWeeklyReports();

      } catch (error) {
        console.error(error);
        message.textContent = error.message || "Weekly report submission failed.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Weekly Report";
      }
    });
  }

  loadWeeklyReports();
});
