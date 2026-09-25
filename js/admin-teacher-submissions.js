document.addEventListener("DOMContentLoaded", function () {
  const lessonBody =
    document.getElementById("adminLessonNotesBody");

  const handwritingBody =
    document.getElementById("adminHandwritingReportsBody");

  const lessonPageSize =
    document.getElementById("lessonPageSize");

  const handwritingPageSize =
    document.getElementById("handwritingPageSize");

  const lessonPagination =
    document.getElementById("lessonPagination");

  const handwritingPagination =
    document.getElementById("handwritingPagination");

  const lessonInfo =
    document.getElementById("lessonPaginationInfo");

  const handwritingInfo =
    document.getElementById("handwritingPaginationInfo");

  let lessonRows = [];
  let handwritingRows = [];

  let lessonPage = 1;
  let handwritingPage = 1;


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


  function getPageSize(select) {
    if (!select || select.value === "all") {
      return Infinity;
    }

    return Number(select.value) || 5;
  }


  function getPageData(rows, page, select) {
    const pageSize = getPageSize(select);

    if (pageSize === Infinity) {
      return {
        rows,
        totalPages: 1,
        start: rows.length ? 1 : 0,
        end: rows.length
      };
    }

    const totalPages =
      Math.max(1, Math.ceil(rows.length / pageSize));

    const safePage =
      Math.min(Math.max(1, page), totalPages);

    const startIndex =
      (safePage - 1) * pageSize;

    return {
      rows: rows.slice(
        startIndex,
        startIndex + pageSize
      ),
      totalPages,
      page: safePage,
      start: rows.length ? startIndex + 1 : 0,
      end: Math.min(
        startIndex + pageSize,
        rows.length
      )
    };
  }


  function renderPagination(
    container,
    currentPage,
    totalPages,
    changeFunction
  ) {
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = `
      <button
        type="button"
        class="submission-page-btn"
        ${currentPage <= 1 ? "disabled" : ""}
        onclick="${changeFunction}(${currentPage - 1})">
        Previous
      </button>
    `;

    for (let page = 1; page <= totalPages; page++) {
      html += `
        <button
          type="button"
          class="submission-page-btn ${
            page === currentPage ? "active" : ""
          }"
          onclick="${changeFunction}(${page})">
          ${page}
        </button>
      `;
    }

    html += `
      <button
        type="button"
        class="submission-page-btn"
        ${currentPage >= totalPages ? "disabled" : ""}
        onclick="${changeFunction}(${currentPage + 1})">
        Next
      </button>
    `;

    container.innerHTML = html;
  }


  function renderLessonNotes() {
    if (!lessonRows.length) {
      lessonBody.innerHTML =
        '<tr><td colspan="9">No Lesson Notes submitted yet.</td></tr>';

      if (lessonInfo) {
        lessonInfo.textContent = "Showing 0 entries";
      }

      if (lessonPagination) {
        lessonPagination.innerHTML = "";
      }

      return;
    }

    const pageData =
      getPageData(
        lessonRows,
        lessonPage,
        lessonPageSize
      );

    lessonPage = pageData.page || 1;

    lessonBody.innerHTML =
      pageData.rows.map(row => `
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
              id="lesson-comment-${Number(row.id)}"
              rows="2"
              placeholder="Admin comment">${escapeHtml(row.admin_comment || "")}</textarea>
          </td>

          <td>
            <div class="submission-actions">
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

              <button
                type="button"
                onclick="sendLessonComment(${Number(row.id)})">
                Send Comment
              </button>

              <button
                type="button"
                class="submission-delete-btn"
                onclick="deleteLessonNote(${Number(row.id)})">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `).join("");

    if (lessonInfo) {
      lessonInfo.textContent =
        `Showing ${pageData.start}–${pageData.end} of ${lessonRows.length}`;
    }

    renderPagination(
      lessonPagination,
      lessonPage,
      pageData.totalPages,
      "changeLessonPage"
    );
  }


  function renderHandwritingReports() {
    if (!handwritingRows.length) {
      handwritingBody.innerHTML =
        '<tr><td colspan="8">No Handwriting Reports submitted yet.</td></tr>';

      if (handwritingInfo) {
        handwritingInfo.textContent = "Showing 0 entries";
      }

      if (handwritingPagination) {
        handwritingPagination.innerHTML = "";
      }

      return;
    }

    const pageData =
      getPageData(
        handwritingRows,
        handwritingPage,
        handwritingPageSize
      );

    handwritingPage = pageData.page || 1;

    handwritingBody.innerHTML =
      pageData.rows.map(row => `
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
              id="handwriting-comment-${Number(row.id)}"
              rows="2"
              placeholder="Admin comment">${escapeHtml(row.admin_comment || "")}</textarea>
          </td>

          <td>
            <div class="submission-actions">
              <button
                type="button"
                onclick="reviewHandwritingReport(${Number(row.id)}, 'Approved')">
                Approve
              </button>

              <button
                type="button"
                onclick="reviewHandwritingReport(${Number(row.id)}, 'Rejected')">
                Reject
              </button>

              <button
                type="button"
                onclick="sendHandwritingComment(${Number(row.id)})">
                Send Comment
              </button>

              <button
                type="button"
                class="submission-delete-btn"
                onclick="deleteHandwritingReport(${Number(row.id)})">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `).join("");

    if (handwritingInfo) {
      handwritingInfo.textContent =
        `Showing ${pageData.start}–${pageData.end} of ${handwritingRows.length}`;
    }

    renderPagination(
      handwritingPagination,
      handwritingPage,
      pageData.totalPages,
      "changeHandwritingPage"
    );
  }


  async function loadLessonNotes() {
    try {
      const response =
        await fetch("/api/lesson-plans", {
          headers: headers()
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load Lesson Notes."
        );
      }

      lessonRows =
        Array.isArray(data.lesson_plans)
          ? data.lesson_plans
          : [];

      renderLessonNotes();

    } catch (error) {
      console.error(error);

      lessonBody.innerHTML =
        `<tr><td colspan="9">${escapeHtml(error.message)}</td></tr>`;
    }
  }


  async function loadHandwritingReports() {
    try {
      const response =
        await fetch("/api/weekly-reports", {
          headers: headers()
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load Handwriting Reports."
        );
      }

      handwritingRows =
        Array.isArray(data.weekly_reports)
          ? data.weekly_reports
          : [];

      renderHandwritingReports();

    } catch (error) {
      console.error(error);

      handwritingBody.innerHTML =
        `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
    }
  }


  window.changeLessonPage = function (page) {
    lessonPage = page;
    renderLessonNotes();
  };


  window.changeHandwritingPage = function (page) {
    handwritingPage = page;
    renderHandwritingReports();
  };


  if (lessonPageSize) {
    lessonPageSize.addEventListener("change", function () {
      lessonPage = 1;
      renderLessonNotes();
    });
  }


  if (handwritingPageSize) {
    handwritingPageSize.addEventListener("change", function () {
      handwritingPage = 1;
      renderHandwritingReports();
    });
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


  window.reviewHandwritingReport = async function (id, status) {
    const comment =
      document.getElementById(`handwriting-comment-${id}`)?.value || "";

    if (
      !confirm(
        `${status === "Approved" ? "Approve" : "Reject"} this Handwriting Report?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(`/api/weekly-reports/${id}/review`, {
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
          data.message ||
          "Unable to review Handwriting Report."
        );
      }

      alert(
        data.message ||
        "Handwriting Report updated."
      );

      await loadHandwritingReports();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  window.sendLessonComment = async function (id) {
    const comment =
      document.getElementById(`lesson-comment-${id}`)?.value.trim() || "";

    if (!comment) {
      alert("Please enter a comment before sending.");
      return;
    }

    if (!confirm("Send this comment to the teacher by email?")) {
      return;
    }

    try {
      const response =
        await fetch(`/api/lesson-plans/${id}/comment`, {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({
            admin_comment: comment
          })
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send Lesson Note comment."
        );
      }

      alert(data.message || "Comment sent successfully.");
      await loadLessonNotes();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  window.sendHandwritingComment = async function (id) {
    const comment =
      document.getElementById(`handwriting-comment-${id}`)?.value.trim() || "";

    if (!comment) {
      alert("Please enter a comment before sending.");
      return;
    }

    if (!confirm("Send this comment to the teacher by email?")) {
      return;
    }

    try {
      const response =
        await fetch(`/api/weekly-reports/${id}/comment`, {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({
            admin_comment: comment
          })
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send Handwriting Report comment."
        );
      }

      alert(data.message || "Comment sent successfully.");
      await loadHandwritingReports();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  window.deleteLessonNote = async function (id) {
    if (
      !confirm(
        "Are you sure you want to delete this Lesson Note? " +
        "The document will also be removed. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(`/api/lesson-plans/${id}`, {
          method: "DELETE",
          headers: headers()
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete Lesson Note."
        );
      }

      alert(data.message || "Lesson Note deleted.");

      await loadLessonNotes();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  window.deleteHandwritingReport = async function (id) {
    if (
      !confirm(
        "Are you sure you want to delete this Handwriting Report? " +
        "The document will also be removed. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(`/api/weekly-reports/${id}`, {
          method: "DELETE",
          headers: headers()
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to delete Handwriting Report."
        );
      }

      alert(
        data.message ||
        "Handwriting Report deleted."
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
