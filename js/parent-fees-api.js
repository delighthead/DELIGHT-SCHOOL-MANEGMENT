document.addEventListener("DOMContentLoaded", function () {
  const childrenSelector =
    document.getElementById("feesChildrenSelector");

  const feesTableBody =
    document.getElementById("parentFeesTableBody");

  const feesCountText =
    document.getElementById("parentFeesCountText");

  const recordsHeading =
    document.getElementById("feesRecordsHeading");

  const totalPayableBox =
    document.getElementById("feesTotalPayable");

  const totalPaidBox =
    document.getElementById("feesTotalPaid");

  const totalBalanceBox =
    document.getElementById("feesTotalBalance");

  const paymentStatusBox =
    document.getElementById("feesPaymentStatus");

  const printFeesStatementBtn =
    document.getElementById("printFeesStatementBtn");

  let children = [];
  let fees = [];
  let selectedChildId = null;

  function headers() {
    const token = localStorage.getItem("token");

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function money(value) {
    return `GHS ${number(value).toFixed(2)}`;
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function formatStatus(status) {
    const normalized =
      String(status || "")
        .trim()
        .toLowerCase();

    if (normalized === "paid") return "Paid";

    if (
      normalized === "part_payment" ||
      normalized === "part payment" ||
      normalized === "partial"
    ) {
      return "Part Payment";
    }

    if (normalized === "unpaid") return "Unpaid";

    return status || "";
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: headers()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load fee information."
      );
    }

    return data;
  }

  function getSelectedChild() {
    return children.find(
      child => Number(child.id) === Number(selectedChildId)
    ) || children[0] || null;
  }

  function selectedFees() {
    return fees.filter(fee => {
      const belongsToSelectedChild =
        Number(fee.student_id) ===
        Number(selectedChildId);

      /*
       * Because the backend uses LEFT JOIN fees, a child with no fee
       * record can still produce one row containing only student data
       * and NULL fee fields. Do not treat that as a real fee record.
       */
      const hasRealFeeRecord =
        fee.term != null ||
        fee.academic_year != null ||
        fee.amount_payable != null ||
        fee.amount_paid != null ||
        fee.balance != null ||
        fee.payment_status != null ||
        fee.payment_date != null;

      return belongsToSelectedChild && hasRealFeeRecord;
    });
  }

  function renderChildren() {
    if (!childrenSelector) return;

    if (!children.length) {
      childrenSelector.innerHTML =
        "<p>No active children found.</p>";
      return;
    }

    childrenSelector.innerHTML = children
      .map(child => {
        const active =
          Number(child.id) === Number(selectedChildId)
            ? " active"
            : "";

        return `
          <button
            type="button"
            class="fees-child-card${active}"
            data-child-id="${safe(child.id)}"
          >
            <strong>
              ${safe(child.full_name || "Student")}
            </strong>

            <span>
              ${safe(child.class_name || "Class not assigned")}
            </span>

            <span>
              ${safe(child.branch_name || "Branch not assigned")}
            </span>
          </button>
        `;
      })
      .join("");

    childrenSelector
      .querySelectorAll(".fees-child-card")
      .forEach(button => {
        button.addEventListener("click", function () {
          selectedChildId = this.dataset.childId;

          renderChildren();
          renderFees();
        });
      });
  }

  function getOverallPaymentStatus(records) {
    if (!records.length) return "--";

    const balance = records.reduce(
      (sum, fee) => sum + number(fee.balance),
      0
    );

    const payable = records.reduce(
      (sum, fee) => sum + number(fee.amount_payable),
      0
    );

    const paid = records.reduce(
      (sum, fee) => sum + number(fee.amount_paid),
      0
    );

    if (balance <= 0 && payable > 0) {
      return "Paid";
    }

    if (paid > 0 && balance > 0) {
      return "Part Payment";
    }

    if (balance > 0) {
      return "Unpaid";
    }

    return formatStatus(
      records[0].payment_status
    ) || "--";
  }

  function renderSummary(records) {
    if (!records.length) {
      totalPayableBox.textContent = "--";
      totalPaidBox.textContent = "--";
      totalBalanceBox.textContent = "--";
      paymentStatusBox.textContent = "--";
      return;
    }

    const totalPayable = records.reduce(
      (sum, fee) =>
        sum + number(fee.amount_payable),
      0
    );

    const totalPaid = records.reduce(
      (sum, fee) =>
        sum + number(fee.amount_paid),
      0
    );

    const totalBalance = records.reduce(
      (sum, fee) =>
        sum + number(fee.balance),
      0
    );

    totalPayableBox.textContent =
      money(totalPayable);

    totalPaidBox.textContent =
      money(totalPaid);

    totalBalanceBox.textContent =
      money(totalBalance);

    paymentStatusBox.textContent =
      getOverallPaymentStatus(records);
  }

  function renderFees() {
    const child = getSelectedChild();

    if (!child) {
      renderSummary([]);

      recordsHeading.textContent = "Fee Records";
      feesCountText.textContent = "";

      feesTableBody.innerHTML = `
        <tr>
          <td colspan="8">
            No active child is linked to this account.
          </td>
        </tr>
      `;

      return;
    }

    const records = selectedFees();

    recordsHeading.textContent =
      `${child.full_name || "Student"} - Fees`;

    feesCountText.textContent =
      records.length
        ? `Showing ${records.length} fee record(s)`
        : "No fee records available yet.";

    renderSummary(records);

    if (!records.length) {
      feesTableBody.innerHTML = `
        <tr>
          <td colspan="8">
            No fee records found for
            ${safe(child.full_name || "this child")}.
          </td>
        </tr>
      `;

      return;
    }

    feesTableBody.innerHTML = records
      .map(fee => `
        <tr>
          <td>
            ${safe(fee.term || "")}
          </td>

          <td>
            ${safe(fee.academic_year || "")}
          </td>

          <td>
            ${money(fee.amount_payable)}
          </td>

          <td>
            ${money(fee.amount_paid)}
          </td>

          <td>
            ${money(fee.balance)}
          </td>

          <td>
            <span class="fee-status">
              ${safe(formatStatus(fee.payment_status))}
            </span>
          </td>

          <td>
            ${safe(formatDate(fee.payment_date))}
          </td>

          <td class="parent-fees-action-cell">
            <button
              type="button"
              class="small-btn success parent-print-fee-btn"
            >
              Print
            </button>
          </td>
        </tr>
      `)
      .join("");
  }

  function printFeesStatement() {
    const child = getSelectedChild();
    const records = selectedFees();

    if (!child || !records.length) {
      alert("No fees statement available to print.");
      return;
    }

    const totalPayable = records.reduce(
      (sum, fee) =>
        sum + number(fee.amount_payable),
      0
    );

    const totalPaid = records.reduce(
      (sum, fee) =>
        sum + number(fee.amount_paid),
      0
    );

    const totalBalance = records.reduce(
      (sum, fee) =>
        sum + number(fee.balance),
      0
    );

    const rows = records
      .map(fee => `
        <tr>
          <td>${safe(fee.term || "")}</td>
          <td>${safe(fee.academic_year || "")}</td>
          <td>${money(fee.amount_payable)}</td>
          <td>${money(fee.amount_paid)}</td>
          <td>${money(fee.balance)}</td>
          <td>${safe(formatStatus(fee.payment_status))}</td>
          <td>${safe(formatDate(fee.payment_date))}</td>
        </tr>
      `)
      .join("");

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=700"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the fees statement."
      );
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fees Statement</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 28px;
            color: #111827;
          }

          h1 {
            color: #073b70;
            margin-bottom: 5px;
          }

          h2 {
            margin-top: 6px;
          }

          .summary {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #d1d5db;
          }

          .summary p {
            margin: 6px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
          }

          th,
          td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
            font-size: 13px;
          }

          th {
            background: #073b70;
            color: white;
          }
        </style>
      </head>

      <body>

        <h1>Delight International School</h1>
        <h2>Parent Fees Statement</h2>

        <p>
          <strong>Student:</strong>
          ${safe(child.full_name || "")}
        </p>

        <p>
          <strong>Student ID:</strong>
          ${safe(child.student_id || "")}
        </p>

        <p>
          <strong>Class:</strong>
          ${safe(child.class_name || "")}
        </p>

        <p>
          <strong>Branch:</strong>
          ${safe(child.branch_name || "")}
        </p>

        <div class="summary">
          <p>
            <strong>Total Fees:</strong>
            ${money(totalPayable)}
          </p>

          <p>
            <strong>Amount Paid:</strong>
            ${money(totalPaid)}
          </p>

          <p>
            <strong>Outstanding Balance:</strong>
            ${money(totalBalance)}
          </p>

          <p>
            <strong>Payment Status:</strong>
            ${safe(getOverallPaymentStatus(records))}
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>Academic Year</th>
              <th>Amount Payable</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Payment Date</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        <\/script>

      </body>
      </html>
    `);

    printWindow.document.close();
  }

  async function loadFeesPage() {
    try {
      const [childrenData, feesData] =
        await Promise.all([
          fetchJson("/api/parents/my/children"),
          fetchJson("/api/parents/my/fees")
        ]);

      children = childrenData.children || [];
      fees = feesData.fees || [];

      selectedChildId =
        children.length ? children[0].id : null;

      renderChildren();
      renderFees();

    } catch (error) {
      console.error(
        "Parent fees error:",
        error
      );

      if (childrenSelector) {
        childrenSelector.innerHTML =
          `<p>${safe(error.message)}</p>`;
      }

      if (feesTableBody) {
        feesTableBody.innerHTML = `
          <tr>
            <td colspan="8">
              ${safe(error.message)}
            </td>
          </tr>
        `;
      }

      renderSummary([]);
    }
  }

  if (printFeesStatementBtn) {
    printFeesStatementBtn.addEventListener(
      "click",
      printFeesStatement
    );
  }

  loadFeesPage();
});
