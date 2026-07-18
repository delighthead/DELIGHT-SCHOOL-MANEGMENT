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

  function imageUrl(path) {
    if (!path) return "../images/default-user.png";
    if (path.startsWith("http")) return path;
    return API + path + "?v=" + Date.now();
  }

  function findProfileSummarySection() {
    const headings = Array.from(document.querySelectorAll("h2, h3"));

    const heading = headings.find(h =>
      (h.textContent || "").trim().toLowerCase() === "profile summary"
    );

    if (!heading) return null;

    return heading.closest("section, .dashboard-card, .card, div");
  }

  async function loadTeacher() {
    const u = user();

    if (!u.id) {
      window.location.href = "../pages/login.html";
      return null;
    }

    const res = await fetch(`${API}/api/teachers/by-user/${u.id}`, {
      headers: {
        Authorization: `Bearer ${token()}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load teacher profile");
    }

    const teacher = data.teacher || data;

    if (teacher && teacher.id) {
      localStorage.setItem("teacher_db_id", teacher.id);
    }

    return teacher;
  }

  function rebuildSummary(teacher) {
    const section = findProfileSummarySection();
    if (!section || !teacher) return;

    section.innerHTML = `
      <h2>Profile Summary</h2>

      <div class="teacher-profile-summary-grid" style="
        display:grid;
        grid-template-columns: 140px repeat(3, minmax(180px, 1fr));
        gap:20px;
        align-items:stretch;
        margin-top:20px;
      ">
        <div style="
          width:120px;
          height:120px;
          border-radius:50%;
          overflow:hidden;
          background:#073b70;
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <img
            src="${imageUrl(teacher.profile_picture)}"
            alt="Teacher Photo"
            style="width:100%; height:100%; object-fit:cover; border-radius:50%;"
          >
        </div>

        <div class="summary-card">
          <h3>Full Name</h3>
          <p>${teacher.full_name || getSavedTeacherName() || ""}</p>
        </div>

        <div class="summary-card">
          <h3>Teacher ID</h3>
          <p>${teacher.teacher_id || ""}</p>
        </div>

        <div class="summary-card">
          <h3>Ghana Card</h3>
          <p>${teacher.ghana_card_number || ""}</p>
        </div>

        <div class="summary-card">
          <h3>Phone</h3>
          <p>${teacher.phone || ""}</p>
        </div>

        <div class="summary-card">
          <h3>Email</h3>
          <p>${teacher.email || ""}</p>
        </div>

        <div class="summary-card">
          <h3></h3>
          <p>${teacher.branch_name || ""}</p>
        </div>

        <div class="summary-card">
          <h3>Status</h3>
          <p>${teacher.status || ""}</p>
        </div>
      </div>
    `;
  }

  async function start() {
    try {
      const teacher = await loadTeacher();
      rebuildSummary(teacher);
    } catch (error) {
      console.error("Teacher profile summary rebuild error:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {

  function getSavedTeacherName() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return (
        user.full_name ||
        user.name ||
        user.teacher_name ||
        user.username ||
        localStorage.getItem("teacher_profile_full_name") ||
        ""
      );
    } catch (e) {
      return localStorage.getItem("teacher_profile_full_name") || "";
    }
  }

    setTimeout(start, 300);
    setTimeout(start, 1000);
  });
})();


