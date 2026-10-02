document.addEventListener("DOMContentLoaded", function () {
  const API = "";
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
          <td>
            <button
              type="button"
              class="small-btn danger final-delete-announcement-btn"
              data-id="${item.id}"
            >
              Delete
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Announcement list load error:", error);
      tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
    }
  }

  tableBody.addEventListener("click", async function (event) {
    const deleteButton = event.target.closest(
      ".final-delete-announcement-btn"
    );

    if (!deleteButton) return;

    const announcementId = deleteButton.dataset.id;

    if (!announcementId) return;

    const confirmed = confirm(
      "Delete this announcement? It will also be removed from the Teacher and Parent announcement pages."
    );

    if (!confirmed) return;

    const originalText = deleteButton.textContent;
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    try {
      const response = await fetch(
        `${API}/api/announcements/${encodeURIComponent(announcementId)}`,
        {
          method: "DELETE",
          headers: headers()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete announcement."
        );
      }

      alert("Announcement deleted successfully.");

      await loadAnnouncementsFinal();
    } catch (error) {
      console.error("Announcement delete error:", error);
      alert(error.message || "Failed to delete announcement.");

      deleteButton.disabled = false;
      deleteButton.textContent = originalText;
    }
  });

  window.loadAnnouncementsFinal = loadAnnouncementsFinal;
  loadAnnouncementsFinal();

  document.addEventListener("submit", function () {
    setTimeout(loadAnnouncementsFinal, 800);
  }, true);
});
