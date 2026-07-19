document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";
  const tableBody = document.getElementById("announcementTableBody");

  function token() {
    return localStorage.getItem("token") || "";
  }

  function user() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function isBranchAdmin() {
    return String(user().role || "").toLowerCase() === "branch_admin";
  }

  function branchId() {
    return user().branch_id || "";
  }

  function headers() {
    return token() ? { Authorization: `Bearer ${token()}` } : {};
  }

  function pickArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.announcements)) return data.announcements;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadAnnouncementsFinal() {
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6">Loading announcements...</td></tr>`;

    try {
      let url = `${API}/api/announcements`;

      if (isBranchAdmin() && branchId()) {
        url += `?branch_id=${encodeURIComponent(branchId())}`;
      }

      const res = await fetch(url, {
        headers: headers()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not load announcements.");
      }

      const announcements = pickArray(data);

      if (announcements.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6">No announcements found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = "";

      announcements.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${item.branch_name || item.branch || ""}</td>
          <td>${item.title || ""}</td>
          <td>${item.message || ""}</td>
          <td>${item.audience || ""}</td>
          <td>${item.created_at ? String(item.created_at).slice(0, 10) : ""}</td>
          <td></td>
        `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Announcement list load error:", error);
      tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
    }
  }

  window.loadAnnouncementsFinal = loadAnnouncementsFinal;
  loadAnnouncementsFinal();

  document.addEventListener("submit", function () {
    setTimeout(loadAnnouncementsFinal, 800);
  }, true);
});
