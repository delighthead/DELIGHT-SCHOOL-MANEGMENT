document.addEventListener("DOMContentLoaded", function () {
  const API = "";

  function normalizeAssignRoleField() {
    const byId = document.getElementById("assign_role");
    const roleField = byId || document.querySelector("#teacherAssignForm input[placeholder*='Subject Teacher']");

    if (!roleField) return;

    const options = [
      { value: "", label: "Select role" },
      { value: "Admin", label: "Admin" },
      { value: "Class Teacher", label: "Class Teacher" },
      { value: "Subject Teacher", label: "Subject Teacher" }
    ];

    if (roleField.tagName && roleField.tagName.toLowerCase() === "select") {
      const existingValues = Array.from(roleField.options || []).map(option => option.value);

      options.forEach(item => {
        if (!existingValues.includes(item.value)) {
          const option = document.createElement("option");
          option.value = item.value;
          option.textContent = item.label;
          roleField.appendChild(option);
        }
      });

      if (!roleField.value) {
        roleField.value = "Subject Teacher";
      }

      return;
    }

    const select = document.createElement("select");
    select.id = "assign_role";
    select.name = roleField.name || "assign_role";

    options.forEach(item => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      if (item.value === "Subject Teacher") {
        option.selected = true;
      }
      select.appendChild(option);
    });

    roleField.replaceWith(select);
  }

  async function loadTeacherBranches() {
    const branchSelect = document.getElementById("teacher_branch_id");
    if (!branchSelect) return;

    branchSelect.disabled = false;
    branchSelect.style.display = "block";

    const box = branchSelect.closest("div");
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

      branchSelect.innerHTML = `<option value="">Select branch</option>`;

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

        branchSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Teacher branch loading failed:", error);
    }
  }

  function loadTeacherStatus() {
    const statusSelect = document.getElementById("teacher_status");
    if (!statusSelect) return;

    statusSelect.innerHTML = `
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="locked">Locked</option>
      <option value="disabled">Disabled</option>
    `;
  }

  loadTeacherBranches();
  loadTeacherStatus();
  normalizeAssignRoleField();
});
