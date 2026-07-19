document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function isSuperAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "super_admin";
  }

  async function loadAssignBranches() {
    if (!isSuperAdmin()) return;

    const assignBranch = document.getElementById("assign_branch_id");
    if (!assignBranch) return;

    assignBranch.disabled = false;
    assignBranch.style.display = "block";

    const box = assignBranch.closest("div");
    if (box) box.style.display = "block";

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      const data = await res.json();
      const branches = data.branches || data.data || data || [];

      assignBranch.innerHTML = `<option value="">Select branch</option>`;

      if (!Array.isArray(branches)) return;

      branches.forEach(branch => {
        const option = document.createElement("option");
        option.value = branch.id || branch.branch_id;
        option.textContent =
          branch.branch_name ||
          branch.name ||
          branch.location ||
          branch.branch_location ||
          "Branch";

        assignBranch.appendChild(option);
      });
    } catch (error) {
      console.error("Assign branch loading failed:", error);
    }
  }

  loadAssignBranches();
});
