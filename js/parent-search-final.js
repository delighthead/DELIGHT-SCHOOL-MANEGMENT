document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("parentSearchInput");
  const searchBtn = document.getElementById("parentSearchBtn");
  const clearBtn = document.getElementById("parentClearSearchBtn");
  const limitSelect = document.getElementById("parentLimitSelect");
  const countText = document.getElementById("parentCountText");

  function getParentRows() {
    const body =
      document.getElementById("parentTableBody") ||
      document.querySelector("tbody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr")).filter((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length === 0) return false;
      if (cells.length === 1 && (cells[0].colSpan || 0) > 1) return false;
      return true;
    });
  }

  function getLimit() {
    if (!limitSelect) return 5;
    if (limitSelect.value === "all") return "all";

    const parsed = Number(limitSelect.value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }

  function applyParentListView(keyword) {
    const term = String(keyword || "").trim().toLowerCase();
    const rows = getParentRows();
    const matchedRows = [];

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      if (!term || text.includes(term)) {
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

    if (countText) {
      const shown = Math.min(maxVisible, matchedRows.length);
      countText.textContent = `${shown} parent record(s) shown`;
    }
  }

  function searchParents() {
    applyParentListView(searchInput?.value || "");
  }

  function clearSearch() {
    if (searchInput) searchInput.value = "";
    applyParentListView("");
  }

  if (searchBtn) searchBtn.addEventListener("click", searchParents);
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);
  if (limitSelect) limitSelect.addEventListener("change", searchParents);

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

  const body = document.getElementById("parentTableBody");
  if (body) {
    const observer = new MutationObserver(function () {
      searchParents();
    });

    observer.observe(body, { childList: true });
  }

  setTimeout(searchParents, 600);
});
