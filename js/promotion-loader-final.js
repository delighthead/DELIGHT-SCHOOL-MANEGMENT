document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const branchSelect = document.getElementById("promotion_branch_id");
  const fromClassSelect = document.getElementById("from_class_id");
  const toClassSelect = document.getElementById("to_class_id");
  const tableBody = document.getElementById("promotionTableBody");
  const historyBody = document.getElementById("promotionHistoryTableBody");
  const countText = document.getElementById("promotionCountText");
  const actionBox = document.getElementById("promotionActionBox");

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders() {
    const headers = {};
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
  }

  function isBranchAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function pickArray(data, key) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  function fillSelect(select, items, placeholder, valueKeys, textKeys) {
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;

    items.forEach(item => {
      const option = document.createElement("option");

      let value = "";
      for (const key of valueKeys) {
        if (item[key] !== undefined && item[key] !== null) {
          value = item[key];
          break;
        }
      }

      let text = "";
      for (const key of textKeys) {
        if (item[key]) {
          text = item[key];
          break;
        }
      }

      option.value = value;
      option.textContent = text || value || "Item";
      select.appendChild(option);
    });
  }

  async function loadBranches() {
    if (!branchSelect) return;

    branchSelect.innerHTML = `<option value="">Loading branches...</option>`;

    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: authHeaders()
      });

      const data = await res.json();
      const branches = pickArray(data, "branches");

      fillSelect(
        branchSelect,
        branches,
        "Select branch",
        ["id", "branch_id"],
        ["branch_name", "name", "location"]
      );

      if (isBranchAdmin() && getBranchId()) {
        branchSelect.value = getBranchId();
        branchSelect.disabled = true;
      } else {
        branchSelect.disabled = false;
      }
    } catch (error) {
      console.error("Promotion branches load error:", error);
      branchSelect.innerHTML = `<option value="">Failed to load branches</option>`;
    }
  }

  async function loadClasses() {
    if (!fromClassSelect || !toClassSelect) return;

    fromClassSelect.innerHTML = `<option value="">Loading classes...</option>`;
    toClassSelect.innerHTML = `<option value="">Loading classes...</option>`;

    try {
      const res = await fetch(`${API}/api/classes?include_all=1`, {
        headers: authHeaders()
      });

      const data = await res.json();
      const classes = pickArray(data, "classes");

      fillSelect(
        fromClassSelect,
        classes,
        "Select current class",
        ["id", "class_id"],
        ["class_name", "name"]
      );

      fillSelect(
        toClassSelect,
        classes,
        "Select class to promote to",
        ["id", "class_id"],
        ["class_name", "name"]
      );

      const completedOption = document.createElement("option");
      completedOption.value = "completed";
      completedOption.textContent = "Completed";
      toClassSelect.appendChild(completedOption);
    } catch (error) {
      console.error("Promotion classes load error:", error);
      fromClassSelect.innerHTML = `<option value="">Failed to load classes</option>`;
      toClassSelect.innerHTML = `<option value="">Failed to load classes</option>`;
    }
  }

  async function loadStudentsForPromotion() {
    if (!tableBody) return;

    const branchId = branchSelect ? branchSelect.value : "";
    const classId = fromClassSelect ? fromClassSelect.value : "";

    if (!branchId || !classId) {
      tableBody.innerHTML = `<tr><td colspan="5">Select branch and current class to show students.</td></tr>`;
      if (countText) countText.textContent = "No students loaded.";
      if (actionBox) actionBox.style.display = "none";
      return;
    }

    tableBody.innerHTML = `<tr><td colspan="5">Loading students...</td></tr>`;

    try {
      const url = `${API}/api/students?branch_id=${encodeURIComponent(branchId)}&class_id=${encodeURIComponent(classId)}`;

      const res = await fetch(url, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load students");
      }

      const students = pickArray(data, "students");

      if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No students found for this class.</td></tr>`;
        if (countText) countText.textContent = "No students loaded.";
        if (actionBox) actionBox.style.display = "none";
        return;
      }

      tableBody.innerHTML = "";

      students.forEach(student => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>
            <input type="checkbox" class="promotion-student-check" value="${student.id}">
          </td>
          <td>${student.admission_no || student.admission_number || ""}</td>
          <td>${student.full_name || student.name || ""}</td>
          <td>${student.class_name || student.current_class || ""}</td>
          <td>${student.status || "Active"}</td>
        `;

        tableBody.appendChild(row);
      });

      if (countText) countText.textContent = `${students.length} student(s) loaded.`;
      if (actionBox) actionBox.style.display = "block";
    } catch (error) {
      console.error("Promotion students load error:", error);
      tableBody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
      if (countText) countText.textContent = "No students loaded.";
      if (actionBox) actionBox.style.display = "none";
    }
  }

  async function loadPromotionHistory() {
    if (!historyBody) return;

    historyBody.innerHTML = `<tr><td colspan="8">Loading promotion history...</td></tr>`;

    try {
      const res = await fetch(`${API}/api/promotions/history`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load promotion history");
      }

      const history = pickArray(data, "history");

      if (history.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="8">No promotion history found.</td></tr>`;
        return;
      }

      historyBody.innerHTML = "";

      history.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${item.promotion_date || item.date || ""}</td>
          <td>${item.student_name || item.full_name || ""}</td>
          <td>${item.admission_no || item.admission_number || ""}</td>
          <td>${item.branch_name || ""}</td>
          <td>${item.from_class_name || item.from_class || ""}</td>
          <td>${item.to_class_name || item.to_class || ""}</td>
          <td>${item.academic_year || ""}</td>
          <td>${item.promoted_by_name || item.promoted_by || ""}</td>
        `;

        historyBody.appendChild(row);
      });
    } catch (error) {
      console.error("Promotion history load error:", error);
      historyBody.innerHTML = `<tr><td colspan="8">${error.message}</td></tr>`;
    }
  }

  if (branchSelect) {
    branchSelect.addEventListener("change", loadStudentsForPromotion);
  }

  if (fromClassSelect) {
    fromClassSelect.addEventListener("change", loadStudentsForPromotion);
  }

  async function start() {
    await loadBranches();
    await loadClasses();
    await loadStudentsForPromotion();
    await loadPromotionHistory();
  }

  start();
});
