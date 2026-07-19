document.addEventListener("click", function (event) {
  const btn = event.target.closest("button, a");
  if (!btn) return;

  const text = String(btn.textContent || "").trim().toLowerCase();

  if (btn.id !== "printParentAttendanceBtn" && !text.includes("print attendance")) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const table = document.querySelector("table");
  if (!table) {
    alert("No attendance records found to print.");
    return;
  }

  const tableClone = table.cloneNode(true);

  const win = window.open("", "_blank", "width=1000,height=700");

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 25px;
          color: #000;
        }

        .header {
          text-align: center;
          border-bottom: 3px solid #073b70;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .header h1 {
          margin: 0;
          color: #073b70;
          font-size: 26px;
        }

        .header h2 {
          margin: 8px 0 0;
          font-size: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        th, td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
          font-size: 13px;
        }

        th {
          background: #073b70;
          color: white;
        }

        .footer {
          text-align: center;
          margin-top: 35px;
          font-size: 13px;
        }
      </style>
    </head>

    <body>
      <div class="header">
        <h1>Delight International School</h1>
        <h2>Attendance</h2>
      </div>

      ${tableClone.outerHTML}

      <div class="footer">
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

  win.document.close();
}, true);
