document.addEventListener("DOMContentLoaded", function () {
  function createPromptShell() {
    const overlay = document.createElement("div");
    overlay.className = "web-prompt-overlay";

    const box = document.createElement("div");
    box.className = "web-prompt-box";

    const title = document.createElement("h3");
    title.className = "web-prompt-title";

    const message = document.createElement("p");
    message.className = "web-prompt-message";

    const actions = document.createElement("div");
    actions.className = "web-prompt-actions";

    box.appendChild(title);
    box.appendChild(message);
    box.appendChild(actions);
    overlay.appendChild(box);

    return { overlay, title, message, actions };
  }

  function showWebAlert(text, kind) {
    return new Promise(function (resolve) {
      const ui = createPromptShell();
      ui.title.textContent = kind === "warning" ? "Notice" : "Message";
      ui.message.textContent = text;

      const okBtn = document.createElement("button");
      okBtn.className = "web-prompt-btn primary";
      okBtn.textContent = "OK";
      okBtn.addEventListener("click", function () {
        ui.overlay.remove();
        resolve();
      });

      ui.actions.appendChild(okBtn);
      document.body.appendChild(ui.overlay);
      okBtn.focus();
    });
  }

  function showWebConfirm(text) {
    return new Promise(function (resolve) {
      const ui = createPromptShell();
      ui.title.textContent = "Please Confirm";
      ui.message.textContent = text;

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "web-prompt-btn ghost";
      cancelBtn.textContent = "Cancel";

      const yesBtn = document.createElement("button");
      yesBtn.className = "web-prompt-btn danger";
      yesBtn.textContent = "Delete";

      cancelBtn.addEventListener("click", function () {
        ui.overlay.remove();
        resolve(false);
      });

      yesBtn.addEventListener("click", function () {
        ui.overlay.remove();
        resolve(true);
      });

      ui.actions.appendChild(cancelBtn);
      ui.actions.appendChild(yesBtn);
      document.body.appendChild(ui.overlay);
      cancelBtn.focus();
    });
  }

  const buttons = document.querySelectorAll("button");

  buttons.forEach(function (button) {
    button.addEventListener("click", async function (event) {
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
        await showWebAlert("Edit form will open here. Backend will be added later.");
      }

      else if (text === "Open Report" || text === "View") {
        await showWebAlert("Report preview will open here. Backend report data will be added later.");
      }

      else if (text === "Generate Report") {
        await showWebAlert("Report generated on frontend. Backend will generate real report later.");
      }

      else if (text === "Print" || text.includes("Print")) {
        
      }

      else if (text.includes("Download")) {
        await showWebAlert("Download PDF/Excel feature will be connected later.");
      }

      else if (text === "Manage") {
        await showWebAlert("Manage page/item selected. Backend will manage records later.");
      }

      else if (text === "Delete") {
        const confirmDelete = await showWebConfirm("Are you sure you want to delete this record?");
        if (confirmDelete) {
          const row = button.closest("tr");
          if (row) row.remove();
          await showWebAlert("Record removed from frontend. Backend will delete permanently later.", "warning");
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

        await showWebAlert(text + " clicked. Backend function will be added later.");
      }
    });
  });
});
