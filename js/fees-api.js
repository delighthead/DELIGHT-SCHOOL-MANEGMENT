document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const feeTableBody = document.getElementById("feeTableBody");
  const feeForm = document.getElementById("feeForm");
  const branchSelect = document.getElementById("fee_branch_id");
  const studentSelect = document.getElementById("fee_student_id");
  const feeIdInput = document.getElementById("fee_id");
  const termInput = document.getElementById("term") || document.getElementById("fee_term");
  const yearInput = document.getElementById("academic_year") || document.getElementById("fee_academic_year");
  const amountPayableInput = document.getElementById("amount_payable");
  const amountPaidInput = document.getElementById("amount_paid");
  const paymentDateInput = document.getElementById("payment_date");
  const balancePreview = document.getElementById("fee_balance_preview");
  const statusPreview = document.getElementById("fee_status_preview");

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function isBranchAdmin() {
    return String(getUser().role || "").toLowerCase() === "branch_admin";
  }

  function getAdminBranchId() {
    return getUser().branch_id || "";
  }

  function authHeaders(json) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
  }

  function money(value) {
    return Number(value || 0).toFixed(2);
  }

  function safe(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatStatus(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid") return "Paid";
    if (normalized === "part_payment") return "Part Payment";
    if (normalized === "unpaid") return "Unpaid";
    return status || "";
  }

  function computeStatus(payable, paid) {
    const p = Math.max(Number(payable || 0), 0);
    const d = Math.max(Number(paid || 0), 0);
    const balance = Math.max(p - d, 0);

    if (d >= p && p > 0) {
      return { balance, payment_status: "paid" };
    }

    if (d > 0) {
      return { balance, payment_status: "part_payment" };
    }

    return { balance, payment_status: "unpaid" };
  }

  function updatePreview() {
    if (!amountPayableInput || !amountPaidInput) return;

    const calc = computeStatus(amountPayableInput.value, amountPaidInput.value);

    if (balancePreview) {
      balancePreview.value = money(calc.balance);
    }

    if (statusPreview) {
      statusPreview.value = formatStatus(calc.payment_status);
    }
  }

  async function loadBranches() {
    if (!branchSelect) return;

    branchSelect.innerHTML = '<option value="">Loading branches...</option>';

    try {
      const response = await fetch(`${API}/api/branches`, {
        headers: authHeaders(false)
      });

      const data = await response.json();
      const branches = data.branches || [];

      branchSelect.innerHTML = '<option value="">Select branch</option>';

      branches.forEach((branch) => {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.branch_name || "Branch";
        branchSelect.appendChild(option);
      });

      if (isBranchAdmin() && getAdminBranchId()) {
        branchSelect.value = String(getAdminBranchId());
        branchSelect.disabled = true;
      }

      await loadStudents();
    } catch (error) {
      console.error(error);
      branchSelect.innerHTML = '<option value="">Could not load branches</option>';
    }
  }

  async function loadStudents() {
    if (!studentSelect) return;

    try {
      const branchId = isBranchAdmin() ? getAdminBranchId() : (branchSelect ? branchSelect.value : "");
      let url = `${API}/api/students`;

      if (branchId) {
        url += `?branch_id=${encodeURIComponent(branchId)}`;
      }

      const response = await fetch(url, {
        headers: authHeaders(false)
      });

      const data = await response.json();
      const students = data.students || [];

      studentSelect.innerHTML = '<option value="">Select student</option>';

      students.forEach((student) => {
        const option = document.createElement("option");
        option.value = student.id;
        option.textContent = `${student.full_name || ""} - ${student.admission_number || ""} - ${student.class_name || ""}`;
        studentSelect.appendChild(option);
      });
    } catch (error) {
      console.error(error);
      studentSelect.innerHTML = '<option value="">Could not load students</option>';
    }
  }

  async function loadFees() {
    if (!feeTableBody) return;

    feeTableBody.innerHTML = '<tr><td colspan="11">Loading fees...</td></tr>';

    try {
      let url = `${API}/api/fees`;

      if (isBranchAdmin() && getAdminBranchId()) {
        url += `?branch_id=${encodeURIComponent(getAdminBranchId())}`;
      }

      const response = await fetch(url, {
        headers: authHeaders(false)
      });

      const data = await response.json();

      if (!response.ok) {
        feeTableBody.innerHTML = `<tr><td colspan="11">${safe(data.message || "Could not load fee records.")}</td></tr>`;
        return;
      }

      const fees = data.fees || [];

      if (fees.length === 0) {
        feeTableBody.innerHTML = '<tr><td colspan="11">No fees records found.</td></tr>';
        return;
      }

      feeTableBody.innerHTML = "";

      fees.forEach((fee) => {
        const row = document.createElement("tr");
        const encoded = encodeURIComponent(JSON.stringify(fee));

        row.innerHTML = `
          <td>${safe(fee.branch_name)}</td>
          <td>${safe(fee.student_name)}</td>
          <td>${safe(fee.admission_number)}</td>
          <td>${safe(fee.class_name)}</td>
          <td>${safe(fee.term)}</td>
          <td>${safe(fee.academic_year)}</td>
          <td>GHS ${money(fee.amount_payable)}</td>
          <td>GHS ${money(fee.amount_paid)}</td>
          <td>GHS ${money(fee.balance)}</td>
          <td>${formatStatus(fee.payment_status)}</td>
          <td>
            <button type="button" class="small-btn edit-fee-btn" data-fee="${encoded}">Edit</button>
            <button type="button" class="small-btn success print-fee-receipt-btn" data-fee="${encoded}">Print Receipt</button>
          </td>
        `;

        feeTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      feeTableBody.innerHTML = '<tr><td colspan="11">Cannot connect to backend.</td></tr>';
    }
  }

  function fillFormForEdit(fee) {
    if (feeIdInput) feeIdInput.value = fee.id || "";
    if (branchSelect && !branchSelect.disabled) branchSelect.value = fee.branch_id || "";
    if (studentSelect) studentSelect.value = fee.student_id || "";
    if (termInput) termInput.value = fee.term || "";
    if (yearInput) yearInput.value = fee.academic_year || "";
    if (amountPayableInput) amountPayableInput.value = Number(fee.amount_payable || 0);
    if (amountPaidInput) amountPaidInput.value = Number(fee.amount_paid || 0);
    if (paymentDateInput) {
      paymentDateInput.value = fee.payment_date ? String(fee.payment_date).slice(0, 10) : "";
    }

    const submitBtn = feeForm ? feeForm.querySelector("button[type='submit']") : null;
    if (submitBtn) submitBtn.textContent = "Update Fee Record";

    updatePreview();

    if (feeForm) {
      feeForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function printFeeReceipt(fee) {
    try {
      const settingsResponse = await fetch(`${API}/api/settings`);
      const settingsData = await settingsResponse.json();
      const settings = settingsData.settings || {};

      const logo = settings.school_logo
        ? `<img src="${API}${settings.school_logo}" style="width:70px;height:70px;object-fit:contain;">`
        : "";

      const receiptNo = `FEE-${fee.id || Date.now()}`;
      const today = new Date().toLocaleDateString();

      const win = window.open("", "_blank", "width=900,height=700");

      win.document.open();
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; }
            .receipt { border: 2px solid #111; padding: 15px; max-width: 580px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
            .header h2 { margin: 4px 0; }
            .title { text-align: center; font-weight: bold; font-size: 18px; text-decoration: underline; margin: 10px 0; }
            .row { display: grid; grid-template-columns: 150px 1fr; gap: 8px; margin: 6px 0; }
            .amount-box { border: 1px solid #333; padding: 8px; margin-top: 10px; }
            .amount-row { display: grid; grid-template-columns: 1fr 1fr; margin: 6px 0; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 35px; text-align: center; }
            .line { border-top: 1px solid #333; padding-top: 5px; }
            .print-btn { margin-bottom: 10px; padding: 8px 14px; background: #111827; color: white; border: none; border-radius: 5px; cursor: pointer; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Print Receipt</button>
          <div class="receipt">
            <div class="header">
              ${logo}
              <h2>${safe(settings.school_name || "Delight International School")}</h2>
              <p>${safe(settings.school_motto || "")}</p>
              <p>${safe(settings.school_address || "")}</p>
              <p>${safe(settings.school_phone || "")}${settings.school_email ? ` | ${safe(settings.school_email)}` : ""}</p>
            </div>

            <div class="title">OFFICIAL FEE RECEIPT</div>

            <div class="row"><strong>Receipt No.:</strong><span>${safe(receiptNo)}</span></div>
            <div class="row"><strong>Date Printed:</strong><span>${safe(today)}</span></div>
            <div class="row"><strong>Student Name:</strong><span>${safe(fee.student_name)}</span></div>
            <div class="row"><strong>Admission No.:</strong><span>${safe(fee.admission_number)}</span></div>
            <div class="row"><strong>Class:</strong><span>${safe(fee.class_name)}</span></div>
            <div class="row"><strong>Branch:</strong><span>${safe(fee.branch_name)}</span></div>
            <div class="row"><strong>Term:</strong><span>${safe(fee.term)}</span></div>
            <div class="row"><strong>Academic Year:</strong><span>${safe(fee.academic_year)}</span></div>
            <div class="row"><strong>Payment Date:</strong><span>${safe(fee.payment_date ? String(fee.payment_date).slice(0, 10) : "")}</span></div>

            <div class="amount-box">
              <div class="amount-row"><strong>Amount Payable:</strong><span>GHS ${money(fee.amount_payable)}</span></div>
              <div class="amount-row"><strong>Amount Paid:</strong><span>GHS ${money(fee.amount_paid)}</span></div>
              <div class="amount-row"><strong>Balance:</strong><span>GHS ${money(fee.balance)}</span></div>
              <div class="amount-row"><strong>Payment Status:</strong><span>${formatStatus(fee.payment_status)}</span></div>
            </div>

            <div class="signatures">
              <div><div class="line">Received By</div></div>
              <div><div class="line">Parent / Guardian</div></div>
            </div>
          </div>
        </body>
        </html>
      `);
      win.document.close();
    } catch (error) {
      console.error(error);
      alert("Could not print receipt.");
    }
  }

  async function submitFee(event) {
    event.preventDefault();

    if (!branchSelect || !studentSelect || !termInput || !yearInput || !amountPayableInput || !amountPaidInput) {
      alert("Fee form is not complete.");
      return;
    }

    const branch_id = isBranchAdmin() ? getAdminBranchId() : branchSelect.value;
    const student_id = studentSelect.value;
    const term = termInput.value;
    const academic_year = yearInput.value.trim();
    const amount_payable = Number(amountPayableInput.value || 0);
    const amount_paid = Number(amountPaidInput.value || 0);
    const payment_date = paymentDateInput ? paymentDateInput.value : "";

    if (!branch_id || !student_id || !term || !academic_year) {
      alert("Branch, student, term, and academic year are required.");
      return;
    }

    const calc = computeStatus(amount_payable, amount_paid);

    const payload = {
      branch_id,
      student_id,
      term,
      academic_year,
      amount_payable,
      amount_paid,
      payment_date,
      payment_status: calc.payment_status
    };

    const editingId = feeIdInput ? feeIdInput.value : "";
    const url = editingId ? `${API}/api/fees/${editingId}` : `${API}/api/fees`;

    try {
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save fee record.");
      }

      alert(editingId ? "Fee record updated successfully" : "Fee record added successfully");

      if (feeForm) feeForm.reset();
      if (feeIdInput) feeIdInput.value = "";
      if (yearInput && !yearInput.value) yearInput.value = "2025/2026";
      if (branchSelect && isBranchAdmin()) {
        branchSelect.value = String(getAdminBranchId() || "");
      }

      updatePreview();
      await loadStudents();
      await loadFees();

      const submitBtn = feeForm ? feeForm.querySelector("button[type='submit']") : null;
      if (submitBtn) submitBtn.textContent = "Add Fee Record";
    } catch (error) {
      console.error(error);
      alert(error.message || "Cannot connect to backend.");
    }
  }

  if (branchSelect) {
    branchSelect.addEventListener("change", loadStudents);
  }

  if (amountPayableInput) {
    amountPayableInput.addEventListener("input", updatePreview);
  }

  if (amountPaidInput) {
    amountPaidInput.addEventListener("input", updatePreview);
  }

  if (feeForm) {
    feeForm.addEventListener("submit", submitFee);
  }

  if (feeTableBody) {
    feeTableBody.addEventListener("click", function (event) {
      const editBtn = event.target.closest(".edit-fee-btn");
      if (editBtn) {
        try {
          const fee = JSON.parse(decodeURIComponent(editBtn.dataset.fee || ""));
          fillFormForEdit(fee);
        } catch (error) {
          console.error(error);
          alert("Could not open fee record for editing.");
        }
        return;
      }

      const printBtn = event.target.closest(".print-fee-receipt-btn");
      if (printBtn) {
        try {
          const fee = JSON.parse(decodeURIComponent(printBtn.dataset.fee || ""));
          printFeeReceipt(fee);
        } catch (error) {
          console.error(error);
          alert("Could not open fee receipt.");
        }
      }
    });
  }

  (async function init() {
    await loadBranches();
    await loadFees();
    updatePreview();
  })();
});
