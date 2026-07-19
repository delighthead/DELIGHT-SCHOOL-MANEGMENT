document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("accountSearchInput");
  const searchBtn = document.getElementById("accountSearchBtn");
  const clearBtn = document.getElementById("accountClearSearchBtn");

  function getAccountRows() {
    const bodies = [
      document.getElementById("accountTableBody"),
      document.getElementById("accountsTableBody"),
      document.querySelector("tbody")
    ];

    const body = bodies.find(Boolean);
    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"));
  }

  function searchAccounts() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const rows = getAccountRows();

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
    getAccountRows().forEach(row => {
      row.style.display = "";
    });
  }

  if (searchBtn) searchBtn.addEventListener("click", searchAccounts);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (searchInput) {
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchAccounts();
      }

      if (!searchInput.value.trim()) {
        clearSearch();
      }
    });
  }
});
