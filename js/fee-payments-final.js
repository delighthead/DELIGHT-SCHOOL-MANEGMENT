document.addEventListener("DOMContentLoaded", function () {
  function getToken() {
    return localStorage.getItem("token");
  }

  function money(value) {
    return `GHS ${Number(value || 0).toFixed(2)}`;
  }

  function getFeeFromButton(button) {
    const sourceBtn =
      button.closest("td")?.querySelector(".print-fee-receipt-btn") ||
      button.closest("td")?.querySelector(".edit-fee-btn");

    if (!sourceBtn || !sourceBtn.dataset.fee) return null;

    return JSON.parse(decodeURIComponent(sourceBtn.dataset.fee));
  }

  async function fetchPayments(feeId) {
    const res = await fetch(`/api/fees/${feeId}/payments`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Could not load payment history.");
    }

    return data;
  }

  function addFeePayment(fee) {
    const existingModal = document.getElementById("feePaymentModal");
    if (existingModal) existingModal.remove();

    const payable = Number(fee.amount_payable || 0);
    const paid = Number(fee.amount_paid || 0);
    const balance = Math.max(0, Number(fee.balance ?? (payable - paid)));

    const today = new Date().toISOString().slice(0, 10);

    const modal = document.createElement("div");
    modal.id = "feePaymentModal";

    modal.innerHTML = `
      <style>
        #feePaymentModal {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.62);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }

        #feePaymentModal .payment-modal-card {
          width: min(900px, 100%);
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.25);
          overflow: hidden;
          animation: feePaymentOpen 0.18s ease-out;
        }

        @keyframes feePaymentOpen {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        #feePaymentModal .payment-modal-header {
          background: #073d73;
          color: white;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        #feePaymentModal .payment-modal-header h2 {
          margin: 0;
          color: white;
          font-size: 21px;
        }

        #feePaymentModal .payment-modal-close {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.16);
          color: white;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        #feePaymentModal .payment-modal-body {
          padding: 22px;
        }

        #feePaymentModal .payment-student-title {
          margin: 0 0 12px;
          color: #073d73;
          font-size: 16px;
          font-weight: 700;
        }

        #feePaymentModal .payment-info-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        #feePaymentModal .payment-info-box {
          border: 1px solid #d7e0ea;
          background: #f8fafc;
          border-radius: 10px;
          padding: 13px 14px;
          min-height: 72px;
        }

        #feePaymentModal .payment-info-box span {
          display: block;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        #feePaymentModal .payment-info-box strong {
          color: #172033;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        #feePaymentModal .payment-info-box.balance-box {
          border-color: #f0c36d;
          background: #fff9e8;
        }

        #feePaymentModal .payment-info-box.balance-box strong {
          color: #9a6700;
          font-size: 17px;
        }

        #feePaymentModal .payment-entry-section {
          margin-top: 22px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }

        #feePaymentModal .payment-entry-section h3 {
          margin: 0 0 14px;
          color: #073d73;
          font-size: 16px;
        }

        #feePaymentModal .payment-entry-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        #feePaymentModal .payment-field label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        #feePaymentModal .payment-field input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 13px;
          font-size: 15px;
          outline: none;
          background: white;
        }

        #feePaymentModal .payment-field input:focus {
          border-color: #073d73;
          box-shadow: 0 0 0 3px rgba(7,61,115,0.10);
        }

        #feePaymentModal .payment-balance-hint {
          margin: 8px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        #feePaymentModal .payment-error {
          display: none;
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 13px;
          font-weight: 600;
        }

        #feePaymentModal .payment-modal-actions {
          margin-top: 22px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        #feePaymentModal .payment-cancel-btn,
        #feePaymentModal .payment-save-btn {
          border: 0;
          border-radius: 8px;
          padding: 11px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        #feePaymentModal .payment-cancel-btn {
          background: #e2e8f0;
          color: #334155;
        }

        #feePaymentModal .payment-save-btn {
          background: #073d73;
          color: white;
          min-width: 145px;
        }

        #feePaymentModal .payment-save-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          #feePaymentModal {
            padding: 10px;
            align-items: flex-start;
          }

          #feePaymentModal .payment-modal-card {
            margin: 15px 0;
          }

          #feePaymentModal .payment-info-grid,
          #feePaymentModal .payment-entry-grid {
            grid-template-columns: 1fr;
          }

          #feePaymentModal .payment-modal-body {
            padding: 16px;
          }

          #feePaymentModal .payment-modal-actions {
            flex-direction: column-reverse;
          }

          #feePaymentModal .payment-cancel-btn,
          #feePaymentModal .payment-save-btn {
            width: 100%;
          }
        }
      </style>

      <div class="payment-modal-card" role="dialog" aria-modal="true" aria-labelledby="feePaymentModalTitle">
        <div class="payment-modal-header">
          <h2 id="feePaymentModalTitle">Add Fee Payment</h2>
          <button type="button" class="payment-modal-close" aria-label="Close">&times;</button>
        </div>

        <div class="payment-modal-body">
          <div class="payment-student-title">Student Fee Details</div>

          <div class="payment-info-grid">
            <div class="payment-info-box">
              <span>Student</span>
              <strong>${fee.student_name || "-"}</strong>
            </div>

            <div class="payment-info-box">
              <span>Admission No.</span>
              <strong>${fee.admission_number || "-"}</strong>
            </div>

            <div class="payment-info-box">
              <span>Class</span>
              <strong>${fee.class_name || "-"}</strong>
            </div>

            <div class="payment-info-box">
              <span>Term</span>
              <strong>${fee.term || "-"}</strong>
            </div>

            <div class="payment-info-box">
              <span>Academic Year</span>
              <strong>${fee.academic_year || "-"}</strong>
            </div>

            <div class="payment-info-box">
              <span>Status</span>
              <strong>${fee.payment_status || "-"}</strong>
            </div>

            <div class="payment-info-box">
              <span>Payable</span>
              <strong>${money(payable)}</strong>
            </div>

            <div class="payment-info-box">
              <span>Paid</span>
              <strong>${money(paid)}</strong>
            </div>

            <div class="payment-info-box balance-box">
              <span>Balance</span>
              <strong>${money(balance)}</strong>
            </div>
          </div>

          <div class="payment-entry-section">
            <h3>Payment Details</h3>

            <div class="payment-entry-grid">
              <div class="payment-field">
                <label for="feePaymentAmount">Payment Amount</label>
                <input
                  type="number"
                  id="feePaymentAmount"
                  min="0.01"
                  max="${balance.toFixed(2)}"
                  step="0.01"
                  placeholder="Enter amount"
                  autocomplete="off"
                >
                <p class="payment-balance-hint">
                  Outstanding balance: ${money(balance)}
                </p>
              </div>

              <div class="payment-field">
                <label for="feePaymentDate">Payment Date</label>
                <input
                  type="date"
                  id="feePaymentDate"
                  value="${today}"
                >
              </div>
            </div>

            <div class="payment-error" id="feePaymentError"></div>
          </div>

          <div class="payment-modal-actions">
            <button type="button" class="payment-cancel-btn">Cancel</button>
            <button type="button" class="payment-save-btn">Save Payment</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const amountInput = modal.querySelector("#feePaymentAmount");
    const dateInput = modal.querySelector("#feePaymentDate");
    const errorBox = modal.querySelector("#feePaymentError");
    const saveBtn = modal.querySelector(".payment-save-btn");

    function closeModal() {
      modal.remove();
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    }

    modal.querySelector(".payment-modal-close").addEventListener("click", closeModal);
    modal.querySelector(".payment-cancel-btn").addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    amountInput.addEventListener("input", function () {
      errorBox.style.display = "none";
    });

    amountInput.focus();

    saveBtn.addEventListener("click", async function () {
      const amount = Number(amountInput.value || 0);
      const paymentDate = dateInput.value;

      errorBox.style.display = "none";

      if (amount <= 0) {
        showError("Please enter a valid payment amount.");
        amountInput.focus();
        return;
      }

      if (balance <= 0) {
        showError("This fee record has no outstanding balance.");
        return;
      }

      if (amount > balance) {
        showError(`Payment cannot exceed the outstanding balance of ${money(balance)}.`);
        amountInput.focus();
        return;
      }

      if (!paymentDate) {
        showError("Payment date is required.");
        dateInput.focus();
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        const res = await fetch(`/api/fees/${fee.id}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            payment_amount: amount,
            payment_date: paymentDate,
            payment_note: ""
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Could not add payment.");
        }

        closeModal();

        alert(
          `Payment added successfully.\nTotal Paid: ${money(data.total_paid)}\nBalance: ${money(data.balance)}\nStatus: ${data.payment_status}`
        );

        location.reload();
      } catch (error) {
        console.error(error);
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Payment";
        showError(error.message);
      }
    });
  }

  async function showPaymentHistory(fee) {
    try {
      const data = await fetchPayments(fee.id);
      const payments = data.payments || [];

      let rows = "";

      const totalPaid = Number(data.total_paid || 0);
      const detailedPaymentsTotal = payments.reduce(
        (sum, payment) => sum + Number(payment.payment_amount || 0),
        0
      );

      const previousPaid = Math.max(
        0,
        totalPaid - detailedPaymentsTotal
      );

      let rowNumber = 1;

      if (previousPaid > 0) {
        rows += `
          <tr>
            <td>${rowNumber++}</td>
            <td>${fee.payment_date ? String(fee.payment_date).slice(0, 10) : "-"}</td>
            <td>${money(previousPaid)}</td>
            <td>Previous payment recorded before detailed payment history</td>
          </tr>
        `;
      }

      payments.forEach((payment) => {
        rows += `
          <tr>
            <td>${rowNumber++}</td>
            <td>${payment.payment_date ? String(payment.payment_date).slice(0, 10) : ""}</td>
            <td>${money(payment.payment_amount)}</td>
            <td>${payment.payment_note || ""}</td>
          </tr>
        `;
      });

      if (!rows) {
        rows = `
          <tr>
            <td colspan="4">No payment history found.</td>
          </tr>
        `;
      }

      const win = window.open("", "_blank");

      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Payment History</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #222;
            }

            h2, h3 {
              color: #073d73;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }

            th {
              background: #073d73;
              color: #fff;
              padding: 10px;
              text-align: left;
            }

            td {
              border-bottom: 1px solid #ddd;
              padding: 10px;
            }

            .summary {
              margin-top: 20px;
              padding: 12px;
              border: 1px solid #ccc;
              background: #f8fafc;
            }

            .print-btn {
              background: #073d73;
              color: white;
              border: none;
              padding: 10px 15px;
              border-radius: 6px;
              cursor: pointer;
              margin-bottom: 15px;
            }

            @media print {
              .print-btn {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Print Payment History</button>

          
          <div style="text-align:center; border-bottom:3px solid #073b70; padding-bottom:12px; margin-bottom:20px;">
            <h1 style="margin:0; color:#073b70; font-size:26px;">Delight International School</h1>
            <p style="margin:5px 0;">Fee Payment History</p>
          </div>

          <p><strong>Student:</strong> ${fee.student_name || ""}</p>
          <p><strong>Admission No.:</strong> ${fee.admission_number || ""}</p>
          <p><strong>Class:</strong> ${fee.class_name || ""}</p>
          <p><strong>Term:</strong> ${fee.term || ""}</p>
          <p><strong>Academic Year:</strong> ${fee.academic_year || ""}</p>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Payment Date</th>
                <th>Amount Paid</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="summary">
            <p><strong>Amount Payable:</strong> ${money(fee.amount_payable)}</p>
            <p><strong>Total Paid:</strong> ${money(data.total_paid)}</p>
            <p><strong>Balance:</strong> ${money(Number(fee.amount_payable || 0) - Number(data.total_paid || 0))}</p>
          </div>
        </body>
        </html>
      `);

      win.document.close();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function printFullReceipt(fee) {
    try {
      const settingsResponse = await fetch("/api/settings");
      const settingsData = await settingsResponse.json();
      const settings = settingsData.settings || {};

      const paymentData = await fetchPayments(fee.id);
      const payments = paymentData.payments || [];
      const totalPaid = Number(paymentData.total_paid || 0);
      const balance = Number(fee.amount_payable || 0) - totalPaid;

      const logo = settings.school_logo
        ? `<img src="${settings.school_logo}" style="width:70px;height:70px;object-fit:contain;">`
        : "";

      let paymentRows = "";

      const detailedPaymentsTotal = payments.reduce(
        (sum, payment) => sum + Number(payment.payment_amount || 0),
        0
      );

      const previousPaid = Math.max(
        0,
        totalPaid - detailedPaymentsTotal
      );

      let rowNumber = 1;

      if (previousPaid > 0) {
        paymentRows += `
          <tr>
            <td>${rowNumber++}</td>
            <td>${fee.payment_date ? String(fee.payment_date).slice(0, 10) : "Previous Payment"}</td>
            <td>${money(previousPaid)}</td>
          </tr>
        `;
      }

      payments.forEach((payment) => {
        paymentRows += `
          <tr>
            <td>${rowNumber++}</td>
            <td>${payment.payment_date ? String(payment.payment_date).slice(0, 10) : ""}</td>
            <td>${money(payment.payment_amount)}</td>
          </tr>
        `;
      });

      if (!paymentRows) {
        paymentRows = `
          <tr>
            <td colspan="3">No payment history found.</td>
          </tr>
        `;
      }

      const win = window.open("", "_blank");

      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Receipt</title>
          <style>
            @page {
              size: A5 portrait;
              margin: 10mm;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #222;
              font-size: 13px;
            }

            .receipt {
              border: 2px solid #111;
              padding: 15px;
              max-width: 520px;
              margin: auto;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #111;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }

            .header h2 {
              margin: 4px 0;
              font-size: 20px;
            }

            .header p {
              margin: 2px 0;
              font-size: 12px;
            }

            .title {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              margin: 10px 0;
              text-decoration: underline;
            }

            .row {
              display: grid;
              grid-template-columns: 130px 1fr;
              gap: 8px;
              margin: 6px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th {
              background: #073d73;
              color: white;
              padding: 6px;
              text-align: left;
            }

            td {
              border-bottom: 1px solid #ddd;
              padding: 6px;
            }

            .amount-box {
              border: 1px solid #333;
              padding: 8px;
              margin-top: 10px;
            }

            .amount-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              margin: 6px 0;
            }

            .print-btn {
              margin-bottom: 10px;
              padding: 8px 14px;
              background: #073d73;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }

            @media print {
              .print-btn {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <button class="print-btn" onclick="window.print()">Print Receipt</button>

          <div class="receipt">
            <div class="header">
              ${logo}
              <h2>${settings.school_name || "Delight International School"}</h2>
              <p>${settings.school_motto || ""}</p>
              <p>${settings.school_address || ""}</p>
              <p>${settings.school_phone || ""}</p>
            </div>

            <div class="title">FEES RECEIPT</div>

            <div class="row"><strong>Receipt No:</strong> FEE-${fee.id || ""}</div>
            <div class="row"><strong>Student:</strong> ${fee.student_name || ""}</div>
            <div class="row"><strong>Admission No:</strong> ${fee.admission_number || ""}</div>
            <div class="row"><strong>Class:</strong> ${fee.class_name || ""}</div>
            <div class="row"><strong>Term:</strong> ${fee.term || ""}</div>
            <div class="row"><strong>Academic Year:</strong> ${fee.academic_year || ""}</div>

            <h3>Payment Dates</h3>

            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${paymentRows}
              </tbody>
            </table>

            <div class="amount-box">
              <div class="amount-row"><strong>Amount Payable:</strong> ${money(fee.amount_payable)}</div>
              <div class="amount-row"><strong>Total Paid:</strong> ${money(totalPaid)}</div>
              <div class="amount-row"><strong>Balance:</strong> ${money(balance)}</div>
              <div class="amount-row"><strong>Status:</strong> ${
                balance <= 0 ? "Paid" : totalPaid > 0 ? "Part Payment" : "Unpaid"
              }</div>
            </div>
          </div>
        </body>
        </html>
      `);

      win.document.close();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  function addPaymentButtons() {
    document.querySelectorAll("#feeTableBody tr").forEach(row => {
      const actionCell = row.querySelector("td:last-child");
      const printBtn = row.querySelector(".print-fee-receipt-btn");

      if (!actionCell || !printBtn) return;
      if (actionCell.querySelector(".add-fee-payment-btn")) return;

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "small-btn add-fee-payment-btn";
      addBtn.textContent = "Add Payment";

      const historyBtn = document.createElement("button");
      historyBtn.type = "button";
      historyBtn.className = "small-btn view-fee-payments-btn";
      historyBtn.textContent = "Payment History";

      actionCell.appendChild(document.createTextNode(" "));
      actionCell.appendChild(addBtn);
      actionCell.appendChild(document.createTextNode(" "));
      actionCell.appendChild(historyBtn);
    });
  }

  document.addEventListener("click", function (event) {
    const addBtn = event.target.closest(".add-fee-payment-btn");
    const historyBtn = event.target.closest(".view-fee-payments-btn");
    const receiptBtn = event.target.closest(".print-fee-receipt-btn");

    if (addBtn) {
      event.preventDefault();
      event.stopPropagation();
      const fee = getFeeFromButton(addBtn);
      if (!fee) return alert("Could not read fee record.");
      addFeePayment(fee);
      return;
    }

    if (historyBtn) {
      event.preventDefault();
      event.stopPropagation();
      const fee = getFeeFromButton(historyBtn);
      if (!fee) return alert("Could not read fee record.");
      showPaymentHistory(fee);
      return;
    }

    if (receiptBtn) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const fee = getFeeFromButton(receiptBtn) || JSON.parse(decodeURIComponent(receiptBtn.dataset.fee));
      printFullReceipt(fee);
      return;
    }
  }, true);

  const observer = new MutationObserver(addPaymentButtons);

  const tableBody = document.getElementById("feeTableBody");
  if (tableBody) {
    observer.observe(tableBody, { childList: true, subtree: true });
    setTimeout(addPaymentButtons, 1000);
  }
});
