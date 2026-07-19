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

  function findPhotoCircle() {
    const all = Array.from(document.querySelectorAll("*"));

    return all.find(el => {
      const text = (el.textContent || "").trim().toLowerCase();
      const style = window.getComputedStyle(el);
      return (
        text === "teacher photo" &&
        style.borderRadius.includes("50")
      );
    }) || all.find(el => {
      const text = (el.textContent || "").trim().toLowerCase();
      return text === "teacher photo";
    });
  }

  function showPicture(path) {
    const circle = findPhotoCircle();
    if (!circle || !path) return;

    circle.innerHTML = "";

    const img = document.createElement("img");
    img.src = fullUrl(path);
    img.alt = "Teacher Photo";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";
    img.style.display = "block";

    circle.appendChild(img);
  }

  async function loadTeacherPicture() {
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

      if (teacher && teacher.id) {
        localStorage.setItem("teacher_db_id", teacher.id);
      }

      if (teacher && teacher.profile_picture) {
        showPicture(teacher.profile_picture);
      }
    } catch (error) {
      console.error("Teacher profile picture load error:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadTeacherPicture, 300);
    setTimeout(loadTeacherPicture, 1000);
    setTimeout(loadTeacherPicture, 2000);
  });
})();
