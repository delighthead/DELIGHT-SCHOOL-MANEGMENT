document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("branchCreateForm");
  const messageEl = document.getElementById("branchCreateMessage");
  const listBody = document.getElementById("branchListBody");
  const createBtn = document.getElementById("createBranchBtn");
  const cancelEditBtn = document.getElementById("cancelBranchEditBtn");
  const editIdInput = document.getElementById("branch_edit_id");

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function setMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.style.color = isError ? "#b42318" : "#067647";
  }

  function renderBranches(branches) {
    if (!listBody) return;

    if (!branches || branches.length === 0) {
      listBody.innerHTML = "<tr><td colspan=\"6\">No branches found.</td></tr>";
      return;
    }

    listBody.innerHTML = "";

    branches.forEach(function (branch) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${branch.branch_name || ""}</td>
        <td>${branch.location || ""}</td>
        <td>${branch.phone || ""}</td>
        <td>${branch.email || ""}</td>
        <td>${branch.status || ""}</td>
        <td><button type="button" class="small-btn success branch-edit-btn" data-id="${branch.id}">Edit</button></td>
      `;
      listBody.appendChild(row);
    });
  }

  function clearFormMode() {
    if (editIdInput) {
      editIdInput.value = "";
    }

    if (createBtn) {
      createBtn.textContent = "Create Branch";
    }

    if (cancelEditBtn) {
      cancelEditBtn.style.display = "none";
    }
  }

  function setEditMode(branch) {
    if (!branch) return;

    document.getElementById("branch_name").value = branch.branch_name || "";
    document.getElementById("branch_location").value = branch.location || "";
    document.getElementById("branch_phone").value = branch.phone || "";
    document.getElementById("branch_email").value = branch.email || "";
    document.getElementById("branch_address").value = branch.address || "";
    document.getElementById("branch_status").value = branch.status || "active";

    if (editIdInput) {
      editIdInput.value = String(branch.id);
    }

    if (createBtn) {
      createBtn.textContent = "Update Branch";
    }

    if (cancelEditBtn) {
      cancelEditBtn.style.display = "inline-block";
    }

    setMessage(`Editing branch: ${branch.branch_name}`, false);
  }

  async function loadBranches() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/branches?include_inactive=true", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        renderBranches([]);
        setMessage(data.message || "Could not load branches", true);
        return;
      }

      renderBranches(data.branches || []);
    } catch (error) {
      renderBranches([]);
      setMessage("Cannot connect to backend", true);
    }
  }

  async function saveBranch(event) {
    event.preventDefault();

    const user = getLoggedInUser();
    if (!user || user.role !== "super_admin") {
      setMessage("Only super admin can create branches.", true);
      return;
    }

    const payload = {
      branch_name: document.getElementById("branch_name").value.trim(),
      location: document.getElementById("branch_location").value.trim(),
      phone: document.getElementById("branch_phone").value.trim(),
      email: document.getElementById("branch_email").value.trim(),
      address: document.getElementById("branch_address").value.trim(),
      status: document.getElementById("branch_status").value
    };

    if (!payload.branch_name) {
      setMessage("Branch name is required.", true);
      return;
    }

    const isEditMode = Boolean(editIdInput && editIdInput.value);
    const branchId = isEditMode ? editIdInput.value : null;

    createBtn.disabled = true;
    createBtn.textContent = isEditMode ? "Updating..." : "Creating...";

    try {
      const response = await fetch(
        isEditMode
          ? `http://127.0.0.1:5000/api/branches/${branchId}`
          : "http://127.0.0.1:5000/api/branches",
        {
        method: isEditMode ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create branch", true);
        return;
      }

      setMessage(isEditMode ? "Branch updated successfully." : "Branch created successfully.", false);
      form.reset();
      clearFormMode();
      await loadBranches();
    } catch (error) {
      setMessage("Cannot connect to backend.", true);
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = editIdInput && editIdInput.value ? "Update Branch" : "Create Branch";
    }
  }

  if (listBody) {
    listBody.addEventListener("click", async function (event) {
      const editBtn = event.target.closest(".branch-edit-btn");
      if (!editBtn) return;

      const id = Number(editBtn.dataset.id || 0);
      if (!id) return;

      try {
        const response = await fetch("http://127.0.0.1:5000/api/branches?include_inactive=true", {
          headers: getAuthOnlyHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || "Could not load branch details", true);
          return;
        }

        const branch = (data.branches || []).find(function (item) {
          return Number(item.id) === id;
        });

        if (!branch) {
          setMessage("Selected branch was not found.", true);
          return;
        }

        setEditMode(branch);
      } catch (error) {
        setMessage("Cannot connect to backend.", true);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", saveBranch);
  }

  if (cancelEditBtn && form) {
    cancelEditBtn.addEventListener("click", function () {
      form.reset();
      clearFormMode();
      setMessage("", false);
    });
  }

  clearFormMode();
  loadBranches();
});
