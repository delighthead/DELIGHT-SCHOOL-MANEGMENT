document.addEventListener("click", function (event) {
  const btn = event.target.closest("button, a");
  if (!btn) return;

  const text = btn.textContent.trim().toLowerCase();

  if (
    text !== "print" &&
    text !== "print report" &&
    !text.includes("print")
  ) {
    return;
  }

  const pageText = document.body.innerText.toLowerCase();

  // Only work on parent report pages
  if (!pageText.includes("report")) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  let reportArea =
    btn.closest(".report-card") ||
    btn.closest(".dashboard-card") ||
    btn.closest(".card") ||
    btn.closest(".content-card") ||
    document.querySelector("#reportArea") ||
    document.querySelector(".report-area") ||
    document.querySelector("main") ||
    document.querySelector(".main-content");

  if (!reportArea) {
    alert("No report found to print.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=950,height=700");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Child Report</title>
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
          font-size: 14px;
        }

        th {
          background: #073b70;
          color: #ffffff;
        }

        h1, h2, h3 {
          color: #073b70;
        }

        button,
        .btn,
        .small-btn,
        .print-btn,
        nav,
        aside,
        .sidebar {
          display: none !important;
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
        <p><strong>Child Report</strong></p>
      </div>

      ${reportArea.innerHTML}

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
