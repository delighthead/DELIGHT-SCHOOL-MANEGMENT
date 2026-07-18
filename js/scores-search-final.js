document.addEventListener("DOMContentLoaded", function () {
  const branchSelect = document.getElementById("score_filter_branch_id");
  const classSelect = document.getElementById("score_filter_class_id");
  const subjectSelect = document.getElementById("score_filter_subject");
  const termSelect = document.getElementById("score_filter_term");
  const yearInput = document.getElementById("score_filter_academic_year");
  const statusSelect = document.getElementById("score_filter_approval_status");
  const searchBtn = document.getElementById("searchScoresBtn");
  const clearBtn = document.getElementById("clearScoresSearchBtn");

  const tableBody =
    document.getElementById("scoreTableBody") ||
    document.getElementById("scoresTableBody") ||
    document.querySelector("#scoresTable tbody") ||
    document.querySelector(".data-table tbody");

  function getToken() {
    return localStorage.getItem("token");
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${getToken()}`
    };
  }

  function jsonHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    };
  }

  function showMessage(message) {
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="14">${message}</td>
      </tr>
    `;
  }

  async function loadBranches() {
    if (!branchSelect) return;

    try {
      branchSelect.innerHTML = '<option value="">Loading branches...</option>';

      const res = await fetch("http://127.0.0.1:5000/api/branches", {
        headers: authHeaders()
      });

      const data = await res.json();
      const branches = data.branches || [];

      branchSelect.innerHTML = '<option value="">Select branch</option>';

      branches.forEach(branch => {
        const opt = document.createElement("option");
        opt.value = branch.id;
        opt.textContent = branch.branch_name || branch.name || "";
        branchSelect.appendChild(opt);
      });
    } catch (error) {
      console.error(error);
      branchSelect.innerHTML = '<option value="">Cannot load branches</option>';
    }
  }

  async function loadClasses() {
    if (!classSelect) return;

    try {
      classSelect.innerHTML = '<option value="">Loading classes...</option>';

      const res = await fetch("http://127.0.0.1:5000/api/classes", {
        headers: authHeaders()
      });

      const data = await res.json();
      const classes = data.classes || [];

      classSelect.innerHTML = '<option value="">Select class</option>';

      classes.forEach(cls => {
        const opt = document.createElement("option");
        opt.value = cls.id;
        opt.textContent = cls.class_name;
        classSelect.appendChild(opt);
      });
    } catch (error) {
      console.error(error);
      classSelect.innerHTML = '<option value="">Cannot load classes</option>';
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/settings");
      const data = await res.json();
      const settings = data.settings || {};

      if (termSelect && !termSelect.value) termSelect.value = settings.current_term || "";
      if (yearInput && !yearInput.value) yearInput.value = settings.academic_year || "";
    } catch (error) {
      console.error(error);
    }
  }

  function number1(value) {
    return Number(value || 0).toFixed(1);
  }

  function approvalSelect(score) {
    return `
      <select class="score-approval-select" data-id="${score.id}">
        <option value="pending" ${score.approval_status === "pending" ? "selected" : ""}>Pending</option>
        <option value="approved" ${score.approval_status === "approved" ? "selected" : ""}>Approved</option>
        <option value="rejected" ${score.approval_status === "rejected" ? "selected" : ""}>Rejected</option>
      </select>
    `;
  }

  async function searchScores() {
    if (!branchSelect.value || !classSelect.value || !subjectSelect.value || !termSelect.value || !yearInput.value) {
      alert("Please select branch, class, subject, term, and academic year.");
      return;
    }

    const params = new URLSearchParams({
      branch_id: branchSelect.value,
      class_id: classSelect.value,
      subject: subjectSelect.value,
      term: termSelect.value,
      academic_year: yearInput.value.trim()
    });

    if (statusSelect.value) {
      params.append("approval_status", statusSelect.value);
    }

    try {
      showMessage("Loading scores...");

      const res = await fetch(`http://127.0.0.1:5000/api/scores?${params.toString()}`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load scores.");
      }

      const scores = data.scores || [];

      if (scores.length === 0) {
        showMessage("No scores found for this search.");
        return;
      }

      tableBody.innerHTML = "";

      scores.forEach(score => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${score.branch_name || ""}</td>
          <td>${score.student_name || ""}</td>
          <td>${score.admission_number || ""}</td>
          <td>${score.class_name || ""}</td>
          <td>${score.subject || ""}</td>
          <td>${score.term || ""}</td>
          <td>${score.academic_year || ""}</td>
          <td>${number1(score.assessment_score)}</td>
          <td>${number1(score.examination_score)}</td>
          <td>${number1(score.total_score)}</td>
          <td>${score.grade || ""}</td>
          <td>${score.position || ""}</td>
          <td>${score.entry_method || "manual"}</td>
          <td>${approvalSelect(score)}</td>
        `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      showMessage("Could not load scores. Make sure backend is running.");
    }
  }

  async function updateApproval(select) {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/scores/${select.dataset.id}/approval`, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({
          approval_status: select.value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not update approval.");
      }

      alert("Approval status updated.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  function clearSearch() {
    branchSelect.value = "";
    classSelect.value = "";
    subjectSelect.value = "";
    if (statusSelect) statusSelect.value = "";
    loadSettings();
    showMessage("Select branch, class, subject, term, and academic year, then click Search Scores.");
  }

  if (searchBtn) searchBtn.onclick = searchScores;
  if (clearBtn) clearBtn.onclick = clearSearch;

  document.addEventListener("change", function (event) {
    const select = event.target.closest(".score-approval-select");
    if (select) updateApproval(select);
  });

  loadBranches();
  loadClasses();
  loadSettings();

  setTimeout(function () {
    showMessage("Select branch, class, subject, term, and academic year, then click Search Scores.");
  }, 800);
});


