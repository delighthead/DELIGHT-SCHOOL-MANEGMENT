/* ==========================================================
   Super Admin Dashboard Style Helper
   Applies only when logged-in user is NOT branch_admin.
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

  function isSuperAdmin(user) {
    const role = String(user.role || user.user_role || user.account_type || "").toLowerCase();
    return role === "super_admin" || role === "super admin";
  }

  function applySuperAdminDashboard() {
    const user = getStoredUser();

    if (!isSuperAdmin(user)) return;

    document.body.classList.add("super-admin-mode");

    const sidebarTitle = document.querySelector(".sidebar h2");
    if (sidebarTitle) {
      sidebarTitle.textContent = "Super Admin Panel";
    }

    const mainTitle = document.querySelector(".dashboard-main h1");
    if (mainTitle && mainTitle.textContent.toLowerCase().includes("dashboard")) {
      mainTitle.textContent = "Super Admin Dashboard";
    }

    const intro = document.querySelector(".dashboard-main > p");
    if (intro) {
      intro.textContent = "Welcome to the Super Admin dashboard. Manage all branches, users, students, teachers, parents, fees, attendance, scores, reports, website pages, and system settings.";
    }

    const accessTitle = document.querySelector("#system-access h2");
    if (accessTitle) {
      accessTitle.textContent = "Full School System Access";
    }

    const accessText = document.querySelector("#system-access p");
    if (accessText) {
      accessText.textContent = "The Super Admin has access to all major modules across the whole school system.";
    }

    const branchTitle = document.querySelector("#branch-management h2");
    if (branchTitle) {
      branchTitle.textContent = "School Branch Management";
    }

    const branchText = document.querySelector("#branch-management p");
    if (branchText) {
      branchText.textContent = "Create, edit, and manage all school branches from this section.";
    }
  }

  document.addEventListener("DOMContentLoaded", applySuperAdminDashboard);
  setTimeout(applySuperAdminDashboard, 500);
  setTimeout(applySuperAdminDashboard, 1500);
})();
