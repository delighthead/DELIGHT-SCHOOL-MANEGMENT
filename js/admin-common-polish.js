document.addEventListener("DOMContentLoaded", function () {
  // Stop old general placeholder alerts from blocking real buttons
  const realButtonIds = [
    "approveBulkScoresBtn",
    "rejectBulkScoresBtn",
    "adminDownloadScoreTemplateBtn",
    "adminUploadScoreExcelBtn",
    "downloadScoreTemplateBtn",
    "uploadScoreExcelBtn",
    "promoteStudentsBtn",
    "previewPromotionBtn",
    "loadQuickStudentsBtn",
    "saveQuickAttendanceBtn",
    "printAttendanceBtn",
    "backupDatabaseBtn",
    "restoreDatabaseBtn",
    "searchScoresBtn",
    "clearScoresSearchBtn"
  ];

  realButtonIds.forEach(function (id) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener("click", function (event) {
      event.stopPropagation();
    }, true);
  });

  // Allow Enter key to click nearby Search button
  document.querySelectorAll("input[id*='Search'], input[id*='search']").forEach(function (input) {
    input.addEventListener("keyup", function (event) {
      if (event.key !== "Enter") return;

      const parent = input.closest(".student-search-box") || input.parentElement;
      if (!parent) return;

      const btn = parent.querySelector("button[id*='Search'], button[id*='search']");
      if (btn) btn.click();
    });
  });

  // Make empty tables clearer
  document.querySelectorAll("tbody").forEach(function (tbody) {
    if (tbody.children.length === 0) {
      const table = tbody.closest("table");
      const colCount = table ? table.querySelectorAll("thead th").length : 1;

      tbody.innerHTML = `
        <tr>
          <td colspan="${colCount}">No records found.</td>
        </tr>
      `;
    }
  });
});
