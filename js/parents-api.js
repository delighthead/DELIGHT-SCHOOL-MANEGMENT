document.addEventListener("DOMContentLoaded", function () {
  function getApiBase() {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "";
    }
    return "";
  }

  const API = getApiBase();

  const parentForm = document.getElementById("parentForm");
  const parentTableBody = document.getElementById("parentTableBody");
  const branchSelect = document.getElementById("parent_branch_id");

  let editingParentId = null;

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders(json = false) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
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

  async function fetchJsonWithRetry(url, options, retries) {
    let lastError = null;

    for (let i = 0; i <= retries; i += 1) {
      try {
        const res = await fetch(url, options);
        const raw = await res.text();
        let data = {};

        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (error) {
          data = { message: raw || "Unexpected server response" };
        }

        return { res, data };
      } catch (error) {
        lastError = error;
        if (i < retries) {
          await new Promise(function (resolve) {
            setTimeout(resolve, 300);
          });
        }
      }
    }

    throw lastError || new Error("Network request failed");
  }

  async function loadBranches() {
    if (!branchSelect) return;

    branchSelect.innerHTML = `<option value="">Loading branches...</option>`;

    try {
      const { res, data } = await fetchJsonWithRetry(`${API}/api/branches`, {
        headers: authHeaders()
      }, 2);

      if (!res.ok) {
        throw new Error(data.message || "Failed to load branches");
      }

      const branches = pickArray(data, "branches");

      branchSelect.innerHTML = `<option value="">Select branch</option>`;

      branches.forEach(branch => {
        const option = document.createElement("option");
        option.value = branch.id || branch.branch_id;
        option.textContent = branch.branch_name || branch.name || branch.location || "Branch";
        branchSelect.appendChild(option);
      });

      if (isBranchAdmin()) {
        branchSelect.value = getBranchId();
        branchSelect.disabled = true;
      } else {
        branchSelect.disabled = false;
      }
    } catch (error) {
      console.error("Branches load error:", error);
      branchSelect.innerHTML = `<option value="">${error.message || "Failed to load branches"}</option>`;
    }
  }

  async function loadParents() {
    if (!parentTableBody) return;

    parentTableBody.innerHTML = `<tr><td colspan="8">Loading parents...</td></tr>`;

    try {
      let url = `${API}/api/parents`;

      if (isBranchAdmin() && getBranchId()) {
        url += `?branch_id=${getBranchId()}`;
      }

      const res = await fetch(url, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load parents");
      }

      const parents = pickArray(data, "parents");

      if (parents.length === 0) {
        parentTableBody.innerHTML = `<tr><td colspan="8">No parents found.</td></tr>`;
        return;
      }

      parentTableBody.innerHTML = "";

      parents.forEach(parent => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${parent.branch_name || parent.branch || ""}</td>
          <td>${parent.full_name || parent.parent_name || parent.name || ""}</td>
          <td>${parent.ghana_card_number || parent.ghana_card || ""}</td>
          <td>${parent.phone || ""}</td>
          <td>${parent.email || ""}</td>
          <td>${parent.address || ""}</td>
          <td>${parent.status || "active"}</td>
          <td>
            <button type="button" class="small-btn edit-parent-btn" data-id="${parent.id}">Edit</button>
          </td>
        `;

        parentTableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Parents load error:", error);
      parentTableBody.innerHTML = `<tr><td colspan="8">${error.message}</td></tr>`;
    }
  }

  function getFormData() {
    return {
      branch_id: isBranchAdmin() ? getBranchId() : document.getElementById("parent_branch_id").value,
      full_name: document.getElementById("parent_full_name").value.trim(),
      ghana_card_number: document.getElementById("parent_ghana_card").value.trim(),
      phone: document.getElementById("parent_phone").value.trim(),
      email: document.getElementById("parent_email").value.trim(),
      address: document.getElementById("parent_address").value.trim(),
      status: (document.getElementById("parent_status")?.value || "active").toLowerCase()
    };
  }

  if (parentForm) {
    parentForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const payload = getFormData();

      if (!payload.branch_id) {
        alert("Please select branch.");
        return;
      }

      if (!payload.full_name) {
        alert("Please enter parent full name.");
        return;
      }

      if (!payload.ghana_card_number) {
        alert("Please enter Ghana Card Number.");
        return;
      }

      if (!payload.phone) {
        alert("Please enter phone number.");
        return;
      }

      try {
        const url = editingParentId
          ? `${API}/api/parents/${editingParentId}`
          : `${API}/api/parents`;

        const method = editingParentId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: authHeaders(true),
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to save parent.");
          return;
        }

        alert(data.message || "Parent saved successfully.");

        parentForm.reset();
        editingParentId = null;

        const submitBtn = document.querySelector("#parentForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Add Parent";

        await loadBranches();
        await loadParents();
      } catch (error) {
        console.error("Parent save error:", error);
        alert("Failed to save parent.");
      }
    });
  }

  document.addEventListener("click", function (event) {
    const editBtn = event.target.closest(".edit-parent-btn");

    if (editBtn) {
      const row = editBtn.closest("tr");
      const cells = row.querySelectorAll("td");

      editingParentId = editBtn.dataset.id;

      if (branchSelect && !isBranchAdmin()) {
        const branchName = cells[0].textContent.trim();

        Array.from(branchSelect.options).forEach(option => {
          if (option.textContent.trim() === branchName) {
            branchSelect.value = option.value;
          }
        });
      }

      document.getElementById("parent_full_name").value = cells[1].textContent.trim();
      document.getElementById("parent_ghana_card").value = cells[2].textContent.trim();
      document.getElementById("parent_phone").value = cells[3].textContent.trim();
      document.getElementById("parent_email").value = cells[4].textContent.trim();
      document.getElementById("parent_address").value = cells[5].textContent.trim();

      if (document.getElementById("parent_status")) {
        document.getElementById("parent_status").value =
          (cells[6]?.textContent || "active").trim().toLowerCase();
      }

      const submitBtn = document.querySelector("#parentForm button[type='submit']");
      if (submitBtn) submitBtn.textContent = "Update Parent";

      parentForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.addEventListener("click", async function (event) {
    const statusBtn = event.target.closest(".toggle-parent-status-btn");
    if (!statusBtn) return;

    const newStatus = statusBtn.dataset.status;
    const actionText = newStatus === "active" ? "enable" : "disable";

    const confirmAction = confirm(`Are you sure you want to ${actionText} this parent account?`);

    if (!confirmAction) return;

    try {
      const res = await fetch(`${API}/api/parents/${statusBtn.dataset.id}/status`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update parent status.");
        return;
      }

      alert(data.message || "Parent status updated successfully.");
      await loadParents();
    } catch (error) {
      console.error("Parent status update error:", error);
      alert("Failed to update parent status.");
    }
  });

  async function start() {
    await loadBranches();
    await loadParents();
  }

  start();
});
