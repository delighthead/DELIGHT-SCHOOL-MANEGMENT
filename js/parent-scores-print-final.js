document.addEventListener("DOMContentLoaded", function () {
  function addPrintButton() {
    const table = document.querySelector("#parentResultsTableBody")?.closest("table");

    if (!table) return;

    const card =
      table.closest(".card") ||
      table.closest(".dashboard-card") ||
      table.closest(".content-card") ||
      table.parentElement;

    if (!card) return;

    if (document.getElementById("printParentScoresBtn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "printParentScoresBtn";
    btn.className = "small-btn success";
    btn.textContent = "Print Scores";
    btn.style.marginBottom = "15px";

    const heading = card.querySelector("h2, h3");
    if (heading) {
      heading.insertAdjacentElement("afterend", btn);
    } else {
      card.insertBefore(btn, card.firstChild);
    }
  }

  function printScores() {
    const table = document.querySelector("#parentResultsTableBody")?.closest("table");

    if (!table) {
      alert("No scores found to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=750");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scores & Results</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            background: #ffffff;
            color: #000000;
          }

          .print-header {
            text-align: center;
            border-bottom: 3px solid #073b70;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .print-header h1 {
            color: #073b70;
            margin: 0;
            font-size: 26px;
          }

          .print-header p {
            margin: 6px 0;
            font-size: 16px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th, td {
            border: 1px solid #333;
            padding: 9px;
            text-align: left;
            font-size: 13px;
          }

          th {
            background: #073b70;
            color: #ffffff;
          }

          .print-footer {
            text-align: center;
            margin-top: 35px;
            font-size: 13px;
          }

          @media print {
            button {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Delight International School</h1>
          <p><strong>Scores & Results</strong></p>
        </div>

        ${table.outerHTML}

        <div class="print-footer">
          Printed from Delight School Management System
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest("#printParentScoresBtn");
    if (!btn) return;

    event.preventDefault();
    printScores();
  });

  addPrintButton();
  setTimeout(addPrintButton, 1000);
  setTimeout(addPrintButton, 2500);
});
