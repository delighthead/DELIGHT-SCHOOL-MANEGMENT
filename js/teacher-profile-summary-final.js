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

  function setText(label, value) {
    const cards = Array.from(document.querySelectorAll("*")).filter(el =>
      (el.textContent || "").trim().toLowerCase() === label.toLowerCase()
    );

    cards.forEach(labelEl => {
      const parent = labelEl.parentElement;
      if (!parent) return;

      const p = parent.querySelector("p");
      if (p) p.textContent = value || "";
    });
  }

  function showPicture(path) {
    const photoText = Array.from(document.querySelectorAll("*")).find(el =>
      (el.textContent || "").trim().toLowerCase() === "teacher photo"
    );

    if (!photoText || !path) return;

    photoText.innerHTML = "";

    const img = document.createElement("img");
    img.src = fullUrl(path);
    img.alt = "Teacher Photo";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";

    photoText.appendChild(img);
  }

  async function loadProfile() {
    const u = user();

    if (!u.id) {
      window.location.href = "../pages/login.html";
      return;
    }

    try {
      const res = await fetch(`${API}/api/teachers/by-user/${u.id}`, {
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teacher profile.");
      }

      const teacher = data.teacher || data;

      if (teacher.id) {
        localStorage.setItem("teacher_db_id", teacher.id);
      }

      setText("Full Name", teacher.full_name || getSavedTeacherName());
      setText("Teacher ID", teacher.teacher_id);
      setText("Ghana Card", teacher.ghana_card_number);
      setText("Phone", teacher.phone);
      setText("Email", teacher.email);
      setText("Branch", teacher.branch_name);
      setText("Status", teacher.status);

      if (teacher.profile_picture) {
        showPicture(teacher.profile_picture);
      }

      const badText = Array.from(document.querySelectorAll("*")).find(el =>
        (el.textContent || "").trim() === "Cannot connect to backend."
      );

      if (badText) badText.remove();

    } catch (error) {
      console.error("Teacher profile summary error:", error);
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

    setTimeout(loadProfile, 500);
    setTimeout(loadProfile, 1500);
  });
})();


