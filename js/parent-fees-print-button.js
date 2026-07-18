document.addEventListener("DOMContentLoaded", function () {
  function addPrintButtons() {
    const table = document.querySelector("#parentFeesTableBody")?.closest("table");
    const tableBody = document.getElementById("parentFeesTableBody");

    if (!table || !tableBody) return;

    const headerRow = table.querySelector("thead tr");

    if (headerRow && !headerRow.querySelector(".parent-fees-action-head")) {
      const th = document.createElement("th");
      th.className = "parent-fees-action-head";
      th.textContent = "Action";
      headerRow.appendChild(th);
    }

    tableBody.querySelectorAll("tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;

      if (row.textContent.toLowerCase().includes("no fee")) return;

      if (!row.querySelector(".parent-fees-action-cell")) {
        const actionCell = document.createElement("td");
        actionCell.className = "parent-fees-action-cell";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "small-btn success parent-print-fee-btn";
        btn.textContent = "Print";

        actionCell.appendChild(btn);
        row.appendChild(actionCell);
      }
    });
  }

  addPrintButtons();
  setTimeout(addPrintButtons, 1000);
  setTimeout(addPrintButtons, 2500);
});
