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

  const profileBox = document.getElementById("teacherProfileBox");
  const profileForm = document.getElementById("teacherProfileForm");
  const photoBox = document.getElementById("teacherPhotoBox");

  let loggedInTeacher = null;

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  async function loadTeacherProfile() {
    if (!profileBox) return;

    try {
      const user = getLoggedInUser();

      if (!user || user.role !== "teacher") {
        profileBox.innerHTML = "<p>Please login as a teacher.</p>";
        return;
      }

      const response = await fetch(`/api/teachers/by-user/${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        profileBox.innerHTML = `<p>${data.message || "Teacher profile not found."}</p>`;
        return;
      }

      loggedInTeacher = data.teacher;

      const imageUrl = loggedInTeacher.profile_picture
        ? `${loggedInTeacher.profile_picture}`
        : "";

      if (photoBox) {
        photoBox.innerHTML = imageUrl
          ? `<img src="${imageUrl}" alt="Teacher Photo" style="width:130px;height:130px;border-radius:50%;object-fit:cover;">`
          : `<div style="width:130px;height:130px;border-radius:50%;background:#003b70;color:#ffcc00;display:flex;align-items:center;justify-content:center;font-weight:bold;">Teacher Photo</div>`;
      }

      profileBox.innerHTML = `
        <div class="dashboard-card">
          <h2>Full Name</h2>
          <p>${loggedInTeacher.full_name || getSavedTeacherName() || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2>Teacher ID</h2>
          <p>${loggedInTeacher.teacher_id || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2>Ghana Card</h2>
          <p>${loggedInTeacher.ghana_card_number || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2>Phone</h2>
          <p>${loggedInTeacher.phone || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2>Email</h2>
          <p>${loggedInTeacher.email || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2></h2>
          <p>${loggedInTeacher.branch_name || ""}</p>
        </div>

        <div class="dashboard-card">
          <h2>Status</h2>
          <p>${loggedInTeacher.status || ""}</p>
        </div>
      `;

      document.getElementById("teacher_profile_phone").value = loggedInTeacher.phone || "";
      document.getElementById("teacher_profile_email").value = loggedInTeacher.email || "";
      document.getElementById("teacher_profile_address").value = loggedInTeacher.address || "";
    } catch (error) {
      console.error(error);
      profileBox.innerHTML = "<p>Cannot connect to backend.</p>";
    }
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!loggedInTeacher) {
        alert("Teacher profile not loaded.");
        return;
      }

      const formData = new FormData();
      formData.append("phone", document.getElementById("teacher_profile_phone").value.trim());
      formData.append("email", document.getElementById("teacher_profile_email").value.trim());
      formData.append("address", document.getElementById("teacher_profile_address").value.trim());

      const pictureInput = document.getElementById("teacher_profile_picture");
      if (pictureInput.files.length > 0) {
        formData.append("profile_picture", pictureInput.files[0]);
      }

      try {
        const response = await fetch(`/api/teachers/${loggedInTeacher.id}/profile`, {
          method: "PATCH",
          headers: getAuthOnlyHeaders(),
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to update profile.");
          return;
        }

        alert("Profile updated successfully.");
        profileForm.reset();
        await loadTeacherProfile();
      } catch (error) {
        console.error(error);
        alert("Cannot connect to backend.");
      }
    });
  }

  loadTeacherProfile();
});


