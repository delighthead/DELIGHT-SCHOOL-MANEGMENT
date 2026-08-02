document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".dashboard-section");

  function inferLabel(section) {
    const heading = section.querySelector("h2");
    if (!heading) return "";

    const firstWord = (heading.textContent || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)[0];

    return firstWord || "";
  }

  function createControlRow(section, table, tbody) {
    if (!table || !tbody) return null;

    // Skip sections that already have a page-specific list/view control.
    if (section.querySelector("#activityLimitSelect, [data-list-view-select], .list-view-controls")) {
      return null;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "list-view-controls";

    const countText = document.createElement("p");
    countText.className = "list-count-text";
    countText.textContent = "0 record(s) shown";

    const label = document.createElement("label");
    label.textContent = "View:";

    const select = document.createElement("select");
    select.setAttribute("data-list-view-select", "true");
    select.innerHTML = `
      <option value="5">Latest 5</option>
      <option value="10">Latest 10</option>
      <option value="20">Latest 20</option>
      <option value="all">All</option>
    `;

    wrapper.appendChild(countText);
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    section.insertBefore(wrapper, table);

    const labelWord = inferLabel(section);

    function getDataRows() {
      return Array.from(tbody.querySelectorAll("tr")).filter((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length === 0) return false;

        // Ignore single-cell placeholder rows like loading/empty/error messages.
        if (cells.length === 1 && (cells[0].colSpan || 0) > 1) return false;

        return true;
      });
    }

    function render() {
      const rows = getDataRows();
      const selected = select.value;
      const limit = selected === "all" ? rows.length : Number(selected);
      const safeLimit = Number.isFinite(limit) ? limit : rows.length;

      rows.forEach((row, index) => {
        row.style.display = index < safeLimit ? "" : "none";
      });

      const shown = Math.min(safeLimit, rows.length);
      if (labelWord) {
        countText.textContent = `${shown} ${labelWord} record(s) shown`;
      } else {
        countText.textContent = `${shown} record(s) shown`;
      }
    }

    select.addEventListener("change", render);

    const observer = new MutationObserver(render);
    observer.observe(tbody, {
      childList: true,
      subtree: true,
      characterData: true
    });

    render();
    return { render };
  }

  sections.forEach((section) => {
    const table = section.querySelector("table.data-table");
    const tbody = table ? table.querySelector("tbody") : null;
    if (!table || !tbody) return;

    createControlRow(section, table, tbody);
  });
});
