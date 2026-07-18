document.addEventListener("DOMContentLoaded", function () {
  const ids = [
    "score_student_id",
    "score_term",
    "assessment_score",
    "examination_score",
    "score_approval_status"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const group = el.closest(".form-group") || el.parentElement;
    if (group) {
      group.style.display = "block";
      group.style.visibility = "visible";
    }

    el.style.display = "block";
    el.style.visibility = "visible";
    el.disabled = false;
  });
});
