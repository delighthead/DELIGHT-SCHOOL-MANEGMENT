document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  async function loadStudentBranches() {
    const branchSelect = document.getElementById("student_branch_id");
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
      console.error("Student branch loading failed:", error);
    }
  }

  loadStudentBranches();
});
