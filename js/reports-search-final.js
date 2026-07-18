document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("reportSearchInput");
  const searchBtn = document.getElementById("reportSearchBtn");
  const clearBtn = document.getElementById("reportClearSearchBtn");

  function getReportRows() {
    const body =
      document.getElementById("reportTableBody") ||
      document.querySelector("tbody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"));
  }

  function searchReports() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const rows = getReportRows();

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

    getReportRows().forEach(row => {
      row.style.display = "";
    });
  }

  if (searchBtn) searchBtn.addEventListener("click", searchReports);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchReports();
      }

      if (!searchInput.value.trim()) {
        clearSearch();
      }
    });
  }
});
