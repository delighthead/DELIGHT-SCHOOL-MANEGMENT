document.addEventListener("DOMContentLoaded", function () {
  const dashboardCards = document.getElementById("adminDashboardCards");

  function getApiBase() {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "";
    }
    return "";
  }

  const API_BASE = getApiBase();

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");

    return token ? {
      "Authorization": `Bearer ${token}`
    } : {};
  }

  function isAdmin() {
    const user = getLoggedInUser();
    return user && user.role === "branch_admin";
  }

  function getAdminId() {
    const user = getLoggedInUser();
    return user ? user.branch_id : null;
  }

  function money(value) {
    return `GHS ${Number(value || 0).toFixed(2)}`;
  }

  function branchLines(items) {
    if (!items || items.length === 0) return "";

    return items.map(function (item) {
      return `<small>${item.branch_name}: ${item.total}</small>`;
    }).join('<span style="display:inline-block; width:20px;"></span>');
  }

  function feeLines(items, field) {
    if (!items || items.length === 0) return "";

    return items.map(function (item) {
      return `<small>${item.branch_name}: ${money(item[field])}</small>`;
    }).join('<span style="display:inline-block; width:20px;"></span>');
  }

  async function fetchWithRetry(url, options, retries) {
    let lastError = null;

    for (let i = 0; i <= retries; i += 1) {
      try {
        return await fetch(url, options);
      } catch (error) {
        lastError = error;
        if (i < retries) {
          await new Promise(function (resolve) {
            setTimeout(resolve, 350);
          });
        }
      }
    }

    throw lastError || new Error("Network request failed");
  }

  async function loadDashboardSummary() {
    if (!dashboardCards) return;

    try {
      let url = `${API_BASE}/api/dashboard/admin-summary`;

      if (isAdmin()) {
        url += `?branch_id=${getAdminId()}`;
      }

      const response = await fetchWithRetry(url, {
        headers: getAuthOnlyHeaders()
      }, 2);

      const data = await response.json();

      if (!response.ok) {
        dashboardCards.innerHTML = `<p>${data.message || "Could not load dashboard summary."}</p>`;
        return;
      }

      const s = data.summary || {};
      const b = data.breakdown || null;

      dashboardCards.innerHTML = `
        <div class="dashboard-card summary-card">
          <h2>Total Students</h2>
          <p>${s.students || 0}</p>
          ${b ? branchLines(b.students) : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Total Teachers</h2>
          <p>${s.teachers || 0}</p>
          ${b ? branchLines(b.teachers) : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Total Parents</h2>
          <p>${s.parents || 0}</p>
          ${b ? branchLines(b.parents) : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Total Payable</h2>
          <p>${money(s.total_payable)}</p>
          ${b ? feeLines(b.fees, "total_payable") : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Total Paid</h2>
          <p>${money(s.total_paid)}</p>
          ${b ? feeLines(b.fees, "total_paid") : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Fees Balance</h2>
          <p>${money(s.total_balance)}</p>
          ${b ? feeLines(b.fees, "total_balance") : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Pending Scores</h2>
          <p>${s.pending_scores || 0}</p>
          ${b ? branchLines(b.pending_scores) : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Announcements</h2>
          <p>${s.announcements || 0}</p>
          ${b ? branchLines(b.announcements) : ""}
        </div>

        <div class="dashboard-card summary-card">
          <h2>Attendance Today</h2>
          <p>${s.attendance_today || 0}</p>
          ${b ? branchLines(b.attendance_today) : ""}
        </div>
      `;
    } catch (error) {
      console.error(error);
      dashboardCards.innerHTML = `<p>Cannot connect to backend. Make sure backend is running and login again.</p>`;
    }
  }

  loadDashboardSummary();
});


