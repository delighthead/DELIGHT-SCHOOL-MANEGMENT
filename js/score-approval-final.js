document.addEventListener("DOMContentLoaded", function () {
  const approveBtn = document.getElementById("approveBulkScoresBtn");
  const rejectBtn = document.getElementById("rejectBulkScoresBtn");

  const branchInput = document.getElementById("bulk_approval_branch_id");
  const classInput = document.getElementById("bulk_approval_class_id");
  const subjectInput = document.getElementById("bulk_approval_subject");
  const termInput = document.getElementById("bulk_approval_term");
  const yearInput = document.getElementById("bulk_approval_academic_year");

  function getToken() {
    return localStorage.getItem("token");
  }

  async function updatePendingScores(status) {
    if (!branchInput.value || !classInput.value || !subjectInput.value || !termInput.value || !yearInput.value) {
      alert("Please select branch, class, subject, term, and academic year.");
      return;
    }

    const actionText = status === "approved" ? "approve" : "reject";

    if (!confirm(`Are you sure you want to ${actionText} all pending scores for this class and subject?`)) {
      return;
    }

    const btn = status === "approved" ? approveBtn : rejectBtn;
    const oldText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
      const response = await fetch("http://127.0.0.1:5000/api/scores/bulk/approval", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          branch_id: branchInput.value,
          class_id: classInput.value,
          subject: subjectInput.value.trim(),
          term: termInput.value,
          academic_year: yearInput.value.trim(),
          approval_status: status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update scores.");
      }

      alert(`${data.updated_count || 0} pending score(s) changed to ${status}.`);
      location.reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  if (approveBtn) {
    approveBtn.onclick = function () {
      updatePendingScores("approved");
    };
  }

  if (rejectBtn) {
    rejectBtn.onclick = function () {
      updatePendingScores("rejected");
    };
  }
});
