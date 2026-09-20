document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("lessonPlanForm");
  const classSelect = document.getElementById("lesson_class");
  const subjectSelect = document.getElementById("lesson_subject");
  const weekSelect = document.getElementById("lesson_week");
  const fileInput = document.getElementById("lesson_file");
  const tbody = document.getElementById("lessonPlansTableBody");
  const message = document.getElementById("lessonPlanMessage");
  const submitBtn = document.getElementById("lessonPlanSubmitBtn");

  let assignments = [];

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

    assignments = Array.isArray(data.assignments)
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

  function loadSubjectsForClass() {
    const classId = classSelect.value;

    const subjects = [
      ...new Set(
        assignments
          .filter(item => String(item.class_id) === String(classId))
          .map(item => item.subject)
          .filter(Boolean)
      )
    ];

    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    subjects.forEach(subject => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });

    if (!classId) {
      subjectSelect.innerHTML =
        '<option value="">Select Class First</option>';
    }
  }

  async function loadLessonNotes() {
    try {
      const response = await fetch("/api/lesson-plans/my", {
        headers: authHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load Lesson Notes.");
      }

      const rows = Array.isArray(data.lesson_plans)
        ? data.lesson_plans
        : [];

      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="7">No Lesson Notes uploaded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(row => `
        <tr>
          <td>${formatDate(row.created_at)}</td>
          <td>${escapeHtml(row.class_name || "-")}</td>
          <td>${escapeHtml(row.subject || "-")}</td>
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
        `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  classSelect.addEventListener("change", loadSubjectsForClass);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";

    const selectedClass =
      classSelect.options[classSelect.selectedIndex];

    const file = fileInput.files[0];

    if (!classSelect.value || !subjectSelect.value || !weekSelect.value) {
      message.textContent = "Please select Class, Subject and Week.";
      return;
    }

    if (!file) {
      message.textContent = "Please select a Lesson Note document.";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.textContent = "The selected document is larger than 10 MB.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
      const formData = new FormData();

      formData.append("class_id", classSelect.value);
      formData.append("class_name", selectedClass.dataset.className);
      formData.append("subject", subjectSelect.value);
      formData.append("week", weekSelect.value);
      formData.append("lesson_file", file);

      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lesson Note upload failed.");
      }

      message.textContent =
        data.message || "Lesson Note uploaded successfully.";

      form.reset();
      subjectSelect.innerHTML =
        '<option value="">Select Class First</option>';

      await loadLessonNotes();
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Lesson Note upload failed.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Upload Lesson Note";
    }
  });

  Promise.all([
    loadAssignments(),
    loadLessonNotes()
  ]).catch(error => {
    console.error(error);
    message.textContent = error.message;
  });
});
