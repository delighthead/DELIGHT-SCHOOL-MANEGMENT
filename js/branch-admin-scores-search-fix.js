document.addEventListener("DOMContentLoaded", function () {
  const searchBtn = document.getElementById("searchScoresBtn");

  if (!searchBtn) return;

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function isBranchAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "admin";
  }

  searchBtn.addEventListener("click", function (event) {
    if (!isBranchAdmin()) return;

    const branchSelect = document.getElementById("score_filter_branch_id");
    const addScoreBranch = document.getElementById("score_branch_id");
    const userBranchId = getUser().branch_id || "";

    if (branchSelect && !branchSelect.value && userBranchId) {
      branchSelect.value = userBranchId;
    }

    if (addScoreBranch && !addScoreBranch.value && userBranchId) {
      addScoreBranch.value = userBranchId;
    }
  }, true);
});
