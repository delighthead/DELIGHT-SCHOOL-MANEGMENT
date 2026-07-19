document.addEventListener("DOMContentLoaded", function () {
  const branchSelect = document.getElementById("promotion_branch_id");

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function isSuperAdmin(user) {
    return user.role === "super_admin";
  }

  function isBranchAdmin(user) {
    return user.role === "branch_admin" || user.role === "admin";
  }

  function applyBranchAdminRule() {
    const user = getUser();

    if (!branchSelect) return;

    // Super admin can select all branches
    if (isSuperAdmin(user)) {
      branchSelect.disabled = false;
      branchSelect.closest(".form-group")?.style.removeProperty("display");
      branchSelect.parentElement?.style.removeProperty("display");
      return;
    }

    // Branch admin should not choose branch
    if (isBranchAdmin(user) && user.branch_id) {
      branchSelect.value = user.branch_id;
      branchSelect.disabled = true;

      // Hide the branch field completely
      const wrapper = branchSelect.closest(".form-group") || branchSelect.parentElement;
      if (wrapper) {
        wrapper.style.display = "none";
      }

      // Trigger student loading after branch is set
      branchSelect.dispatchEvent(new Event("change"));
    }
  }

  // Wait for branches to load first
  setTimeout(applyBranchAdminRule, 800);
  setTimeout(applyBranchAdminRule, 1500);
});


