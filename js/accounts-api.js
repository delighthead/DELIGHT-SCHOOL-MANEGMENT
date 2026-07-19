document.addEventListener("DOMContentLoaded", function () {
  const accountTableBody = document.getElementById("accountTableBody");

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
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  }

  function isBranchAdmin() {
    const user = getLoggedInUser();
    return user && user.role === "branch_admin";
  }

  function getAdminBranchId() {
    const user = getLoggedInUser();
    return user ? user.branch_id : null;
  }

  function formatRole(role) {
    if (role === "super_admin") return "Super Admin";
    if (role === "branch_admin") return "Branch Admin";
    if (role === "teacher") return "Teacher";
    if (role === "parent") return "Parent";
    return role || "";
  }

  function formatStatus(status) {
    const value = String(status || "").toLowerCase();
    if (value === "active") return "Active";
    if (value === "locked") return "Locked";
    if (value === "disabled") return "Disabled";
    if (value === "inactive") return "Inactive";
    return status || "";
  }

  function canManageLoginStatus(role) {
    return role === "teacher" || role === "parent";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildActionButtons(account) {
    const buttons = [
      { key: "active", label: "Activate" },
      { key: "locked", label: "Lock" },
      { key: "disabled", label: "Disable" }
    ];

    return buttons
      .map((item) => {
        const isCurrent = String(account.status || "").toLowerCase() === item.key;
        return `
          <button
            type="button"
            class="small-btn account-status-btn"
            data-id="${account.id}"
            data-status="${item.key}"
            ${isCurrent ? "disabled" : ""}
            title="${item.label} account"
          >
            ${item.label}
          </button>
        `;
      })
      .join("");
  }

  async function updateAccountStatus(id, status) {
    const response = await fetch(`http://127.0.0.1:5000/api/accounts/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update account status");
    }
  }

  async function loadAccounts() {
    if (!accountTableBody) return;

    try {
      let url = "http://127.0.0.1:5000/api/accounts";

      if (isBranchAdmin()) {
        url += `?branch_id=${getAdminBranchId()}`;
      }

      const response = await fetch(url, {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      accountTableBody.innerHTML = "";

      if (!response.ok) {
        accountTableBody.innerHTML = `
          <tr>
            <td colspan="8">${data.message || "Could not load accounts."}</td>
          </tr>
        `;
        return;
      }

      if (!data.accounts || data.accounts.length === 0) {
        accountTableBody.innerHTML = `
          <tr>
            <td colspan="8">No accounts found.</td>
          </tr>
        `;
        return;
      }

      data.accounts.forEach(function (account) {
        const row = document.createElement("tr");
        const loginManaged = canManageLoginStatus(account.role);
        const loginScopeLabel = loginManaged ? "Teacher/Parent login" : "System account";

        row.innerHTML = `
          <td>${escapeHtml(account.branch_name || "")}</td>
          <td>${escapeHtml(account.full_name || "")}</td>
          <td>${escapeHtml(account.username || "")}</td>
          <td>${escapeHtml(formatRole(account.role))}</td>
          <td>${escapeHtml(account.phone || "")}</td>
          <td>${escapeHtml(account.email || "")}</td>
          <td>
            <div>${escapeHtml(formatStatus(account.status))}</div>
            <small>${loginScopeLabel}</small>
          </td>
          <td>
            ${buildActionButtons(account)}
          </td>
        `;

        accountTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      accountTableBody.innerHTML = `
        <tr>
          <td colspan="8">Cannot connect to backend.</td>
        </tr>
      `;
    }
  }

  if (accountTableBody) {
    accountTableBody.addEventListener("click", async function (event) {
      const button = event.target.closest(".account-status-btn");
      if (!button) return;

      const targetStatus = button.dataset.status;
      const statusLabel =
        targetStatus === "active"
          ? "activate"
          : targetStatus === "locked"
          ? "lock"
          : "disable";

      const confirmed = confirm(`Are you sure you want to ${statusLabel} this account?`);
      if (!confirmed) return;

      const buttons = accountTableBody.querySelectorAll(".account-status-btn");
      buttons.forEach((btn) => {
        btn.disabled = true;
      });

      try {
        await updateAccountStatus(button.dataset.id, targetStatus);

        alert("Account status updated successfully");
        loadAccounts();
      } catch (error) {
        console.error(error);
        alert(error.message || "Cannot connect to backend.");
        loadAccounts();
      } finally {
        buttons.forEach((btn) => {
          btn.disabled = false;
        });
      }
    });
  }

  loadAccounts();
});


