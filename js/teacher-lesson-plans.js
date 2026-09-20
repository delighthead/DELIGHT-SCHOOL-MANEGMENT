document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("lessonPlanForm");
  const tbody = document.getElementById("lessonPlansTableBody");
  const message = document.getElementById("lessonPlanMessage");
  const submitBtn = document.getElementById("lessonPlanSubmitBtn");

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

  function fileUrl(path) {
    if (!path) return "";
    return path;
  }

  async function loadLessonPlans() {
    if (!tbody) return;

    try {
      const response = await fetch("/api/lesson-plans/my", {
        headers: window.getAuthOnlyHeaders
          ? window.getAuthOnlyHeaders()
          : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load lesson plans.");
      }

      const plans = Array.isArray(data.lesson_plans)
        ? data.lesson_plans
        : [];

      if (!plans.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">No lesson plans submitted yet.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = plans.map(plan => `
        <tr>
          <td>${formatDate(plan.created_at)}</td>
          <td>${escapeHtml(plan.class_name || "-")}</td>
          <td>${escapeHtml(plan.subject || "-")}</td>
          <td>${escapeHtml(plan.week || "-")}</td>
          <td>${escapeHtml(plan.topic || "-")}</td>
          <td>
            ${
              plan.file_path
                ? `<a href="${escapeHtml(fileUrl(plan.file_path))}" target="_blank" rel="noopener">View File</a>`
                : "-"
            }
          </td>
          <td>${escapeHtml(plan.status || "Pending")}</td>
          <td>${escapeHtml(plan.admin_comment || "-")}</td>
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
          document.getElementById("lesson_class_name").value.trim()
        );

        formData.append(
          "subject",
          document.getElementById("lesson_subject").value.trim()
        );

        formData.append(
          "week",
          document.getElementById("lesson_week").value.trim()
        );

        formData.append(
          "topic",
          document.getElementById("lesson_topic").value.trim()
        );

        formData.append(
          "objectives",
          document.getElementById("lesson_objectives").value.trim()
        );

        formData.append(
          "resources",
          document.getElementById("lesson_resources").value.trim()
        );

        const file = document.getElementById("lesson_file").files[0];

        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("The selected file is larger than 10 MB.");
          }

          formData.append("lesson_file", file);
        }

        const response = await fetch("/api/lesson-plans", {
          method: "POST",
          headers: window.getAuthOnlyHeaders
            ? window.getAuthOnlyHeaders()
            : {},
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Lesson plan submission failed.");
        }

        message.textContent =
          data.message || "Lesson plan submitted successfully.";

        form.reset();
        await loadLessonPlans();

      } catch (error) {
        console.error(error);
        message.textContent = error.message || "Lesson plan submission failed.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Lesson Plan";
      }
    });
  }

  loadLessonPlans();
});
