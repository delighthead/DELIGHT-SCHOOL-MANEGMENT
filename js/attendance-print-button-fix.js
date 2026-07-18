document.addEventListener("DOMContentLoaded", function () {
  function printAttendanceSheet() {
    const summary = document.querySelector(".attendance-summary, #attendanceSummary, .summary-card");
    const table = document.getElementById("attendanceTableBody")?.closest("table");

    if (!table) {
      alert("No attendance records found to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=700");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Sheet</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
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

          .header p {
            margin: 5px 0;
            font-size: 14px;
          }

          h2 {
            color: #073b70;
            margin-top: 25px;
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
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }

          .line {
            border-top: 1px solid #000;
            width: 250px;
            text-align: center;
            padding-top: 6px;
          }

          @media print {
            button {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Delight International School</h1>
          <p><strong>Attendance Sheet</strong></p>
          <p>Printed from Delight School Management System</p>
        </div>

        <h2>Attendance Summary</h2>
        ${summary ? summary.outerHTML : ""}

        <h2>Attendance Records</h2>
        ${table.outerHTML}

        <div class="footer">
          <div class="line">Teacher Signature</div>
          <div class="line">Head / Admin Signature</div>
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
    const btn = event.target.closest("button, a");
    if (!btn) return;

    const text = (btn.textContent || "").trim().toLowerCase();

    if (text.includes("print attendance sheet")) {
      event.preventDefault();
      event.stopPropagation();
      printAttendanceSheet();
    }
  });
});
