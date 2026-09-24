document.addEventListener("DOMContentLoaded", function () {
  const schoolInfoForm = document.getElementById("schoolInfoForm");
  const academicSettingsForm = document.getElementById("academicSettingsForm");
  const gradingSettingsForm = document.getElementById("gradingSettingsForm");
  const securitySettingsForm = document.getElementById("securitySettingsForm");
  const currentLogoBox = document.getElementById("currentLogoBox");

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    };
  }

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  }

  function showLogo(logoPath) {
    if (!currentLogoBox) return;

    if (!logoPath) {
      currentLogoBox.innerHTML = "No logo uploaded.";
      return;
    }

    currentLogoBox.innerHTML = `
      <img src="${logoPath}" alt="School Logo" style="width:90px;height:90px;object-fit:contain;border:1px solid #ccc;padding:5px;border-radius:8px;background:white;">
    `;
  }

  async function loadSettings() {
    try {
      const response = await fetch("/api/settings", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to load settings");
        return;
      }

      const settings = data.settings || data || {};

      setValue("school_name", settings.school_name);
      setValue("school_motto", settings.school_motto);
      setValue("school_phone", settings.school_phone);
      setValue("school_email", settings.school_email);
      setValue("school_address", settings.school_address);
      showLogo(settings.school_logo);

      setValue("academic_year", settings.academic_year);
      setValue("current_term", settings.current_term);
      setValue("assessment_max_score", settings.assessment_max_score);
      setValue("examination_max_score", settings.examination_max_score);
      setValue("total_max_score", settings.total_max_score);
      setValue("pass_mark", settings.pass_mark);

      setValue("default_username", settings.default_username);
      setValue("default_password", settings.default_password);
      setValue("allow_password_reset", settings.allow_password_reset);
      setValue("lock_after_attempts", settings.lock_after_attempts);
    } catch (error) {
      console.error("Cannot connect to settings backend:", error);
    }
  }

  async function saveSettings(payload, successMessage) {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save settings");
        return false;
      }

      alert(successMessage || data.message || "Settings saved successfully");
      await loadSettings();
      return true;
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend.");
      return false;
    }
  }

  async function uploadLogoIfSelected() {
    const logoInput = document.getElementById("school_logo");

    if (!logoInput || logoInput.files.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.append("school_logo", logoInput.files[0]);

    const response = await fetch("/api/settings/logo", {
      method: "POST",
      headers: getAuthOnlyHeaders(),
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to upload logo");
      return;
    }

    alert("School logo uploaded successfully");
  }

  if (schoolInfoForm) {
    schoolInfoForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const payload = {
        school_name: document.getElementById("school_name").value.trim(),
        school_motto: document.getElementById("school_motto").value.trim(),
        school_phone: document.getElementById("school_phone").value.trim(),
        school_email: document.getElementById("school_email").value.trim(),
        school_address: document.getElementById("school_address").value.trim()
      };

      const saved = await saveSettings(payload, "School information saved successfully");

      if (saved) {
        await uploadLogoIfSelected();
        await loadSettings();
      }
    });
  }

  if (academicSettingsForm) {
    academicSettingsForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const payload = {
        academic_year: document.getElementById("academic_year").value.trim(),
        current_term: document.getElementById("current_term").value,
        assessment_max_score: document.getElementById("assessment_max_score").value,
        examination_max_score: document.getElementById("examination_max_score").value,
        total_max_score: document.getElementById("total_max_score").value,
        pass_mark: document.getElementById("pass_mark").value
      };

      await saveSettings(payload, "Academic settings saved successfully");
    });
  }

  if (securitySettingsForm) {
    securitySettingsForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const payload = {
        default_username: document.getElementById("default_username").value.trim(),
        default_password: document.getElementById("default_password").value.trim(),
        allow_password_reset: document.getElementById("allow_password_reset").value,
        lock_after_attempts: document.getElementById("lock_after_attempts").value
      };

      await saveSettings(payload, "Security settings saved successfully");
    });
  }

  loadSettings();
});

// Database backup button
document.addEventListener("DOMContentLoaded", function () {
  const backupBtn = document.getElementById("backupDatabaseBtn");
  const backupStatusText = document.getElementById("backupStatusText");

  if (!backupBtn) return;

  backupBtn.addEventListener("click", async function () {
    const token = localStorage.getItem("token");

    backupBtn.disabled = true;
    backupBtn.textContent = "Backing up...";
    if (backupStatusText) backupStatusText.textContent = "Please wait, backup is running...";

    try {
      const response = await fetch("/api/settings/backup", {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Backup failed");
        if (backupStatusText) backupStatusText.textContent = data.error || "Backup failed.";
        return;
      }

      if (backupStatusText) {
        backupStatusText.innerHTML = `
          Backup completed successfully.
          <br>
          File: ${data.file}
          <br>
          <a href="${data.path}" download>Download Backup</a>
        `;
      }

      alert("Database backup completed successfully.");
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend.");
      if (backupStatusText) backupStatusText.textContent = "Cannot connect to backend.";
    } finally {
      backupBtn.disabled = false;
      backupBtn.textContent = "Backup Database";
    }
  });
});

// Database restore button
document.addEventListener("DOMContentLoaded", function () {
  const restoreBtn = document.getElementById("restoreDatabaseBtn");
  const restoreFile = document.getElementById("restoreBackupFile");
  const restoreStatusText = document.getElementById("restoreStatusText");

  if (!restoreBtn) return;

  restoreBtn.addEventListener("click", async function () {
    const token = localStorage.getItem("token");

    if (!restoreFile || restoreFile.files.length === 0) {
      alert("Please select a .sql backup file first.");
      return;
    }

    const confirmRestore = confirm(
      "WARNING: This will restore the database from the selected backup file. Current data may be replaced. Do you want to continue?"
    );

    if (!confirmRestore) {
      return;
    }

    const secondConfirm = confirm(
      "Are you very sure? This action is powerful and can change school data."
    );

    if (!secondConfirm) {
      return;
    }

    const formData = new FormData();
    formData.append("backup_file", restoreFile.files[0]);

    restoreBtn.disabled = true;
    restoreBtn.textContent = "Restoring...";
    if (restoreStatusText) restoreStatusText.textContent = "Please wait, database restore is running...";

    try {
      const response = await fetch("/api/settings/restore", {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Restore failed");
        if (restoreStatusText) restoreStatusText.textContent = data.error || "Restore failed.";
        return;
      }

      alert("Database restored successfully. Please refresh the system.");
      if (restoreStatusText) restoreStatusText.textContent = "Database restored successfully.";
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend.");
      if (restoreStatusText) restoreStatusText.textContent = "Cannot connect to backend.";
    } finally {
      restoreBtn.disabled = false;
      restoreBtn.textContent = "Restore Database";
    }
  });
});


/* ==========================================================
   HANDWRITING REPORT SUBMISSION CONTROL
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const container =
    document.getElementById("handwritingSubmissionControls");

  if (!container) return;

  function authHeaders() {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadControls() {
    container.innerHTML =
      "<p>Loading branch submission status...</p>";

    try {
      const response = await fetch(
        "/api/handwriting-submission-control",
        {
          headers: authHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load Handwriting Report submission controls."
        );
      }

      const controls = Array.isArray(data.controls)
        ? data.controls
        : [];

      if (!controls.length) {
        container.innerHTML =
          "<p>No branches are available.</p>";
        return;
      }

      container.innerHTML = controls.map(item => {
        const isOpen = Number(item.is_open) === 1;

        return `
          <div
            style="
              border:1px solid #d1d5db;
              border-radius:10px;
              padding:16px;
              margin:12px 0;
            "
          >
            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                flex-wrap:wrap;
              "
            >
              <div>
                <strong>
                  ${escapeHtml(item.branch_name || "Branch")}
                </strong>

                <div style="margin-top:6px;">
                  ${
                    isOpen
                      ? "🟢 OPEN — Teachers can submit Handwriting Reports."
                      : "🔒 LOCKED — Teachers cannot submit Handwriting Reports."
                  }
                </div>
              </div>

              <button
                type="button"
                class="${isOpen ? "danger-btn" : "primary-btn"}"
                data-handwriting-branch="${Number(item.branch_id)}"
                data-handwriting-open="${isOpen ? "1" : "0"}"
              >
                ${
                  isOpen
                    ? "Lock Submission"
                    : "Open Submission"
                }
              </button>
            </div>
          </div>
        `;
      }).join("");

    } catch (error) {
      console.error(error);

      container.innerHTML =
        `<p>${escapeHtml(error.message)}</p>`;
    }
  }

  container.addEventListener("click", async function (event) {
    const button = event.target.closest(
      "[data-handwriting-branch]"
    );

    if (!button) return;

    const branchId =
      Number(button.dataset.handwritingBranch);

    const currentlyOpen =
      button.dataset.handwritingOpen === "1";

    const nextOpen = !currentlyOpen;

    const action =
      nextOpen ? "OPEN" : "LOCK";

    if (!confirm(
      `${action} Handwriting Report submission for this branch?`
    )) {
      return;
    }

    button.disabled = true;
    button.textContent =
      nextOpen ? "Opening..." : "Locking...";

    try {
      const response = await fetch(
        "/api/handwriting-submission-control",
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            branch_id: branchId,
            is_open: nextOpen
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to update submission status."
        );
      }

      alert(data.message);
      await loadControls();

    } catch (error) {
      console.error(error);
      alert(error.message);
      await loadControls();
    }
  });

  loadControls();
});
