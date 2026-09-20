document.addEventListener("DOMContentLoaded", function () {
  const lessonBody =
    document.getElementById("adminLessonNotesBody");

  const handwritingBody =
    document.getElementById("adminHandwritingReportsBody");


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


  function headers() {
    return window.getAuthHeaders
      ? window.getAuthHeaders()
      : { "Content-Type": "application/json" };
  }


  async function loadLessonNotes() {
    try {
      const response = await fetch("/api/lesson-plans");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load Lesson Notes."
        );
      }

      const rows =
        Array.isArray(data.lesson_plans)
          ? data.lesson_plans
          : [];

      if (!rows.length) {
        lessonBody.innerHTML =
          '<tr><td colspan="9">No Lesson Notes submitted yet.</td></tr>';

        return;
      }

      lessonBody.innerHTML = rows.map(row => `
        <tr>
          <td>${formatDate(row.created_at)}</td>

          <td>
            <strong>${escapeHtml(row.teacher_name)}</strong>
            ${
              row.teacher_code
                ? `<br><small>${escapeHtml(row.teacher_code)}</small>`
                : ""
            }
          </td>

          <td>${escapeHtml(row.class_name || "-")}</td>
          <td>${escapeHtml(row.subject || "-")}</td>
          <td>${escapeHtml(row.week || "-")}</td>

          <td>
            ${
              row.file_path
                ? `<a href="${escapeHtml(row.file_path)}"
                     target="_blank"
                     rel="noopener">View Document</a>`
                : "-"
            }
          </td>

          <td>${escapeHtml(row.status || "Pending")}</td>

          <td>
            <textarea
              id="lesson-comment-${row.id}"
              rows="2"
              placeholder="Admin comment">${escapeHtml(row.admin_comment || "")}</textarea>
          </td>

          <td>
            <button
              type="button"
              onclick="reviewLessonNote(${Number(row.id)}, 'Approved')">
              Approve
            </button>

            <button
              type="button"
              onclick="reviewLessonNote(${Number(row.id)}, 'Rejected')">
              Reject
            </button>
          </td>
        </tr>
      `).join("");

    } catch (error) {
      console.error(error);

      lessonBody.innerHTML =
        `<tr><td colspan="9">${escapeHtml(error.message)}</td></tr>`;
    }
  }


  async function loadHandwritingReports() {
    try {
      const response =
        await fetch("/api/weekly-reports");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load Handwriting Reports."
        );
      }

      const rows =
        Array.isArray(data.weekly_reports)
          ? data.weekly_reports
          : [];

      if (!rows.length) {
        handwritingBody.innerHTML =
          '<tr><td colspan="8">No Handwriting Reports submitted yet.</td></tr>';

        return;
      }

      handwritingBody.innerHTML = rows.map(row => `
        <tr>
          <td>${formatDate(row.created_at)}</td>

          <td>
            <strong>${escapeHtml(row.teacher_name)}</strong>
            ${
              row.teacher_code
                ? `<br><small>${escapeHtml(row.teacher_code)}</small>`
                : ""
            }
          </td>

          <td>${escapeHtml(row.class_name || "-")}</td>
          <td>${escapeHtml(row.week || "-")}</td>

          <td>
            ${
              row.file_path
                ? `<a href="${escapeHtml(row.file_path)}"
                     target="_blank"
                     rel="noopener">View Document</a>`
                : "-"
            }
          </td>

          <td>${escapeHtml(row.status || "Pending")}</td>

          <td>
            <textarea
              id="handwriting-comment-${row.id}"
              rows="2"
              placeholder="Admin comment">${escapeHtml(row.admin_comment || "")}</textarea>
          </td>

          <td>
            <button
              type="button"
              onclick="reviewHandwritingReport(${Number(row.id)})">
              Mark Reviewed
            </button>
          </td>
        </tr>
      `).join("");

    } catch (error) {
      console.error(error);

      handwritingBody.innerHTML =
        `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
    }
  }


  window.reviewLessonNote = async function (id, status) {
    const comment =
      document.getElementById(`lesson-comment-${id}`)?.value || "";

    if (
      !confirm(
        `${status === "Approved" ? "Approve" : "Reject"} this Lesson Note?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(`/api/lesson-plans/${id}/review`, {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({
            status,
            admin_comment: comment
          })
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to review Lesson Note."
        );
      }

      alert(data.message || "Lesson Note updated.");
      await loadLessonNotes();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  window.reviewHandwritingReport = async function (id) {
    const comment =
      document.getElementById(`handwriting-comment-${id}`)?.value || "";

    if (!confirm("Mark this Handwriting Report as reviewed?")) {
      return;
    }

    try {
      const response =
        await fetch(`/api/weekly-reports/${id}/review`, {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({
            admin_comment: comment
          })
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to review Handwriting Report."
        );
      }

      alert(
        data.message ||
        "Handwriting Report marked as reviewed."
      );

      await loadHandwritingReports();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  loadLessonNotes();
  loadHandwritingReports();
});
