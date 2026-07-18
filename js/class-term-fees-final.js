document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const branchSelect = document.getElementById("class_fee_branch_id");
  const classSelect = document.getElementById("class_fee_class_id");
  const termSelect = document.getElementById("class_fee_term");
  const yearInput = document.getElementById("class_fee_academic_year");
  const amountInput = document.getElementById("class_fee_amount");
  const applyBtn = document.getElementById("applyClassTermFeeBtn");

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function headers(json = false) {
    const h = {};
    if (json) h["Content-Type"] = "application/json";
    if (getToken()) h.Authorization = `Bearer ${getToken()}`;
    return h;
  }

  function isBranchAdmin() {
    return String(getUser().role || "").toLowerCase() === "branch_admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function pickArray(data, key) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadSettings() {
    try {
      const res = await fetch(`${API}/api/settings`);
      const data = await res.json();
      const settings = data.settings || {};

      if (termSelect && !termSelect.value) {
        termSelect.value = settings.current_term || "";
      }

      if (yearInput && !yearInput.value) {
        yearInput.value = settings.academic_year || "";
      }
    } catch (error) {
      console.error("Could not load settings:", error);
    }
  }

  async function loadBranches() {
    if (!branchSelect) return;

    branchSelect.innerHTML = `<option value="">Loading branches...</option>`;

    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: headers()
      });

      const data = await res.json();
      const branches = pickArray(data, "branches");

      branchSelect.innerHTML = `<option value="">Select branch</option>`;

      branches.forEach(branch => {
        const option = document.createElement("option");
        option.value = branch.id || branch.branch_id;
        option.textContent = branch.branch_name || branch.name || branch.location || "Branch";
        branchSelect.appendChild(option);
      });

      if (isBranchAdmin() && getBranchId()) {
        branchSelect.value = getBranchId();
        branchSelect.disabled = true;
      } else {
        branchSelect.disabled = false;
      }
    } catch (error) {
      console.error("Could not load branches:", error);
      branchSelect.innerHTML = `<option value="">Failed to load branches</option>`;
    }
  }

  async function loadClasses() {
    if (!classSelect) return;

    classSelect.innerHTML = `<option value="">Loading classes...</option>`;

    try {
      const res = await fetch(`${API}/api/classes`, {
        headers: headers()
      });

      const data = await res.json();
      const classes = pickArray(data, "classes");

      classSelect.innerHTML = `<option value="">Select class</option>`;

      classes.forEach(cls => {
        const option = document.createElement("option");
        option.value = cls.id || cls.class_id;
        option.textContent = cls.class_name || cls.name || "Class";
        classSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load classes:", error);
      classSelect.innerHTML = `<option value="">Failed to load classes</option>`;
    }
  }

  async function applyClassTermFee() {
    const branchId = branchSelect ? branchSelect.value : "";
    const classId = classSelect ? classSelect.value : "";
    const term = termSelect ? termSelect.value : "";
    const academicYear = yearInput ? yearInput.value.trim() : "";
    const amount = amountInput ? amountInput.value : "";

    if (!branchId || !classId || !term || !academicYear || !amount) {
      alert("Please select branch, class, term, academic year, and enter the fee amount.");
      return;
    }

    const confirmApply = confirm(
      `Apply GHS ${Number(amount).toFixed(2)} as ${term} fees to all active students in this class?\n\nPrevious balances will be added for each student.`
    );

    if (!confirmApply) return;

    applyBtn.disabled = true;
    applyBtn.textContent = "Applying...";

    try {
      const res = await fetch(`${API}/api/fees/apply-class-term`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({
          branch_id: branchId,
          class_id: classId,
          term,
          academic_year: academicYear,
          term_fee: amount
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not apply class term fees.");
      }

      alert(
        `${data.message}\n\nStudents: ${data.total_students}\nCreated: ${data.created}\nUpdated: ${data.updated}`
      );

      location.reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = "Apply Fees to Class";
    }
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", applyClassTermFee);
  }

  loadSettings();
  loadBranches();
  loadClasses();
});
