document.addEventListener("DOMContentLoaded", function () {
  const API = "";
  const announcementBox = document.getElementById("parentAnnouncementsBox");

  if (!announcementBox) return;

  function token() {
    return localStorage.getItem("token") || "";
  }

  function headers() {
    return token() ? { Authorization: `Bearer ${token()}` } : {};
  }

  function escapeAnnouncementHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  async function loadParentAnnouncements() {
    announcementBox.innerHTML = `<p>Loading announcements...</p>`;

    try {
      const response = await fetch(`${API}/api/announcements/parent`, {
        headers: headers()
      });

      const data = await response.json();

      if (!response.ok) {
        announcementBox.innerHTML = `<p>${escapeAnnouncementHtml(data.message || "Could not load announcements.")}</p>`;
        return;
      }

      const announcements = data.announcements || data.data || [];

      if (announcements.length === 0) {
        announcementBox.innerHTML = "<p>No parent announcements found.</p>";
        return;
      }

      let html = `<div class="parent-announcement-grid">`;

      announcements.forEach(function (announcement) {
        html += `
          <div class="parent-announcement-card">
            <div class="announcement-card-header">
              <h3>${escapeAnnouncementHtml(announcement.title || "Announcement")}</h3>
              <span>${escapeAnnouncementHtml(formatDate(announcement.created_at || announcement.date))}</span>
            </div>

            <p>${escapeAnnouncementHtml(announcement.message || "")}</p>
          </div>
        `;
      });

      html += `</div>`;

      announcementBox.innerHTML = html;
    } catch (error) {
      console.error(error);
      announcementBox.innerHTML = "<p>Cannot connect to backend.</p>";
    }
  }

  loadParentAnnouncements();
});
