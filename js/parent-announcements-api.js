document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";
  const announcementBox = document.getElementById("parentAnnouncementsBox");

  if (!announcementBox) return;

  function token() {
    return localStorage.getItem("token") || "";
  }

  function headers() {
    return token() ? { Authorization: `Bearer ${token()}` } : {};
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
        announcementBox.innerHTML = `<p>${data.message || "Could not load announcements."}</p>`;
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
              <h3>${announcement.title || "Announcement"}</h3>
              <span>${formatDate(announcement.created_at || announcement.date)}</span>
            </div>

            <p>${announcement.message || ""}</p>
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
