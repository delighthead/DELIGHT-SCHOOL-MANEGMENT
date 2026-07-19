(function () {
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

  function getTableBody() {
    return (
      document.getElementById("scoreTableBody") ||
      document.getElementById("scoresTableBody") ||
      document.querySelector("#scoresTable tbody") ||
      document.querySelector(".data-table tbody")
    );
  }

  function showScoreMessage(message) {
    const tableBody = getTableBody();

    if (!tableBody) {
      alert(message);
      return;
    }

    tableBody.innerHTML = `
      <tr>
        <td colspan="14">${message}</td>
      </tr>
    `;
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

  window.searchScoresDirectNow = async function () {
    const branchSelect = document.getElementById("score_filter_branch_id");
    const classSelect = document.getElementById("score_filter_class_id");
    const subjectSelect = document.getElementById("score_filter_subject");
    const termSelect = document.getElementById("score_filter_term");
    const yearInput = document.getElementById("score_filter_academic_year");
    const statusSelect = document.getElementById("score_filter_approval_status");
    const tableBody = getTableBody();

    if (!branchSelect || !classSelect || !subjectSelect || !termSelect || !yearInput) {
      alert("Search form is not loaded properly. Refresh the page.");
      return;
    }

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

    if (statusSelect && statusSelect.value) {
      params.append("approval_status", statusSelect.value);
    }

    try {
      showScoreMessage("Loading scores...");

      const response = await fetch(`http://127.0.0.1:5000/api/scores?${params.toString()}`, {
        headers: authHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load scores.");
      }

      const scores = data.scores || [];

      if (scores.length === 0) {
        showScoreMessage("No scores found for this search.");
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
      showScoreMessage("Could not load scores. Make sure backend is running.");
      alert(error.message);
    }
  };

  window.clearScoresDirectNow = function () {
    const branchSelect = document.getElementById("score_filter_branch_id");
    const classSelect = document.getElementById("score_filter_class_id");
    const subjectSelect = document.getElementById("score_filter_subject");
    const termSelect = document.getElementById("score_filter_term");
    const yearInput = document.getElementById("score_filter_academic_year");
    const statusSelect = document.getElementById("score_filter_approval_status");

    if (branchSelect) branchSelect.value = "";
    if (classSelect) classSelect.value = "";
    if (subjectSelect) subjectSelect.value = "";
    if (termSelect) termSelect.value = "";
    if (yearInput) yearInput.value = "";
    if (statusSelect) statusSelect.value = "";

    showScoreMessage("Select branch, class, subject, term, and academic year, then click Search Scores.");
  };

  async function updateApproval(select) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/scores/${select.dataset.id}/approval`, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({
          approval_status: select.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update approval.");
      }

      alert("Approval status updated.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  document.addEventListener("click", function (event) {
    const searchBtn = event.target.closest("#searchScoresBtn");
    const clearBtn = event.target.closest("#clearScoresSearchBtn");

    if (searchBtn) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.searchScoresDirectNow();
      return;
    }

    if (clearBtn) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.clearScoresDirectNow();
      return;
    }
  }, true);

  document.addEventListener("change", function (event) {
    const select = event.target.closest(".score-approval-select");
    if (select) updateApproval(select);
  });

  document.addEventListener("DOMContentLoaded", function () {
    showScoreMessage("Select branch, class, subject, term, and academic year, then click Search Scores.");
  });
})();


