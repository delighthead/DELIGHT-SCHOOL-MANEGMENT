document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const tableBody = document.getElementById("activityTableBody");
  const limitSelect = document.getElementById("activityLimitSelect");
  const countText = document.getElementById("activityCountText");

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

  function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function isBranchAdmin() {
    return String(getUser().role || "").toLowerCase() === "branch_admin";
  }

  function canEditActivities() {
    const role = String(getUser().role || "").toLowerCase();
    return ["super_admin", "admin", "branch_admin", "teacher_admin"].includes(role);
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function pickArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.activities)) return data.activities;
    if (Array.isArray(data.logs)) return data.logs;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  function formatDate(value) {
    if (!value) return "";

    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return String(value);
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function updateActivity(activityId, payload) {
    const res = await fetch(`${API}/api/activities/${activityId}`, {
      method: "PUT",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update activity");
    }

    return data;
  }

  async function loadActivities() {
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7">Loading activities...</td></tr>`;

    try {
      let url = `${API}/api/activities`;

      if (isBranchAdmin() && getBranchId()) {
        url += `?branch_id=${encodeURIComponent(getBranchId())}`;
      }

      const res = await fetch(url, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load activities.");
      }

      let activities = pickArray(data);

      const limit = Number(limitSelect ? limitSelect.value : 5);
      if (limit > 0) {
        activities = activities.slice(0, limit);
      }

      if (countText) {
        countText.textContent = `${activities.length} activity record(s) shown`;
      }

      if (activities.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">No recent activities found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = "";

      activities.forEach(activity => {
        const row = document.createElement("tr");
        const encodedActivity = encodeURIComponent(JSON.stringify(activity));
        const showEdit = canEditActivities();

        row.innerHTML = `
          <td>${escapeHtml(formatDate(activity.created_at))}</td>
          <td>${escapeHtml(activity.branch_name || "")}</td>
          <td>${escapeHtml(activity.user_name || activity.full_name || activity.username || "")}</td>
          <td>${escapeHtml(activity.module || "")}</td>
          <td>${escapeHtml(activity.action || "")}</td>
          <td>${escapeHtml(activity.description || "")}</td>
          <td>
            ${showEdit ? `<button type="button" class="small-btn edit-activity-btn" data-record="${encodedActivity}">Edit</button>` : ""}
          </td>
        `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Activities load error:", error);
      tableBody.innerHTML = `<tr><td colspan="7">${error.message || "Cannot connect to backend."}</td></tr>`;
    }
  }

  document.addEventListener("click", async function (event) {
    const editBtn = event.target.closest(".edit-activity-btn");
    if (!editBtn) return;

    let record = null;

    try {
      record = JSON.parse(decodeURIComponent(editBtn.dataset.record || ""));
    } catch (error) {
      alert("Could not read activity record");
      return;
    }

    const newModule = prompt("Edit module", record.module || "");
    if (newModule === null) return;

    const newAction = prompt("Edit action", record.action || "");
    if (newAction === null) return;

    const newDescription = prompt("Edit description", record.description || "");
    if (newDescription === null) return;

    try {
      await updateActivity(record.id, {
        module: newModule,
        action: newAction,
        description: newDescription
      });

      alert("Activity updated successfully");
      loadActivities();
    } catch (error) {
      alert(error.message || "Failed to update activity");
    }
  });

  if (limitSelect) {
    limitSelect.addEventListener("change", loadActivities);
  }

  loadActivities();
});
