(function () {
  const API = "http://127.0.0.1:5000";

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }

  function fullImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return API + path + "?v=" + Date.now();
  }

  function findInput(words, type = "") {
    const inputs = Array.from(document.querySelectorAll("input, textarea"));

    return inputs.find(input => {
      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const placeholder = (input.placeholder || "").toLowerCase();
      const inputType = (input.type || "").toLowerCase();

      if (type && inputType !== type) return false;

      return words.some(word =>
        id.includes(word) ||
        name.includes(word) ||
        placeholder.includes(word)
      );
    }) || null;
  }

  function findPhoneInput() {
    return findInput(["phone", "number"]);
  }

  function findEmailInput() {
    return findInput(["email"]);
  }

  function findAddressInput() {
    return findInput(["address", "residential"]);
  }

  function findPictureInput() {
    return document.querySelector("input[type='file']");
  }

  function getSummaryPhotoBox() {
    const existingImg =
      document.getElementById("teacherProfilePicture") ||
      document.getElementById("profilePicture") ||
      document.getElementById("profileImage");

    if (existingImg) return existingImg;

    const all = Array.from(document.querySelectorAll("div, span"));
    const photoBox = all.find(el =>
      (el.textContent || "").trim().toLowerCase() === "teacher photo"
    );

    if (!photoBox) return null;

    photoBox.innerHTML = "";

    const img = document.createElement("img");
    img.id = "teacherProfilePicture";
    img.alt = "Teacher Photo";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";

    photoBox.appendChild(img);

    return img;
  }

  async function getTeacher() {
    const user = getUser();

    if (!user.id) return null;

    const res = await fetch(`${API}/api/teachers/by-user/${user.id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Could not load teacher profile.");
    }

    const teacher = data.teacher || data;

    if (teacher && teacher.id) {
      localStorage.setItem("teacher_db_id", teacher.id);
    }

    return teacher;
  }

  async function getTeacherId() {
    const saved = localStorage.getItem("teacher_db_id");
    if (saved) return saved;

    const teacher = await getTeacher();
    return teacher && teacher.id ? teacher.id : "";
  }

  async function loadProfilePicture() {
    try {
      const teacher = await getTeacher();

      if (teacher && teacher.profile_picture) {
        const img = getSummaryPhotoBox();

        if (img) {
          img.src = fullImageUrl(teacher.profile_picture);
        }
      }
    } catch (error) {
      console.error("Load profile picture error:", error);
    }
  }

  window.updateTeacherProfileNow = async function () {
    const phoneInput = findPhoneInput();
    const emailInput = findEmailInput();
    const addressInput = null;
    const pictureInput = findPictureInput();

    const teacherId = await getTeacherId();

    if (!teacherId) {
      alert("Teacher ID not found. Please logout and login again.");
      return;
    }

    const formData = new FormData();

    if (phoneInput) formData.append("phone", phoneInput.value || "");
    if (emailInput) formData.append("email", emailInput.value || "");
    if (addressInput) {
      formData.append("address", addressInput.value || "");
      formData.append("residential_address", addressInput.value || "");
    }

    if (pictureInput && pictureInput.files && pictureInput.files.length > 0) {
      formData.append("profile_picture", pictureInput.files[0]);
    }

    const btn = Array.from(document.querySelectorAll("button")).find(button =>
      (button.textContent || "").toLowerCase().includes("update profile")
    );

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Updating...";
    }

    try {
      const res = await fetch(`${API}/api/teachers/${teacherId}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to update teacher profile.");
      }

      const picture =
        data.profile_picture ||
        (data.teacher && data.teacher.profile_picture);

      if (picture) {
        const img = getSummaryPhotoBox();
        if (img) img.src = fullImageUrl(picture);
      }

      alert("Teacher profile updated successfully.");
      location.reload();
    } catch (error) {
      console.error("Teacher profile update error:", error);
      alert(error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Update Profile";
      }
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    loadProfilePicture();

    const pictureInput = findPictureInput();

    if (pictureInput) {
      pictureInput.addEventListener("change", function () {
        const file = pictureInput.files && pictureInput.files[0];
        if (!file) return;

        const img = getSummaryPhotoBox();
        if (img) {
          img.src = URL.createObjectURL(file);
        }
      });
    }
  });

  document.addEventListener("submit", function (event) {
    const form = event.target.closest("form");
    if (!form) return;

    const text = form.textContent.toLowerCase();

    if (
      !text.includes("phone") &&
      !text.includes("email") &&
      !text.includes("address") &&
      !form.querySelector("input[type='file']")
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    window.updateTeacherProfileNow();
  }, true);

  document.addEventListener("click", function (event) {
    const btn = event.target.closest("button");
    if (!btn) return;

    const text = (btn.textContent || "").toLowerCase();

    if (!text.includes("update profile")) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    window.updateTeacherProfileNow();
  }, true);
})();
