(function () {
  const API = "http://127.0.0.1:5000";

  function token() {
    return localStorage.getItem("token") || "";
  }

  function user() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }

  function fullUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return API + path + "?v=" + Date.now();
  }

  function createPhotoCard(picturePath) {
    const overview = Array.from(document.querySelectorAll("section, div")).find(el =>
      (el.textContent || "").includes("Teacher Name") &&
      (el.textContent || "").includes("Teacher ID") &&
      (el.textContent || "").includes("Branch")
    );

    if (!overview) return;

    if (document.getElementById("teacherDashboardPhotoCard")) return;

    const card = document.createElement("div");
    card.id = "teacherDashboardPhotoCard";
    card.className = "summary-card";
    card.style.textAlign = "center";

    card.innerHTML = `
      <h3>Teacher Photo</h3>
      <img id="teacherDashboardPhoto"
           src="${fullUrl(picturePath)}"
           alt="Teacher Photo"
           style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #ffc400;">
    `;

    const firstSummaryCard = overview.querySelector(".summary-card, .stat-card, div");
    if (firstSummaryCard && firstSummaryCard.parentNode) {
      firstSummaryCard.parentNode.insertBefore(card, firstSummaryCard);
    } else {
      overview.appendChild(card);
    }
  }

  async function loadTeacherPhoto() {
    const u = user();
    if (!u.id) return;

    try {
      const res = await fetch(`${API}/api/teachers/by-user/${u.id}`, {
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const data = await res.json();
      const teacher = data.teacher || data;

      if (teacher && teacher.profile_picture) {
        createPhotoCard(teacher.profile_picture);
      }
    } catch (error) {
      console.error("Teacher dashboard photo error:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadTeacherPhoto, 500);
    setTimeout(loadTeacherPhoto, 1500);
  });
})();


