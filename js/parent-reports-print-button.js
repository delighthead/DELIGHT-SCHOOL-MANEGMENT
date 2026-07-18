document.addEventListener("DOMContentLoaded", function () {
  function addPrintButtons() {
    const tableBody = document.getElementById("parentReportsTableBody");
    if (!tableBody) return;

    tableBody.querySelectorAll("tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;

      let lastCell = cells[cells.length - 1];

      if (lastCell.textContent.trim().toLowerCase().includes("no report")) return;

      if (!row.querySelector(".parent-print-report-btn")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "small-btn success parent-print-report-btn";
        btn.textContent = "Print";

        lastCell.appendChild(document.createElement("br"));
        lastCell.appendChild(btn);
      }
    });
  }

  addPrintButtons();
  setTimeout(addPrintButtons, 1000);
  setTimeout(addPrintButtons, 2500);
  setInterval(addPrintButtons, 3000);
});
