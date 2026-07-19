document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("studentSearchInput");
  const searchBtn = document.getElementById("studentSearchBtn");
  const clearBtn = document.getElementById("studentClearBtn");
  const tableBody = document.getElementById("studentTableBody");
  const countText = document.getElementById("studentCountText");

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
      countText.textContent = `Showing ${visibleRows.length} out of ${rows.length} students`;
    }
  }

  function searchStudents() {
    const keyword = searchInput.value.trim().toLowerCase();
    const rows = getStudentRows();

    rows.forEach(row => {
      const rowText = row.textContent.toLowerCase();

      if (!keyword || rowText.includes(keyword)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });

    updateCount();
  }

  function clearSearch() {
    searchInput.value = "";

    getStudentRows().forEach(row => {
      row.style.display = "";
    });

    updateCount();
  }

  searchBtn.onclick = searchStudents;
  clearBtn.onclick = clearSearch;

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      searchStudents();
    }

    if (searchInput.value.trim() === "") {
      clearSearch();
    }
  });

  setTimeout(updateCount, 1000);
});
