document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("feesSearchInput");
  const searchBtn = document.getElementById("feesSearchBtn");
  const clearBtn = document.getElementById("feesClearSearchBtn");

  function getFeesRows() {
    const body =
      document.getElementById("feeTableBody") ||
      document.getElementById("feesTableBody") ||
      document.querySelector("tbody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"));
  }

  function searchFees() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const rows = getFeesRows();

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

    getFeesRows().forEach(row => {
      row.style.display = "";
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", searchFees);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchFees();
      }

      if (!searchInput.value.trim()) {
        clearSearch();
      }
    });
  }
});
