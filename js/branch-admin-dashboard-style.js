/* ==========================================================
   Branch Admin Dashboard Style Helper
   Applies only when logged-in user role is branch_admin.
   ========================================================== */

(function () {
  function getStoredUser() {
    const keys = ["user", "currentUser", "loggedInUser", "adminUser", "delight_user"];

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const user = JSON.parse(raw);
        if (user && typeof user === "object") return user;
      } catch (e) {}
    }

    return {};
  }

  function isBranchAdmin(user) {
    const role = String(user.role || user.user_role || user.account_type || "").toLowerCase();
    return (
      role === "branch_admin" ||
      role === "branch admin" ||
      role === "teacher_admin" ||
      role === "teacher admin"
    );
  }

  function applyBranchAdminDashboard() {
    const user = getStoredUser();

    if (!isBranchAdmin(user)) return;

    document.body.classList.add("branch-admin-mode");

    const sidebarTitle = document.querySelector(".sidebar h2");
    if (sidebarTitle) {
      sidebarTitle.textContent = "Branch Admin Panel";
    }

    const mainTitle = document.querySelector(".dashboard-main h1");
    if (mainTitle && mainTitle.textContent.toLowerCase().includes("dashboard")) {
      mainTitle.textContent = "Branch Dashboard Overview";
    }

    const intro = document.querySelector(".dashboard-main > p");
    if (intro) {
      const branchName = user.branch_name || user.branchName || user.branch || "";
      intro.textContent = branchName
        ? `Welcome to the ${branchName} branch dashboard. Manage students, teachers, attendance, fees, scores, and reports for your branch.`
        : "Welcome to your branch dashboard. Manage students, teachers, attendance, fees, scores, and reports for your branch.";
    }

    /* Hide Super Admin-only sections from Branch Admin */
    const branchManagement = document.getElementById("branch-management");
    if (branchManagement) {
      branchManagement.style.display = "none";
    }

    /* Hide sidebar links that should remain Super Admin only */
    document.querySelectorAll(".sidebar a").forEach((link) => {
      const text = link.textContent.trim().toLowerCase();

      if (
        text.includes("system settings") ||
        text.includes("edit website pages") ||
        text.includes("recent activities") ||
        text.includes("lock / disable accounts")
      ) {
        link.style.display = "none";
      }
    });

    /* Hide module cards that should remain Super Admin only */
    document.querySelectorAll(".module-access-card").forEach((card) => {
      const text = card.textContent.trim().toLowerCase();

      if (
        text.includes("settings") ||
        text.includes("backup") ||
        text.includes("lock / disable accounts")
      ) {
        card.style.display = "none";
      }
    });

    const accessTitle = document.querySelector("#system-access h2");
    if (accessTitle) {
      accessTitle.textContent = "Branch System Access";
    }

    const accessText = document.querySelector("#system-access p");
    if (accessText) {
      accessText.textContent = "Use the modules below to manage daily branch operations.";
    }
  }

  document.addEventListener("DOMContentLoaded", applyBranchAdminDashboard);
  setTimeout(applyBranchAdminDashboard, 500);
  setTimeout(applyBranchAdminDashboard, 1500);
})();
