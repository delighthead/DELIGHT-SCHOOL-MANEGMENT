(function () {
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
    return "http://127.0.0.1:5000" + path + "?v=" + Date.now();
  }

  async function getTeacherId() {
    const saved = localStorage.getItem("teacher_db_id");
    if (saved) return saved;

    const u = user();
    if (!u.id) return "";

    const res = await fetch(`http://127.0.0.1:5000/api/teachers/by-user/${u.id}`, {
      headers: { Authorization: `Bearer ${token()}` }
    });

    const data = await res.json();
    const teacher = data.teacher || data;

    if (teacher && teacher.id) {
      localStorage.setItem("teacher_db_id", teacher.id);
      return teacher.id;
    }

    return "";
  }

  async function loadPicture() {
    const u = user();
    if (!u.id) return;

    const res = await fetch(`http://127.0.0.1:5000/api/teachers/by-user/${u.id}`, {
      headers: { Authorization: `Bearer ${token()}` }
    });

    const data = await res.json();
    const teacher = data.teacher || data;

    if (teacher && teacher.id) {
      localStorage.setItem("teacher_db_id", teacher.id);
    }

    if (teacher && teacher.profile_picture) {
      const img = document.getElementById("teacherProfilePicture");
      if (img) img.src = fullUrl(teacher.profile_picture);
    }
  }

  async function uploadPicture() {
    const fileInput = document.getElementById("teacherPictureFile");
    const btn = document.getElementById("uploadTeacherPictureBtn");

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("Please choose a picture first.");
      return;
    }

    const teacherId = await getTeacherId();

    if (!teacherId) {
      alert("Teacher ID not found. Please logout and login again.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_picture", fileInput.files[0]);

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Uploading...";
    }

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/teachers/${teacherId}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token()}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Picture upload failed.");
      }

      const picture = data.profile_picture || (data.teacher && data.teacher.profile_picture);

      if (picture) {
        document.getElementById("teacherProfilePicture").src = fullUrl(picture);
      }

      alert("Profile picture uploaded successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Upload Picture";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadPicture();

    const btn = document.getElementById("uploadTeacherPictureBtn");
    const fileInput = document.getElementById("teacherPictureFile");
    const img = document.getElementById("teacherProfilePicture");

    if (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        uploadPicture();
      });
    }

    if (fileInput && img) {
      fileInput.addEventListener("change", function () {
        const file = fileInput.files && fileInput.files[0];
        if (file) img.src = URL.createObjectURL(file);
      });
    }
  });
})();
