document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll("button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      const type = button.getAttribute("type");

      // Allow real form submit buttons to work
      if (type === "submit") {
        return;
      }

      // Allow buttons with onclick links to work
      if (button.hasAttribute("onclick")) {
        return;
      }

      // Allow Student List search and clear buttons to work
      if (
        button.id === "studentSearchBtn" ||
        button.id === "studentClearBtn" ||
        button.closest(".student-search-box") ||
        button.closest(".student-list-tools")
      ) {
        return;
      }

      // Allow backend-connected student buttons to work
      if (
        button.classList.contains("edit-student-btn") ||
        button.classList.contains("change-class-btn")
      ) {
        return;
      }

      event.preventDefault();

      const text = button.innerText.trim();

      if (text === "Edit") {
        alert("Edit form will open here. Backend will be added later.");
      }

      else if (text === "Open Report" || text === "View") {
        alert("Report preview will open here. Backend report data will be added later.");
      }

      else if (text === "Generate Report") {
        alert("Report generated on frontend. Backend will generate real report later.");
      }

      else if (text === "Print" || text.includes("Print")) {
        
      }

      else if (text.includes("Download")) {
        alert("Download PDF/Excel feature will be connected later.");
      }

      else if (text === "Manage") {
        alert("Manage page/item selected. Backend will manage records later.");
      }

      else if (text === "Delete") {
        const confirmDelete = confirm("Are you sure you want to delete this record?");
        if (confirmDelete) {
          const row = button.closest("tr");
          if (row) row.remove();
          alert("Record removed from frontend. Backend will delete permanently later.");
        }
      }

      else {
        // Do not show placeholder alert for buttons that already have real backend functions
        if (
          button.id === "approveBulkScoresBtn" ||
          button.id === "rejectBulkScoresBtn" ||
          button.id === "adminDownloadScoreTemplateBtn" ||
          button.id === "adminUploadScoreExcelBtn" ||
          button.id === "searchScoresBtn" ||
          button.id === "clearScoresSearchBtn" ||
          button.id === "loadQuickStudentsBtn" ||
          button.id === "saveQuickAttendanceBtn"
        ) {
          return;
        }

        alert(text + " clicked. Backend function will be added later.");
      }
    });
  });
});
