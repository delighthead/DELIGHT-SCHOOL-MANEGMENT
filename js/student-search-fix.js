document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("studentSearchInput");
  const searchBtn = document.getElementById("studentSearchBtn");
  const clearBtn = document.getElementById("studentClearBtn");
  const tableBody = document.getElementById("studentTableBody");
  const countText = document.getElementById("studentCountText");
  const limitSelect = document.getElementById("studentLimitSelect");

  const branchFilter = document.getElementById("studentListBranchFilter");
  const classFilter = document.getElementById("studentListClassFilter");
  const statusFilter = document.getElementById("studentListStatusFilter");

  if (!searchInput || !searchBtn || !clearBtn || !tableBody) return;

  let branchesLoaded = false;

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }

  function getRole() {
    return String(getUser().role || "").trim().toLowerCase();
  }

  function isBranchAdmin() {
    return ["branch_admin", "teacher_admin"].includes(getRole());
  }

  function getStudentRows() {
    return Array.from(tableBody.querySelectorAll("tr")).filter(row => {
      return row.dataset.branchName !== undefined &&
             row.dataset.className !== undefined &&
             row.dataset.status !== undefined;
    });
  }

  function getLimit() {
    if (!limitSelect) return 5;
    if (limitSelect.value === "all") return "all";

    const parsed = Number(limitSelect.value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }

  function updateCount(totalMatched, visibleCount) {
    if (!countText) return;

    if (totalMatched === visibleCount) {
      countText.textContent = `${visibleCount} student record(s) shown`;
    } else {
      countText.textContent =
        `${visibleCount} of ${totalMatched} student record(s) shown`;
    }
  }

  function fillSelect(select, firstLabel, values, selectedValue) {
    if (!select) return;

    select.innerHTML = "";

    if (firstLabel) {
      const firstOption = document.createElement("option");
      firstOption.value = "";
      firstOption.textContent = firstLabel;
      select.appendChild(firstOption);
    }

    values.forEach(item => {
      const option = document.createElement("option");
      option.value = String(item.value);
      option.textContent = item.label;
      select.appendChild(option);
    });

    if (
      selectedValue &&
      Array.from(select.options).some(
        option => option.value === String(selectedValue)
      )
    ) {
      select.value = String(selectedValue);
    }
  }

  async function loadBranchFilter() {
    if (!branchFilter) return;

    const user = getUser();
    const role = getRole();
    const userBranchId = String(user.branch_id || "");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/branches", {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load branches");
      }

      const branches = (data.branches || [])
        .filter(branch => branch && branch.id)
        .map(branch => ({
          value: String(branch.id),
          label: branch.branch_name || `Branch ${branch.id}`
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      if (["branch_admin", "teacher_admin"].includes(role)) {
        const ownBranch = branches.find(
          branch => branch.value === userBranchId
        );

        if (ownBranch) {
          fillSelect(branchFilter, "", [ownBranch], userBranchId);
        } else {
          fillSelect(
            branchFilter,
            "",
            [{
              value: userBranchId,
              label: "Assigned Branch"
            }],
            userBranchId
          );
        }

        branchFilter.value = userBranchId;
        branchFilter.disabled = true;
      } else {
        const previous = branchFilter.value;

        fillSelect(
          branchFilter,
          "All Branches",
          branches,
          previous
        );

        branchFilter.disabled = false;
      }

      branchesLoaded = true;
    } catch (error) {
      console.error("Student list branch filter error:", error);

      const rows = getStudentRows();
      const branches = new Map();

      rows.forEach(row => {
        const value = String(row.dataset.branchId || "").trim();
        const label = String(row.dataset.branchName || "").trim();

        if (value && label) {
          branches.set(value, label);
        }
      });

      const values = Array.from(branches.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));

      if (isBranchAdmin()) {
        const ownBranchId = String(getUser().branch_id || "");
        const ownBranch = values.find(
          branch => branch.value === ownBranchId
        );

        fillSelect(
          branchFilter,
          "",
          ownBranch ? [ownBranch] : values,
          ownBranchId
        );

        branchFilter.disabled = true;
      } else {
        fillSelect(
          branchFilter,
          "All Branches",
          values,
          branchFilter.value
        );
      }
    }
  }

  function rebuildClassOptions() {
    if (!classFilter) return;

    const selected = classFilter.value;
    const selectedBranch = branchFilter ? branchFilter.value : "";
    const classes = new Map();

    getStudentRows().forEach(row => {
      if (
        selectedBranch &&
        String(row.dataset.branchId || "") !== selectedBranch
      ) {
        return;
      }

      const value =
        String(row.dataset.classId || "").trim() ||
        String(row.dataset.className || "").trim();

      const label = String(row.dataset.className || "").trim();

      if (value && label) {
        classes.set(value, label);
      }
    });

    const values = Array.from(classes.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true })
      );

    fillSelect(classFilter, "All Classes", values, selected);
  }

  function filterStudents() {
    const keyword = searchInput.value.trim().toLowerCase();
    const selectedBranch = branchFilter ? branchFilter.value : "";
    const selectedClass = classFilter ? classFilter.value : "";
    const selectedStatus = statusFilter ? statusFilter.value : "";

    const rows = getStudentRows();
    const matchedRows = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");

      const admission = (cells[0]?.textContent || "").toLowerCase();
      const name = (cells[1]?.textContent || "").toLowerCase();
      const motherPhone = (cells[4]?.textContent || "").toLowerCase();
      const fatherPhone = (cells[5]?.textContent || "").toLowerCase();

      const matchesKeyword =
        !keyword ||
        admission.includes(keyword) ||
        name.includes(keyword) ||
        motherPhone.includes(keyword) ||
        fatherPhone.includes(keyword);

      const matchesBranch =
        !selectedBranch ||
        String(row.dataset.branchId || "") === selectedBranch;

      const rowClassValue =
        String(row.dataset.classId || "").trim() ||
        String(row.dataset.className || "").trim();

      const matchesClass =
        !selectedClass ||
        rowClassValue === selectedClass;

      const matchesStatus =
        !selectedStatus ||
        String(row.dataset.status || "") === selectedStatus;

      row.style.display = "none";

      if (
        matchesKeyword &&
        matchesBranch &&
        matchesClass &&
        matchesStatus
      ) {
        matchedRows.push(row);
      }
    });

    const limit = getLimit();
    const maxVisible =
      limit === "all" ? matchedRows.length : limit;

    matchedRows.forEach((row, index) => {
      if (index < maxVisible) {
        row.style.display = "";
      }
    });

    updateCount(
      matchedRows.length,
      Math.min(matchedRows.length, maxVisible)
    );
  }

  function clearFilters() {
    searchInput.value = "";

    if (statusFilter) {
      statusFilter.value = "";
    }

    if (isBranchAdmin()) {
      if (branchFilter) {
        branchFilter.value = String(getUser().branch_id || "");
      }
    } else if (branchFilter) {
      branchFilter.value = "";
    }

    rebuildClassOptions();

    if (classFilter) {
      classFilter.value = "";
    }

    filterStudents();
  }

  async function refreshFilters() {
    if (!branchesLoaded) {
      await loadBranchFilter();
    }

    rebuildClassOptions();
    filterStudents();
  }

  searchBtn.addEventListener("click", filterStudents);
  clearBtn.addEventListener("click", clearFilters);

  if (limitSelect) {
    limitSelect.addEventListener("change", filterStudents);
  }

  if (branchFilter) {
    branchFilter.addEventListener("change", function () {
      if (classFilter) {
        classFilter.value = "";
      }

      rebuildClassOptions();
      filterStudents();
    });
  }

  if (classFilter) {
    classFilter.addEventListener("change", filterStudents);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterStudents);
  }

  searchInput.addEventListener("input", function () {
    if (searchInput.value.trim() === "") {
      filterStudents();
    }
  });

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      filterStudents();
    }
  });

  document.addEventListener("students:loaded", refreshFilters);

  loadBranchFilter().then(function () {
    rebuildClassOptions();
    filterStudents();
  });

  setTimeout(refreshFilters, 1000);
});
