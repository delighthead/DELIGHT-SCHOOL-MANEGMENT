document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("teacherSearchInput");
  const searchBtn = document.getElementById("teacherSearchBtn");
  const clearBtn = document.getElementById("teacherClearSearchBtn");

  function getTeacherRows() {
    const body =
      document.getElementById("teacherTableBody") ||
      document.querySelector("tbody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"));
  }

  function searchTeachers() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const rows = getTeacherRows();

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

    getTeacherRows().forEach(row => {
      row.style.display = "";
    });
  }

  if (searchBtn) searchBtn.addEventListener("click", searchTeachers);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchTeachers();
      }

      if (!searchInput.value.trim()) {
        clearSearch();
      }
    });
  }
});
