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

  function getQuickFields() {
    return {
      branch: document.getElementById("quick_branch_id"),
      classId: document.getElementById("quick_class_id"),
      date: document.getElementById("quick_attendance_date"),
      term: document.getElementById("quick_term"),
      year: document.getElementById("quick_academic_year"),
      box: document.getElementById("quickAttendanceBox"),
      saveBtn: document.getElementById("saveQuickAttendanceBtn"),
      loadBtn: document.getElementById("loadQuickStudentsBtn")
    };
  }

  async function loadQuickStudentsNow() {
    const f = getQuickFields();

    if (!f.branch || !f.classId || !f.box) {
      alert("Quick Attendance form is not loaded properly.");
      return;
    }

    if (!f.branch.value || !f.classId.value) {
      alert("Please select branch and class.");
      return;
    }

    try {
      f.box.innerHTML = "<p>Loading students...</p>";

      const res = await fetch(`http://127.0.0.1:5000/api/students?branch_id=${f.branch.value}`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load students.");
      }

      const students = (data.students || []).filter(stu =>
        String(stu.class_id || "") === String(f.classId.value) &&
        String(stu.status || "active").toLowerCase() === "active"
      );

      if (students.length === 0) {
        f.box.innerHTML = "<p>No active students found for this class.</p>";
        if (f.saveBtn) f.saveBtn.style.display = "none";
        return;
      }

      let html = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
      `;

      students.forEach(stu => {
        html += `
          <tr>
            <td>${stu.full_name || ""}</td>
            <td>${stu.admission_number || ""}</td>
            <td>
              <select class="quick-status" data-student-id="${stu.id}">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </td>
            <td>
              <input type="text" class="quick-remarks" data-student-id="${stu.id}" placeholder="Optional remarks">
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      f.box.innerHTML = html;

      if (f.saveBtn) {
        f.saveBtn.style.display = "inline-block";
      }
    } catch (error) {
      console.error(error);
      f.box.innerHTML = "<p>Could not load students. Check backend.</p>";
      alert(error.message);
    }
  }

  async function saveQuickAttendanceNow() {
    const f = getQuickFields();
    const statuses = Array.from(document.querySelectorAll(".quick-status"));

    if (!f.branch.value || !f.classId.value || !f.date.value || !f.term.value || !f.year.value) {
      alert("Please select branch, class, date, term, and academic year.");
      return;
    }

    if (statuses.length === 0) {
      alert("Please load students first.");
      return;
    }

    if (!confirm(`Save attendance for ${statuses.length} student(s)?`)) {
      return;
    }

    const records = statuses.map(statusSelect => {
      const studentId = statusSelect.dataset.studentId;
      const remarkInput = document.querySelector(`.quick-remarks[data-student-id="${studentId}"]`);

      return {
        branch_id: f.branch.value,
        student_id: studentId,
        class_id: f.classId.value,
        teacher_id: null,
        attendance_date: f.date.value,
        term: f.term.value,
        academic_year: f.year.value,
        status: statusSelect.value,
        remarks: remarkInput ? remarkInput.value.trim() : ""
      };
    });

    try {
      if (f.saveBtn) {
        f.saveBtn.disabled = true;
        f.saveBtn.textContent = "Saving...";
      }

      const res = await fetch("http://127.0.0.1:5000/api/attendance/bulk", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ records })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not save attendance.");
      }

      alert("Quick attendance saved successfully.");
      location.reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      if (f.saveBtn) {
        f.saveBtn.disabled = false;
        f.saveBtn.textContent = "Save Quick Attendance";
      }
    }
  }

  window.loadQuickStudentsNow = loadQuickStudentsNow;
  window.saveQuickAttendanceNow = saveQuickAttendanceNow;

  document.addEventListener("click", function (event) {
    const loadBtn = event.target.closest("#loadQuickStudentsBtn");
    const saveBtn = event.target.closest("#saveQuickAttendanceBtn");

    if (loadBtn) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      loadQuickStudentsNow();
      return;
    }

    if (saveBtn) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      saveQuickAttendanceNow();
      return;
    }
  }, true);
})();
