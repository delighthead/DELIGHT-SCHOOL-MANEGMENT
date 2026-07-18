document.addEventListener("DOMContentLoaded", function () {
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
    return (user.role === "branch_admin" || user.role === "admin") && user.branch_id;
  }

  function applyBranchRuleToSelect(selectId) {
    const select = document.getElementById(selectId);
    const user = getUser();

    if (!select) return;

    if (isSuperAdmin(user)) {
      select.disabled = false;
      return;
    }

    if (isBranchAdmin(user)) {
      select.value = user.branch_id;
      select.disabled = true;

      const wrapper = select.closest(".form-group") || select.parentElement;

      if (wrapper) {
        wrapper.style.display = "none";
      }

      select.dispatchEvent(new Event("change"));
    }
  }

  function applyAll() {
    applyBranchRuleToSelect("score_filter_branch_id");
    applyBranchRuleToSelect("admin_excel_branch_id");
    applyBranchRuleToSelect("bulk_approval_branch_id");
  }

  setTimeout(applyAll, 800);
  setTimeout(applyAll, 1500);
  setTimeout(applyAll, 2500);
});


