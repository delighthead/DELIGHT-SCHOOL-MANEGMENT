document.addEventListener("DOMContentLoaded", function () {
  const announcementList = document.getElementById("teacherAnnouncementList");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }

  async function getLoggedInTeacher() {
    const user = getLoggedInUser();

    if (!user || user.role !== "teacher") {
      throw new Error("Please login as a teacher.");
    }

    const response = await fetch(`http://127.0.0.1:5000/api/teachers/by-user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Teacher record not found.");
    }

    return data.teacher;
  }

  function formatAudience(audience) {
    if (audience === "all") return "Everyone";
    if (audience === "teachers") return "Teachers";
    return audience || "";
  }

  async function loadTeacherAnnouncements() {
    if (!announcementList) return;

    try {
      const teacher = await getLoggedInTeacher();

      const response = await fetch(`http://127.0.0.1:5000/api/announcements?branch_id=${teacher.branch_id}`, {
        headers: getAuthOnlyHeaders()
      });
      const data = await response.json();

      announcementList.innerHTML = "";

      if (!response.ok) {
        announcementList.innerHTML = `<p>${data.message || "Could not load announcements."}</p>`;
        return;
      }

      const announcements = (data.announcements || []).filter(function (announcement) {
        return announcement.audience === "all" || announcement.audience === "teachers";
      });

      if (announcements.length === 0) {
        announcementList.innerHTML = `<p>No teacher announcements found.</p>`;
        return;
      }

      announcements.forEach(function (announcement) {
        const card = document.createElement("div");
        card.className = "dashboard-card";

        card.innerHTML = `
          <h2>${announcement.title || ""}</h2>
          <p>${announcement.message || ""}</p>
          <p><strong>Audience:</strong> ${formatAudience(announcement.audience)}</p>
          <p><strong>Date:</strong> ${announcement.created_at ? announcement.created_at.slice(0, 10) : ""}</p>
        `;

        announcementList.appendChild(card);
      });
    } catch (error) {
      console.error(error);
      announcementList.innerHTML = `<p>${error.message}</p>`;
    }
  }

  loadTeacherAnnouncements();
});
