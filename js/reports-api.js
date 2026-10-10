document.addEventListener("DOMContentLoaded", function () {
  const reportForm = document.getElementById("reportForm");
  const reportTableBody = document.getElementById("reportTableBody");
  const branchSelect = document.getElementById("report_branch_id");
  const classSelect = document.getElementById("report_class_id");

  function getToken() {
    return localStorage.getItem("token");
  }

  function getAuthOnlyHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }

  function isAdmin() {
    return getLoggedInUser().role === "branch_admin";
  }

  function getAdminId() {
    return getLoggedInUser().branch_id;
  }

  async function loadBranches() {
    if (!branchSelect) return;

    if (isAdmin()) {
      branchSelect.innerHTML = `<option value="${getAdminId()}">My Branch</option>`;
      branchSelect.value = getAdminId();
      branchSelect.disabled = true;
      return;
    }

    try {
      const response = await fetch("/api/branches", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to load branches (${response.status})`
        );
      }

      const branches = Array.isArray(data.branches)
        ? data.branches
        : [];

      branchSelect.innerHTML = '<option value="">Select branch</option>';

      branches.forEach(branch => {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.branch_name;
        branchSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load branches:", error);
    }
  }

  async function loadClasses() {
    if (!classSelect) return;

    try {
      const response = await fetch("/api/classes", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();
      const classes = data.classes || [];

      classSelect.innerHTML = '<option value="">Select class</option>';

      classes.forEach(cls => {
        const option = document.createElement("option");
        option.value = cls.id;
        option.textContent = cls.class_name;
        classSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load classes:", error);
    }
  }

  async function loadReports() {
    if (!reportTableBody) return;

    try {
      let reportsUrl = "/api/reports";

      if (isAdmin()) {
        reportsUrl += `?branch_id=${getAdminId()}`;
      }

      const response = await fetch(reportsUrl, {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      reportTableBody.innerHTML = "";

      if (!data.reports || data.reports.length === 0) {
        reportTableBody.innerHTML = `
          <tr>
            <td colspan="10">No reports found.</td>
          </tr>
        `;
        return;
      }

      data.reports.forEach(report => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${report.branch_name || ""}</td>
          <td>${report.report_name || ""}</td>
          <td>${report.student_display || "Class Report"}</td>
          <td>${report.report_type || ""}</td>
          <td>${report.class_name || ""}</td>
          <td>${report.term || ""}</td>
          <td>${report.academic_year || ""}</td>
          <td>${report.generated_by_name || ""}</td>
          <td>${report.generated_at ? report.generated_at.slice(0, 10) : ""}</td>
          <td>
            <button class="small-btn success view-report-btn"
              data-branch-id="${report.branch_id || ""}"
              data-student-id="${report.student_id || ""}"
              data-class-id="${report.class_id || ""}"
              data-class-name="${report.class_name || ""}"
              data-term="${report.term || ""}"
              data-academic-year="${report.academic_year || ""}"
              data-report-name="${report.report_name || ""}"
              data-teacher-comment="${encodeURIComponent(report.teacher_comment || "")}"
              data-headteacher-comment="${encodeURIComponent(report.headteacher_comment || "")}"
              data-reopening-date="${encodeURIComponent(report.reopening_date || "")}">
              View / Print
            </button>
          </td>
        `;

        reportTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      reportTableBody.innerHTML = `
        <tr>
          <td colspan="10">Could not load reports. Make sure backend is running.</td>
        </tr>
      `;
    }
  }

  async function createReport(event) {
    event.preventDefault();

    const reportData = {
      branch_id: document.getElementById("report_branch_id").value,
      report_name: "Terminal Exams",
      report_type: document.getElementById("report_type").value,
      student_id: document.getElementById("report_student_id").value,
      class_id: document.getElementById("report_class_id").value,
      term: document.getElementById("report_term").value,
      academic_year: document.getElementById("report_academic_year").value.trim(),
      teacher_comment: document.getElementById("teacher_comment") ? document.getElementById("teacher_comment").value.trim() : "",
      headteacher_comment: document.getElementById("headteacher_comment") ? document.getElementById("headteacher_comment").value.trim() : "",
      reopening_date: document.getElementById("reopening_date") ? document.getElementById("reopening_date").value.trim() : ""
    };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthOnlyHeaders()
        },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create report.");
        return;
      }

      alert("Report created successfully.");
      reportForm.reset();
      await loadReports();
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend.");
    }
  }


  async function openPrintableReport(button) {
    const branchId = button.dataset.branchId;
    const studentId = button.dataset.studentId;
    const classId = button.dataset.classId;
    const className = button.dataset.className;
    const term = button.dataset.term;
    const academicYear = button.dataset.academicYear;

    const report = {
      branch_id: branchId,
      class_id: classId,
      class_name: className,
      term,
      academic_year: academicYear,
      teacher_comment: decodeURIComponent(
        button.dataset.teacherComment || ""
      ),
      headteacher_comment: decodeURIComponent(
        button.dataset.headteacherComment || ""
      ),
      reopening_date: decodeURIComponent(
        button.dataset.reopeningDate || ""
      )
    };

    const renderer = window.DelightTerminalReport;

    if (!renderer) {
      alert("Report card module is not loaded. Refresh the page.");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print report cards.");
      return;
    }

    printWindow.document.write(
      "<html><head><title>Preparing Reports</title></head>" +
      "<body><p>Preparing student report cards...</p></body></html>"
    );
    printWindow.document.close();

    try {
      const headers = getAuthOnlyHeaders();

      async function fetchJson(url) {
        const response = await fetch(url, {
          headers,
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(
            `Could not retrieve report data (${response.status}).`
          );
        }

        return response.json();
      }

      const branchQuery = `branch_id=${encodeURIComponent(branchId)}`;

      const [
        studentsData,
        scoresData,
        attendanceData,
        settingsData,
        gradingSettings
      ] = await Promise.all([
        fetchJson(`/api/students?${branchQuery}`),
        fetchJson(
          `/api/scores?${branchQuery}` +
          `&class_id=${encodeURIComponent(classId)}` +
          `&term=${encodeURIComponent(term)}` +
          `&academic_year=${encodeURIComponent(academicYear)}` +
          `&approval_status=approved`
        ),
        fetchJson(`/api/attendance?${branchQuery}`),
        fetchJson("/api/settings"),
        getGradingSettings()
      ]);

      const students = (studentsData.students || [])
        .filter(student =>
          String(student.branch_id) === String(branchId) &&
          String(student.class_id) === String(classId) &&
          String(student.status || "").toLowerCase() === "active" &&
          (!studentId || String(student.id) === String(studentId))
        )
        .sort((a, b) =>
          String(a.full_name || "").localeCompare(
            String(b.full_name || "")
          )
        );

      if (students.length === 0) {
        throw new Error(
          "No active students found for the selected report."
        );
      }

      const scores = (scoresData.scores || []).filter(score =>
        String(score.branch_id) === String(branchId) &&
        String(score.class_name || "") === String(className || "") &&
        String(score.term || "") === String(term || "") &&
        String(score.academic_year || "") === String(academicYear || "") &&
        String(score.approval_status || "").toLowerCase() === "approved"
      );

      const attendance = (
        attendanceData.attendance ||
        attendanceData.records ||
        []
      ).filter(record =>
        String(record.branch_id) === String(branchId) &&
        String(record.class_name || "") === String(className || "") &&
        String(record.term || "") === String(term || "") &&
        String(record.academic_year || "") === String(academicYear || "")
      );

      const settings = { ...(settingsData.settings || {}) };

      if (settings.school_logo &&
          settings.school_logo.startsWith("/uploads/")) {
        settings.school_logo =
          `${window.location.protocol}//${window.location.hostname}` +
          (["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? ":5000"
            : "") +
          settings.school_logo;
      }

      const cards = students.map(student => {
        const reportStudent = { ...student };

        if (reportStudent.profile_picture &&
            reportStudent.profile_picture.startsWith("/uploads/")) {
          reportStudent.profile_picture =
            `${window.location.protocol}//${window.location.hostname}` +
          (["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? ":5000"
            : "") +
            reportStudent.profile_picture;
        }

        return renderer.buildReportCard({
          student: reportStudent,
          settings,
          report,
          scores,
          attendance,
          gradingSettings
        });
      }).join("\n");

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Terminal Reports - ${renderer.escapeHtml(className)}</title>
          <style>${renderer.REPORT_STYLES}</style>
        </head>
        <body>
          ${cards}
        </body>
        </html>
      `);

      printWindow.document.close();

    } catch (error) {
      console.error("Report card printing error:", error);

      printWindow.document.open();
      printWindow.document.write(
        "<html><body><h3>Could not prepare report cards</h3>" +
        "<p>" + renderer.escapeHtml(error.message) + "</p>" +
        "</body></html>"
      );
      printWindow.document.close();

      alert(error.message);
    }
  }

  if (reportForm) {
    reportForm.addEventListener("submit", createReport);
  }

  if (reportTableBody) {
    reportTableBody.addEventListener("click", function (event) {
      const button = event.target.closest(".view-report-btn");
      if (button) {
        openPrintableReport(button);
      }
    });
  }

  loadBranches();
  loadClasses();
  loadReports();
});




// DELIGHT TERMINAL REPORT STUDENT SELECTOR
document.addEventListener("DOMContentLoaded", function () {
  const branch = document.getElementById("report_branch_id");
  const classSelect = document.getElementById("report_class_id");
  const studentSelect = document.getElementById("report_student_id");

  if (!branch || !classSelect || !studentSelect) return;

  const API = window.API_BASE_URL || "";

  let requestNumber = 0;
  let lastSelection = "";

  function authHeaders() {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  }

  function showMessage(message) {
    studentSelect.replaceChildren(
      new Option(message, "")
    );
    studentSelect.value = "";
  }

  async function loadStudents() {
    const branchId = branch.value;
    const classId = classSelect.value;

    const currentRequest = ++requestNumber;

    if (!branchId || !classId) {
      showMessage("Select branch and class first");
      return;
    }

    showMessage("Loading students...");

    try {
      const response = await fetch(
        `${API}/api/students?branch_id=${encodeURIComponent(branchId)}`,
        {
          headers: authHeaders(),
          cache: "no-store"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load students"
        );
      }

      if (
        currentRequest !== requestNumber ||
        branch.value !== branchId ||
        classSelect.value !== classId
      ) {
        return;
      }

      const students = (
        Array.isArray(data.students) ? data.students : []
      )
        .filter(student =>
          String(student.branch_id) === String(branchId) &&
          String(student.class_id) === String(classId) &&
          String(student.status || "").toLowerCase() === "active"
        )
        .sort((a, b) =>
          String(a.full_name || "")
            .localeCompare(String(b.full_name || ""))
        );

      if (students.length === 0) {
        showMessage("No students found in this class");
        return;
      }

      studentSelect.replaceChildren();

      studentSelect.add(
        new Option("Select student", "")
      );

      studentSelect.add(
        new Option(
          `All Students (${students.length})`,
          "all"
        )
      );

      for (const student of students) {
        const name =
          student.full_name || "Unnamed Student";

        const admission =
          student.admission_number || "No admission number";

        studentSelect.add(
          new Option(
            `${name} (${admission})`,
            String(student.id)
          )
        );
      }

    } catch (error) {
      if (currentRequest !== requestNumber) return;

      console.error(
        "Report student loading error:",
        error
      );

      showMessage("Could not load students");
    }
  }

  function selectionChanged() {
    const selection =
      `${branch.value}|${classSelect.value}`;

    if (selection === lastSelection) return;

    lastSelection = selection;
    loadStudents();
  }

  branch.addEventListener(
    "change",
    selectionChanged
  );

  classSelect.addEventListener(
    "change",
    selectionChanged
  );

  // Detect selections populated by other dashboard scripts.
  setInterval(selectionChanged, 500);

  selectionChanged();
});
