document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";
  const form = document.getElementById("scoreForm");

  if (!form) return;

  function token() {
    return localStorage.getItem("token") || "";
  }

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

  function value(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const branchId = isBranchAdmin()
      ? getUser().branch_id
      : value("score_branch_id");

    const payload = {
      branch_id: branchId,
      student_id: value("score_student_id"),
      subject: value("score_subject"),
      term: value("score_term"),
      academic_year: value("score_academic_year"),
      assessment_score: value("assessment_score"),
      examination_score: value("examination_score"),
      approval_status: value("score_approval_status") || "pending"
    };

    if (!payload.branch_id) {
      alert("Branch is missing. Please login again.");
      return false;
    }

    if (!payload.student_id) {
      alert("Please select student.");
      return false;
    }

    if (!payload.subject || !payload.term || !payload.academic_year) {
      alert("Please select subject, term, and academic year.");
      return false;
    }

    if (payload.assessment_score === "" || payload.examination_score === "") {
      alert("Please enter assessment and examination score.");
      return false;
    }

    try {
      const res = await fetch(`${API}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token() ? `Bearer ${token()}` : ""
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add score.");
        return false;
      }

      alert(data.message || "Score added successfully.");
      location.reload();
    } catch (error) {
      console.error("Add score error:", error);
      alert("Failed to add score.");
    }

    return false;
  }, true);
});
