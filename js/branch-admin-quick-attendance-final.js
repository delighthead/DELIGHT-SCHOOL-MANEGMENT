document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const quickBranch = document.getElementById("quick_branch_id");
  const quickClass = document.getElementById("quick_class_id");
  const loadBtn = document.getElementById("loadQuickStudentsBtn");
  const saveBtn = document.getElementById("saveQuickAttendanceBtn");
  const quickBox = document.getElementById("quickAttendanceBox");

  if (!quickBranch || !quickClass || !loadBtn || !quickBox) return;

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function token() {
    return localStorage.getItem("token") || "";
  }

  function isBranchAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "admin";
  }

  function branchId() {
    return getUser().branch_id || "";
  }

  function authHeaders() {
    return token() ? { Authorization: `Bearer ${token()}` } : {};
  }

  function updateTotals() {
    const statuses = Array.from(document.querySelectorAll(".quick-status"));

    const total = statuses.length;
    const present = statuses.filter(s => s.value === "present").length;
    const absent = statuses.filter(s => s.value === "absent").length;

    const totalBox = document.getElementById("quick_total_count");
    const presentBox = document.getElementById("quick_present_count");
    const absentBox = document.getElementById("quick_absent_count");

    if (totalBox) totalBox.textContent = total;
    if (presentBox) presentBox.textContent = present;
    if (absentBox) absentBox.textContent = absent;
  }

  function showMarkAllButtons() {
    const markBox = document.getElementById("quickMarkAllButtons");
    const statuses = document.querySelectorAll(".quick-status");

    if (markBox) {
      markBox.style.display = statuses.length ? "block" : "none";
    }
  }

  async function loadQuickStudentsFinal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    const selectedBranch = isBranchAdmin() ? branchId() : quickBranch.value;

    if (!selectedBranch) {
      alert("Branch is missing. Please login again.");
      return false;
    }

    if (!quickClass.value) {
      alert("Please select class.");
      return false;
    }

    quickBox.innerHTML = "<p>Loading students...</p>";

    try {
      const res = await fetch(`${API}/api/students?branch_id=${selectedBranch}`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load students.");
      }

      const students = (data.students || data.data || []).filter(stu => {
        return String(stu.class_id || "") === String(quickClass.value);
      });

      if (!students.length) {
        quickBox.innerHTML = "<p>No students found for selected class.</p>";
        if (saveBtn) saveBtn.style.display = "none";
        showMarkAllButtons();
        return false;
      }

      let html = `
        <div id="quickAttendanceTotals" style="display:flex; gap:20px; margin:15px 0; font-weight:bold;">
          <div>Total Students: <span id="quick_total_count">0</span></div>
          <div>Present: <span id="quick_present_count">0</span></div>
          <div>Absent: <span id="quick_absent_count">0</span></div>
        </div>

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
            <td>${stu.full_name || stu.student_name || ""}</td>
            <td>${stu.admission_number || ""}</td>
            <td>
              <select class="quick-status" data-student-id="${stu.id}">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </td>
            <td>
              <input type="text" class="quick-remarks" data-student-id="${stu.id}" placeholder="Optional">
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      quickBox.innerHTML = html;

      document.querySelectorAll(".quick-status").forEach(select => {
        select.addEventListener("change", updateTotals);
      });

      if (saveBtn) saveBtn.style.display = "inline-block";

      updateTotals();
      showMarkAllButtons();
    } catch (error) {
      console.error(error);
      quickBox.innerHTML = `<p>${error.message}</p>`;
    }

    return false;
  }

  function markAll(status) {
    const statuses = document.querySelectorAll(".quick-status");

    if (!statuses.length) {
      alert("Please load students first.");
      return;
    }

    statuses.forEach(select => {
      select.value = status;
    });

    updateTotals();
  }

  document.addEventListener("click", function (event) {
    const presentBtn = event.target.closest("#markAllPresentBtn");
    const absentBtn = event.target.closest("#markAllAbsentBtn");

    if (presentBtn) {
      event.preventDefault();
      markAll("present");
    }

    if (absentBtn) {
      event.preventDefault();
      markAll("absent");
    }
  }, true);

  loadBtn.addEventListener("click", loadQuickStudentsFinal, true);

  if (isBranchAdmin() && branchId()) {
    quickBranch.value = branchId();
    quickBranch.disabled = true;
  }
});
