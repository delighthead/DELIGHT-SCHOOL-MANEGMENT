document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("studentSearchInput");
  const searchBtn = document.getElementById("studentSearchBtn");
  const clearBtn = document.getElementById("studentClearBtn");
  const tableBody = document.getElementById("studentTableBody");
  const countText = document.getElementById("studentCountText");
  const limitSelect = document.getElementById("studentLimitSelect");

  if (!searchInput || !searchBtn || !clearBtn || !tableBody) return;

  function getStudentRows() {
    return Array.from(tableBody.querySelectorAll("tr")).filter(row => {
      return !row.textContent.toLowerCase().includes("loading students") &&
             !row.textContent.toLowerCase().includes("cannot connect");
    });
  }

  function updateCount() {
    const rows = getStudentRows();
    const visibleRows = rows.filter(row => row.style.display !== "none");

    if (countText) {
      countText.textContent = `${visibleRows.length} student record(s) shown`;
    }
  }

  function getLimit() {
    if (!limitSelect) return 5;
    if (limitSelect.value === "all") return "all";

    const parsed = Number(limitSelect.value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }

  function searchStudents() {
    const keyword = searchInput.value.trim().toLowerCase();
    const rows = getStudentRows();
    const matchedRows = [];

    rows.forEach(row => {
      const rowText = row.textContent.toLowerCase();
      if (!keyword || rowText.includes(keyword)) {
        matchedRows.push(row);
      }
      row.style.display = "none";
    });

    const limit = getLimit();
    const maxVisible = limit === "all" ? matchedRows.length : limit;

    matchedRows.forEach((row, index) => {
      if (index < maxVisible) {
        row.style.display = "";
      }
    });

    updateCount();
  }

  function clearSearch() {
    searchInput.value = "";
    searchStudents();
  }

  searchBtn.onclick = searchStudents;
  clearBtn.onclick = clearSearch;

  if (limitSelect) {
    limitSelect.addEventListener("change", searchStudents);
  }

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      searchStudents();
    }

    if (searchInput.value.trim() === "") {
      clearSearch();
    }
  });

  setTimeout(searchStudents, 1000);
});
