document.addEventListener("DOMContentLoaded", function () {
  const feesTableBody = document.getElementById("parentFeesTableBody");
  const feesCountText = document.getElementById("parentFeesCountText");
  const printFeesStatementBtn = document.getElementById("printFeesStatementBtn");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function money(value) {
    return Number(value || 0).toFixed(2);
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function formatStatus(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid") return "Paid";
    if (normalized === "part_payment") return "Part Payment";
    if (normalized === "unpaid") return "Unpaid";
    return status || "";
  }

  function safe(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function printFeesStatement() {
    const table = document.querySelector(".data-table");
    if (!table) {
      alert("No fees statement available to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=700");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fees Statement</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { color: #073b70; margin: 0; }
          p { margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #073b70; color: #fff; }
          th:last-child, td:last-child { display: none; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Delight International School</h1>
        <p><strong>Parent Fees Statement</strong></p>
        ${table.outerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(function () {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }

  async function loadParentFees() {
    if (!feesTableBody) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/fees", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      feesTableBody.innerHTML = "";

      if (!response.ok) {
        feesTableBody.innerHTML = `
          <tr>
            <td colspan="11">${data.message || "Could not load fees."}</td>
          </tr>
        `;
        if (feesCountText) feesCountText.textContent = "";
        return;
      }

      const fees = data.fees || [];

      if (feesCountText) {
        feesCountText.textContent = `Showing ${fees.length} fee record(s)`;
      }

      if (fees.length === 0) {
        feesTableBody.innerHTML = `
          <tr>
            <td colspan="11">No fee records found for active children.</td>
          </tr>
        `;
        return;
      }

      fees.forEach(function (fee) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${safe(fee.student_name)}</td>
          <td>${safe(fee.admission_number)}</td>
          <td>${safe(fee.class_name)}</td>
          <td>${safe(fee.term)}</td>
          <td>${safe(fee.academic_year)}</td>
          <td>${money(fee.amount_payable)}</td>
          <td>${money(fee.amount_paid)}</td>
          <td>${money(fee.balance)}</td>
          <td>${safe(formatStatus(fee.payment_status))}</td>
          <td>${safe(formatDate(fee.payment_date))}</td>
          <td class="parent-fees-action-cell"><button type="button" class="small-btn success parent-print-fee-btn">Print</button></td>
        `;

        feesTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      feesTableBody.innerHTML = `
        <tr>
          <td colspan="11">Cannot connect to backend.</td>
        </tr>
      `;
      if (feesCountText) feesCountText.textContent = "";
    }
  }

  if (printFeesStatementBtn) {
    printFeesStatementBtn.addEventListener("click", printFeesStatement);
  }

  loadParentFees();
});
