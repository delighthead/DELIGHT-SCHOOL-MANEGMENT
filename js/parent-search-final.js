document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("parentSearchInput");
  const searchBtn = document.getElementById("parentSearchBtn");
  const clearBtn = document.getElementById("parentClearSearchBtn");

  function getParentRows() {
    const body =
      document.getElementById("parentTableBody") ||
      document.querySelector("tbody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"));
  }

  function searchParents() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const rows = getParentRows();

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

    getParentRows().forEach(row => {
      row.style.display = "";
    });
  }

  if (searchBtn) searchBtn.addEventListener("click", searchParents);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchParents();
      }

      if (!searchInput.value.trim()) {
        clearSearch();
      }
    });
  }
});
