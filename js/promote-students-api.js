document.addEventListener("DOMContentLoaded", function () {
  const branchSelect = document.getElementById("promotion_branch_id");
  const fromClassSelect = document.getElementById("from_class_id");
  const toClassSelect = document.getElementById("to_class_id");
  const academicYearInput = document.getElementById("promotion_academic_year");
  const promoteBtn = document.getElementById("promoteStudentsBtn");
  const promotionActionBox = document.getElementById("promotionActionBox");
  const tableBody = document.getElementById("promotionTableBody");
  const countText = document.getElementById("promotionCountText");

  const searchInput = document.getElementById("promotionSearchInput");
  const searchBtn = document.getElementById("promotionSearchBtn");
  const clearBtn = document.getElementById("promotionClearBtn");

  const historyTableBody = document.getElementById("promotionHistoryTableBody");

  let studentsToPromote = [];

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

  async function loadSettings() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/settings");
      const data = await res.json();
      const settings = data.settings || {};

      if (academicYearInput && !academicYearInput.value) {
        academicYearInput.value = settings.academic_year || "";
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loades() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/branches", {
        headers: authHeaders()
      });

      const data = await res.json();
      const branches = data.branches || [];

      branchSelect.innerHTML = '<option value=""></option>';

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
    try {
      const res = await fetch("http://127.0.0.1:5000/api/classes", {
        headers: authHeaders()
      });

      const data = await res.json();
      const classes = data.classes || [];

      fromClassSelect.innerHTML = '<option value="">Select current class</option>';
      toClassSelect.innerHTML = '<option value="">Select class to promote to</option>';

      classes.forEach(cls => {
        const opt1 = document.createElement("option");
        opt1.value = cls.id;
        opt1.textContent = cls.class_name;
        fromClassSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = cls.id;
        opt2.textContent = cls.class_name;
        toClassSelect.appendChild(opt2);
      });

      const completed = document.createElement("option");
      completed.value = "completed";
      completed.textContent = "Completed";
      toClassSelect.appendChild(completed);
    } catch (error) {
      console.error(error);
      toClassSelect.innerHTML = '<option value="">Cannot load classes</option>';
    }
  }

  function hidePromotionAction() {
    if (promotionActionBox) promotionActionBox.style.display = "none";
  }

  function showPromotionAction() {
    if (promotionActionBox) promotionActionBox.style.display = "grid";
  }

  function renderStudents(students) {
    tableBody.innerHTML = "";

    if (students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">No active students found in this class.</td>
        </tr>
      `;

      countText.textContent = "0 active students found.";
      hidePromotionAction();
      return;
    }

    students.forEach(student => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>
          <input type="checkbox" class="promotion-student-check" value="${student.id}">
        </td>
        <td>${student.admission_number || ""}</td>
        <td>${student.full_name || ""}</td>
        <td>${student.class_name || ""}</td>
        <td>${student.status || ""}</td>
      `;

      tableBody.appendChild(row);
    });

    countText.textContent = `${students.length} active student(s) found. Tick/select the student(s) you want to promote.`;
    showPromotionAction();
  }

  async function loadStudentsForSelectedClass() {
    if (!branchSelect.value || !fromClassSelect.value) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Select branch and current class to show students.</td>
        </tr>
      `;

      countText.textContent = "No students loaded.";
      hidePromotionAction();
      return;
    }

    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Loading students...</td>
        </tr>
      `;

      const res = await fetch(
        `http://127.0.0.1:5000/api/students?branch_id=${branchSelect.value}`,
        { headers: authHeaders() }
      );

      const data = await res.json();
      const students = data.students || [];

      studentsToPromote = students.filter(stu =>
        String(stu.class_id || "") === String(fromClassSelect.value) &&
        String(stu.status || "").toLowerCase() === "active"
      );

      if (searchInput) searchInput.value = "";

      renderStudents(studentsToPromote);
    } catch (error) {
      console.error(error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Could not load students.</td>
        </tr>
      `;
      hidePromotionAction();
    }
  }

  function searchStudentsByName() {
    const keyword = (searchInput.value || "").trim().toLowerCase();

    const filtered = studentsToPromote.filter(stu => {
      const name = String(stu.full_name || "").toLowerCase();
      return !keyword || name.includes(keyword);
    });

    renderStudents(filtered);
  }

  function clearSearch() {
    if (searchInput) searchInput.value = "";
    renderStudents(studentsToPromote);
  }

  async function promoteSelectedStudents() {
    const checkedBoxes = Array.from(document.querySelectorAll(".promotion-student-check:checked"));
    const selectedIds = checkedBoxes.map(box => box.value);

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

    promoteBtn.disabled = true;
    promoteBtn.textContent = "Promoting...";

    try {
      const res = await fetch("http://127.0.0.1:5000/api/promotions/students", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          branch_id: branchSelect.value,
          from_class_id: fromClassSelect.value,
          to_class_id: toClassSelect.value,
          academic_year: academicYearInput.value,
          student_ids: selectedIds
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Promotion failed");
      }

      alert(`Promotion completed. ${data.promoted_count || 0} student(s) updated.`);
      location.reload();
    } catch (error) {
      console.error(error);
      alert("Could not promote students: " + error.message);
    } finally {
      promoteBtn.disabled = false;
      promoteBtn.textContent = "Promote Selected Student(s)";
    }
  }

  async function loadPromotionHistory() {
    if (!historyTableBody) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/promotions/history", {
        headers: authHeaders()
      });

      const data = await res.json();
      const history = data.history || [];

      if (history.length === 0) {
        historyTableBody.innerHTML = `
          <tr>
            <td colspan="8">No promotion history found.</td>
          </tr>
        `;
        return;
      }

      historyTableBody.innerHTML = "";

      history.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${item.promoted_at ? String(item.promoted_at).slice(0, 10) : ""}</td>
          <td>${item.full_name || ""}</td>
          <td>${item.admission_number || ""}</td>
          <td>${item.branch_name || ""}</td>
          <td>${item.from_class_name || ""}</td>
          <td>${item.to_class_name || ""}</td>
          <td>${item.academic_year || ""}</td>
          <td>${item.promoted_by_username || ""}</td>
        `;

        historyTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="8">Could not load promotion history.</td>
        </tr>
      `;
    }
  }

  if (branchSelect) branchSelect.addEventListener("change", loadStudentsForSelectedClass);
  if (fromClassSelect) fromClassSelect.addEventListener("change", loadStudentsForSelectedClass);

  if (promoteBtn) {
    promoteBtn.onclick = promoteSelectedStudents;
  }

  if (searchBtn) searchBtn.addEventListener("click", searchStudentsByName);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") searchStudentsByName();
      if (searchInput.value.trim() === "") clearSearch();
    });
  }

  hidePromotionAction();

  loadSettings();
  loadBranches();
  loadClasses();
  loadPromotionHistory();
});


