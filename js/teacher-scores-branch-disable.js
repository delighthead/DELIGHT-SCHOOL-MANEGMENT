document.addEventListener("DOMContentLoaded", function () {
  function disableBranchField() {
    const branchSelect =
      document.getElementById("branch_id") ||
      document.getElementById("score_branch_id") ||
      document.getElementById("branchSelect") ||
      document.querySelector("select[name='branch_id']");

    if (!branchSelect) return;

    branchSelect.disabled = true;
    branchSelect.style.display = "none";

    const label = Array.from(document.querySelectorAll("label")).find(label =>
      label.textContent.trim().toLowerCase() === "branch"
    );

    if (label) {
      label.style.display = "none";
    }

    const parent = branchSelect.closest(".form-group") || branchSelect.parentElement;
    if (parent) {
      parent.style.display = "none";
    }
  }

  disableBranchField();
  setTimeout(disableBranchField, 500);
  setTimeout(disableBranchField, 1500);
});


