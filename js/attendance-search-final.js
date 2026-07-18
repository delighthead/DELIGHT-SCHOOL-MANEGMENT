document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("attendanceSearchInput");
  const searchBtn = document.getElementById("attendanceSearchBtn");
  const clearBtn = document.getElementById("attendanceClearSearchBtn");

  function getAttendanceRows() {
    const body =
      document.getElementById("attendanceTableBody") ||
      document.querySelector("tbody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"));
  }

  function searchAttendance() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const rows = getAttendanceRows();

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();

      if (!keyword || text.includes(keyword)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  function clearSearch() {
    if (searchInput) searchInput.value = "";

    getAttendanceRows().forEach(row => {
      row.style.display = "";
    });
  }

  if (searchBtn) searchBtn.addEventListener("click", searchAttendance);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchAttendance();
      }

      if (!searchInput.value.trim()) {
        clearSearch();
      }
    });
  }
});
