
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const body = document.getElementById("feeTableBody");
  const branch = document.getElementById("feesFilterBranch");
  const cls = document.getElementById("feesFilterClass");
  const student = document.getElementById("feesFilterStudent");
  const searchInput = document.getElementById("feesSearchInput");
  const searchBtn = document.getElementById("feesSearchBtn");
  const clearBtn = document.getElementById("feesClearSearchBtn");

  if (!body || !branch || !cls || !student) return;

  let records = [];
  let keyword = "";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getRows() {
    return Array.from(body.querySelectorAll("tr"))
      .filter(row => row.querySelectorAll("td").length >= 11);
  }

  function readRecords() {
    records = getRows().map(row => {
      const cells = row.querySelectorAll("td");

      return {
        row,
        branch: cells[0].textContent.trim(),
        student: cells[1].textContent.trim(),
        admission: cells[2].textContent.trim(),
        cls: cells[3].textContent.trim(),
        text: normalize(row.textContent)
      };
    });
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))]
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      );
  }

  function populate(select, values, label) {
    const previous = select.value;

    select.replaceChildren();

    const all = document.createElement("option");
    all.value = "";
    all.textContent = label;
    select.appendChild(all);

    values.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    if (values.includes(previous)) {
      select.value = previous;
    }
  }

  let registeredBranches = [];

  async function loadRegisteredBranches() {
    try {
      const token = localStorage.getItem("token") || "";

      const response = await fetch("/api/branches", {
        headers: token
          ? { Authorization: "Bearer " + token }
          : {}
      });

      if (!response.ok) {
        throw new Error("Could not load registered branches");
      }

      const data = await response.json();

      registeredBranches = Array.isArray(data)
        ? data
        : Array.isArray(data.branches)
          ? data.branches
          : Array.isArray(data.data)
            ? data.data
            : [];

      populateBranches();

    } catch (error) {
      console.error("Fees branch filter:", error);
    }
  }

  function getLoggedInUser() {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch (error) {
      return {};
    }
  }

  function isBranchAdmin() {
    const role = String(
      getLoggedInUser().role || ""
    ).toLowerCase();

    return role === "branch_admin" ||
           role === "teacher_admin";
  }

  function populateBranches() {
    const user = getLoggedInUser();

    if (isBranchAdmin()) {
      const assignedBranch = registeredBranches.find(item =>
        String(item.id || item.branch_id) ===
        String(user.branch_id || "")
      );

      if (!assignedBranch) {
        branch.replaceChildren();

        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Assigned branch unavailable";
        branch.appendChild(option);

        branch.disabled = true;
        return;
      }

      const name = String(
        assignedBranch.branch_name ||
        assignedBranch.name ||
        assignedBranch.location ||
        "Branch"
      ).trim();

      populate(branch, [name], "Select Branch");
      branch.value = name;
      branch.disabled = true;

      return;
    }

    const names = registeredBranches.map(item =>
      String(
        item.branch_name ||
        item.name ||
        item.location ||
        ""
      ).trim()
    );

    populate(
      branch,
      unique(names),
      "All Branches"
    );

    branch.disabled = false;
  }

  function populateClasses() {
    const rows = records.filter(item =>
      !branch.value || item.branch === branch.value
    );

    populate(
      cls,
      unique(rows.map(item => item.cls)),
      "All Classes"
    );
  }

  function populateStudents() {
    const rows = records.filter(item =>
      (!branch.value || item.branch === branch.value) &&
      (!cls.value || item.cls === cls.value)
    );

    populate(
      student,
      unique(rows.map(item => item.student)),
      "All Students"
    );
  }

  function applyFilters() {
    const matches = records.filter(item =>
      (!branch.value || item.branch === branch.value) &&
      (!cls.value || item.cls === cls.value) &&
      (!student.value || item.student === student.value) &&
      (!keyword || item.text.includes(keyword))
    );

    const section = body.closest(".dashboard-section");

    const viewSelect = section?.querySelector(
      '[data-list-view-select="true"]'
    );

    const selected = viewSelect?.value || "5";

    const limit = selected === "all"
      ? matches.length
      : Math.max(0, Number(selected) || 5);

    const visible = new Set(
      matches.slice(0, limit).map(item => item.row)
    );

    records.forEach(item => {
      const shouldShow = visible.has(item.row);
      const next = shouldShow ? "" : "none";

      if (item.row.style.display !== next) {
        item.row.style.display = next;
      }
    });

    const count = section?.querySelector(".list-count-text");

    if (count) {
      count.textContent =
        Math.min(matches.length, limit) +
        " fee record(s) shown";
    }
  }

  function refresh() {
    readRecords();
    populateBranches();
    populateClasses();
    populateStudents();
    applyFilters();
  }

  branch.addEventListener("change", () => {
    cls.value = "";
    student.value = "";

    populateClasses();
    populateStudents();
    applyFilters();
  });

  cls.addEventListener("change", () => {
    student.value = "";

    populateStudents();
    applyFilters();
  });

  student.addEventListener("change", applyFilters);

  searchBtn?.addEventListener("click", () => {
    keyword = normalize(searchInput?.value);

    setTimeout(applyFilters, 0);
  });

  searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      keyword = normalize(searchInput.value);
      setTimeout(applyFilters, 0);
    }
  });

  searchInput?.addEventListener("input", () => {
    if (!searchInput.value.trim()) {
      keyword = "";
      setTimeout(applyFilters, 0);
    }
  });

  clearBtn?.addEventListener("click", () => {
    branch.value = "";
    cls.value = "";
    student.value = "";
    keyword = "";

    populateClasses();
    populateStudents();

    setTimeout(applyFilters, 0);
  });

  document.addEventListener(
    "feesViewLimitChanged",
    applyFilters
  );

  const section = body.closest(".dashboard-section");

  const viewSelect = section?.querySelector(
    '[data-list-view-select="true"]'
  );

  viewSelect?.addEventListener("change", () => {
    setTimeout(applyFilters, 0);
  });

  const observer = new MutationObserver(mutations => {
    if (mutations.some(item => item.type === "childList")) {
      refresh();
    }
  });

  observer.observe(body, {
    childList: true
  });

  refresh();
  loadRegisteredBranches();
});
