document.addEventListener("click", function (event) {
  const btn = event.target.closest(".parent-print-fee-btn");
  if (!btn) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const row = btn.closest("tr");
  const table = btn.closest("table");

  if (!row || !table) {
    alert("No fees record found to print.");
    return;
  }

  const headers = Array.from(table.querySelectorAll("thead th")).map(th =>
    th.textContent.trim()
  );

  const values = Array.from(row.querySelectorAll("td")).map(td => {
    const clone = td.cloneNode(true);

    clone.querySelectorAll("button, a").forEach(el => el.remove());

    return clone.textContent.trim();
  });

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

  const printWindow = window.open("", "_blank", "width=950,height=700");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Receipt</title>
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
          font-size: 17px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        th, td {
          border: 1px solid #333;
          padding: 10px;
          text-align: left;
          font-size: 14px;
        }

        th {
          background: #073b70;
          color: #ffffff;
          width: 35%;
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
        <p><strong>Fee / Payment Receipt</strong></p>
      </div>

      <table>
        <tbody>
          ${rows}
        </tbody>
      </table>

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

}, true);
