(function () {
  function makePrintPage(button) {
    const row = button.closest("tr");
    const table = button.closest("table");

    if (!row || !table) {
      alert("No report row found.");
      return;
    }

    const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.innerText.trim());
    const values = Array.from(row.querySelectorAll("td")).map(td => td.innerText.trim());

    let rows = "";

    headers.forEach((header, index) => {
      if (!header || header.toLowerCase() === "action") return;

      rows += `
        <tr>
          <th>${header}</th>
          <td>${values[index] || ""}</td>
        </tr>
      `;
    });

    const printWindow = window.open("", "_blank", "width=900,height=700");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title> Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 35px;
            color: #000;
            background: #fff;
          }

          .school-header {
            text-align: center;
            border-bottom: 3px solid #073b70;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .school-header h1 {
            color: #073b70;
            margin: 0;
            font-size: 26px;
          }

          .school-header h2 {
            margin: 8px 0 0 0;
            font-size: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th, td {
            border: 1px solid #222;
            padding: 12px;
            text-align: left;
            font-size: 15px;
          }

          th {
            background: #073b70;
            color: #fff;
            width: 35%;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 13px;
          }

          .print-button {
            margin-top: 25px;
            padding: 10px 20px;
            background: #073b70;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }

          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="school-header">
          <h1>Delight International School</h1>
          <h2> Report</h2>
        </div>

        <table>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          Printed from Delight School Management System
        </div>

        <button class="print-button" onclick="window.print()">Print Report</button>
      </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 600);
  }

  // Capture click before any old print code runs
  document.addEventListener("click", function (event) {
    const button = event.target.closest("button, a");
    if (!button) return;

    const text = button.innerText.trim().toLowerCase();

    if (text === "print") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      makePrintPage(button);
      return false;
    }
  }, true);
})();
