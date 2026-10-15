document.addEventListener("DOMContentLoaded", function () {
  const API = "";

  const branchIds = [
    "attendance_branch_id",
    "quick_branch_id"
  ];

  const classIds = [
    "attendance_class_id",
    "quick_class_id"
  ];

  function getToken() {
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
    return role === "branch_admin";
  }

  function isSuperAdmin() {
    return String(getUser().role || "").toLowerCase() === "super_admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function headers() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function pickArray(data, key) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadBranches() {
    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: headers()
      });

      const data = await res.json();
      const branches = pickArray(data, "branches");

      branchIds.forEach(function (id) {
        const select = document.getElementById(id);
        if (!select) return;

        const oldValue = select.value;

        select.innerHTML = `<option value="">Select branch</option>`;

        branches.forEach(function (branch) {
          const option = document.createElement("option");
          option.value = branch.id || branch.branch_id;
          option.textContent = branch.branch_name || branch.name || branch.location || "Branch";
          select.appendChild(option);
        });

        if (isBranchAdmin() && !isSuperAdmin() && getBranchId()) {
          select.value = getBranchId();
          select.disabled = true;
        } else {
          select.disabled = false;
          if (oldValue) select.value = oldValue;
        }
      });
    } catch (error) {
      console.error("Attendance branch dropdown error:", error);
    }
  }

  async function loadClasses() {
    try {
      const res = await fetch(`${API}/api/classes`, {
        headers: headers()
      });

      const data = await res.json();
      const classes = pickArray(data, "classes");

      classIds.forEach(function (id) {
        const select = document.getElementById(id);
        if (!select) return;

        const oldValue = select.value;

        select.innerHTML = `<option value="">Select class</option>`;

        classes.forEach(function (cls) {
          const option = document.createElement("option");
          option.value = cls.id || cls.class_id || cls.class_name;
          option.textContent = cls.class_name || cls.name || "Class";
          select.appendChild(option);
        });

        if (oldValue) select.value = oldValue;
      });
    } catch (error) {
      console.error("Attendance class dropdown error:", error);
    }
  }

  async function start() {
    await loadBranches();
    await loadClasses();
  }

  start();
  setTimeout(start, 800);
  setTimeout(start, 1800);
});
