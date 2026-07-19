window.promoteSelectedStudentFinal = async function () {
  const branchSelect = document.getElementById("promotion_branch_id");
  const fromClassSelect = document.getElementById("from_class_id");
  const toClassSelect = document.getElementById("to_class_id");
  const academicYearInput = document.getElementById("promotion_academic_year");
  const promoteBtn = document.getElementById("promoteStudentsBtn");

  const checkedBoxes = Array.from(document.querySelectorAll(".promotion-student-check:checked"));
  const selectedIds = checkedBoxes.map(box => box.value);

  function getToken() {
    return localStorage.getItem("token");
  }

  if (!branchSelect || !fromClassSelect || !toClassSelect) {
    alert("Promotion form is not loaded properly.");
    return;
  }

  if (!branchSelect.value || !fromClassSelect.value) {
    alert("Please select branch and current class.");
    return;
  }

  if (!toClassSelect.value) {
    alert("Please select the class to promote to.");
    return;
  }

  if (String(fromClassSelect.value) === String(toClassSelect.value)) {
    alert("Current class and promote-to class cannot be the same.");
    return;
  }

  if (selectedIds.length === 0) {
    alert("Please tick/select at least one student to promote.");
    return;
  }

  if (!confirm(`Promote ${selectedIds.length} selected student(s)?`)) {
    return;
  }

  if (promoteBtn) {
    promoteBtn.disabled = true;
    promoteBtn.textContent = "Promoting...";
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/api/promotions/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        branch_id: branchSelect.value,
        from_class_id: fromClassSelect.value,
        to_class_id: toClassSelect.value,
        academic_year: academicYearInput ? academicYearInput.value : "",
        student_ids: selectedIds
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Promotion failed.");
    }

    alert(`Promotion completed. ${data.promoted_count || 0} student(s) updated.`);
    location.reload();
  } catch (error) {
    console.error(error);
    alert("Could not promote student: " + error.message);
  } finally {
    if (promoteBtn) {
      promoteBtn.disabled = false;
      promoteBtn.textContent = "Promote Selected Student(s)";
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const promoteBtn = document.getElementById("promoteStudentsBtn");

  if (promoteBtn) {
    promoteBtn.type = "button";
    promoteBtn.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.promoteSelectedStudentFinal();
    };
  }
});
