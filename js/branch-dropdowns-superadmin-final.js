document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const branchSelectIds = [
    "fee_branch_id",
    "score_branch_id",
    "score_filter_branch_id",
    "admin_excel_branch_id",
    "bulk_approval_branch_id",
    "attendance_branch_id",
    "quick_branch_id",
    "announcement_branch_id",
    "report_branch_id"
  ];

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function isSuperAdmin() {
    return String(getUser().role || "").toLowerCase() === "super_admin";
  }

  function isBranchAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function getBranchArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.branches)) return data.branches;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadBranchesInto(select) {
    if (!select) return;

    const currentValue = select.value;

    select.disabled = false;
    select.innerHTML = `<option value="">Loading branches...</option>`;

    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: {
          Authorization: getToken() ? `Bearer ${getToken()}` : ""
        }
      });

      const data = await res.json();
      const branches = getBranchArray(data);

      select.innerHTML = `<option value="">Select branch</option>`;

      branches.forEach(function (branch) {
        const option = document.createElement("option");
        option.value = branch.id || branch.branch_id;
        option.textContent =
          branch.branch_name ||
          branch.name ||
          branch.location ||
          "Branch";

        select.appendChild(option);
      });

      if (isBranchAdmin() && !isSuperAdmin() && getBranchId()) {
        select.value = getBranchId();
        select.disabled = true;
      } else {
        select.disabled = false;

        if (currentValue) {
          select.value = currentValue;
        }
      }
    } catch (error) {
      console.error("Branch dropdown load error:", error);
      select.innerHTML = `<option value="">Failed to load branches</option>`;
    }
  }

  async function loadAllBranchDropdowns() {
    for (const id of branchSelectIds) {
      const select = document.getElementById(id);
      if (select) {
        await loadBranchesInto(select);
      }
    }
  }

  loadAllBranchDropdowns();

  setTimeout(loadAllBranchDropdowns, 700);
  setTimeout(loadAllBranchDropdowns, 1500);
});
