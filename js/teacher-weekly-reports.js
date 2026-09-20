document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("weeklyReportForm");
  const classSelect = document.getElementById("handwriting_class");
  const weekSelect = document.getElementById("handwriting_week");
  const fileInput = document.getElementById("handwriting_file");
  const tbody = document.getElementById("weeklyReportsTableBody");
  const message = document.getElementById("weeklyReportMessage");
  const submitBtn = document.getElementById("weeklyReportSubmitBtn");

  function authHeaders() {
    return window.getAuthOnlyHeaders
      ? window.getAuthOnlyHeaders()
      : {};
  }

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
    return Number.isNaN(date.getTime())
      ? escapeHtml(value)
      : date.toLocaleDateString();
  }

  async function loadAssignments() {
    const response = await fetch("/api/teachers/my-assignments", {
      headers: authHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load teacher assignments.");
    }

    const assignments = Array.isArray(data.assignments)
      ? data.assignments
      : [];

    const classes = [];

    assignments.forEach(item => {
      if (!classes.some(c => String(c.class_id) === String(item.class_id))) {
        classes.push({
          class_id: item.class_id,
          class_name: item.class_name
        });
      }
    });

    classSelect.innerHTML = '<option value="">Select Class</option>';

    classes.forEach(item => {
      const option = document.createElement("option");
      option.value = item.class_id;
      option.textContent = item.class_name;
      option.dataset.className = item.class_name;
      classSelect.appendChild(option);
    });

    if (!classes.length) {
      classSelect.innerHTML =
        '<option value="">No assigned classes found</option>';
    }
  }

  async function loadHandwritingReports() {
    try {
      const response = await fetch("/api/weekly-reports/my", {
        headers: authHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load Handwriting Reports."
        );
      }

      const rows = Array.isArray(data.weekly_reports)
        ? data.weekly_reports
        : [];

      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="6">No Handwriting Reports uploaded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(row => `
        <tr>
          <td>${formatDate(row.created_at)}</td>
          <td>${escapeHtml(row.class_name || "-")}</td>
          <td>${escapeHtml(row.week || "-")}</td>
          <td>
            ${
              row.file_path
                ? `<a href="${escapeHtml(row.file_path)}" target="_blank" rel="noopener">View Document</a>`
                : "-"
            }
          </td>
          <td>${escapeHtml(row.status || "Pending")}</td>
          <td>${escapeHtml(row.admin_comment || "-")}</td>
        </tr>
      `).join("");
    } catch (error) {
      console.error(error);
      tbody.innerHTML =
        `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";

    const selectedClass =
      classSelect.options[classSelect.selectedIndex];

    const file = fileInput.files[0];

    if (!classSelect.value || !weekSelect.value) {
      message.textContent = "Please select Class and Week.";
      return;
    }

    if (!file) {
      message.textContent =
        "Please select a Handwriting Report document.";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.textContent =
        "The selected document is larger than 10 MB.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
      const formData = new FormData();

      formData.append("class_id", classSelect.value);
      formData.append("class_name", selectedClass.dataset.className);
      formData.append("week", weekSelect.value);
      formData.append("report_file", file);

      const response = await fetch("/api/weekly-reports", {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Handwriting Report upload failed."
        );
      }

      message.textContent =
        data.message || "Handwriting Report uploaded successfully.";

      form.reset();
      await loadHandwritingReports();
    } catch (error) {
      console.error(error);
      message.textContent =
        error.message || "Handwriting Report upload failed.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Upload Handwriting Report";
    }
  });

  Promise.all([
    loadAssignments(),
    loadHandwritingReports()
  ]).catch(error => {
    console.error(error);
    message.textContent = error.message;
  });
});
