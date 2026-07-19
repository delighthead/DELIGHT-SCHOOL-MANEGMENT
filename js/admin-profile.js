document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function token() {
    return localStorage.getItem("token") || "";
  }

  function localUser() {
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

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  }

  function formatRole(role) {
    if (!role) return "";
    return String(role).replaceAll("_", " ").toUpperCase();
  }

  function showImage(path) {
    const img = document.getElementById("adminProfilePicture");
    const text = document.getElementById("adminAvatarText");

    if (!img || !path) return;

    img.src = fullUrl(path);
    img.style.display = "block";

    if (text) text.style.display = "none";
  }

  function fillProfile(profile) {
    setText("adminFullName", profile.full_name || profile.username || "Admin");
    setText("adminUsername", profile.username || "");
    setText("adminRole", formatRole(profile.role));
    setText("adminBranch", profile.branch_name || "All Branches");
    setText("adminStatus", profile.status || "");
    setText("adminPhoneText", profile.phone || "Not set");
    setText("adminEmailText", profile.email || "Not set");

    setValue("admin_phone", profile.phone || "");
    setValue("admin_email", profile.email || "");

    if (profile.profile_picture) {
      showImage(profile.profile_picture);
    }

    const panelName = document.getElementById("adminPanelName");
    if (panelName) {
      panelName.textContent = profile.full_name
        ? `${profile.full_name}'s Panel`
        : "Admin Panel";
    }
  }

  async function loadProfile() {
    const savedUser = localUser();

    // Show something immediately while backend loads
    if (savedUser && Object.keys(savedUser).length > 0) {
      fillProfile(savedUser);
    }

    try {
      const res = await fetch(`${API}/api/admin-profile/me`, {
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to load profile.");
      }

      const profile = data.profile || {};
      fillProfile(profile);

      const currentUser = {
        ...savedUser,
        ...profile
      };

      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (error) {
      console.error("Admin profile load error:", error);
      setText("adminStatus", "Could not load profile");
    }
  }

  const pictureInput = document.getElementById("admin_profile_picture");

  if (pictureInput) {
    pictureInput.addEventListener("change", function () {
      const file = pictureInput.files && pictureInput.files[0];
      if (!file) return;

      const img = document.getElementById("adminProfilePicture");
      const text = document.getElementById("adminAvatarText");

      if (img) {
        img.src = URL.createObjectURL(file);
        img.style.display = "block";
      }

      if (text) text.style.display = "none";
    });
  }

  const form = document.getElementById("adminProfileForm");

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const phone = document.getElementById("admin_phone").value.trim();
      const email = document.getElementById("admin_email").value.trim();
      const picture = document.getElementById("admin_profile_picture");

      const formData = new FormData();
      formData.append("phone", phone);
      formData.append("email", email);

      if (picture && picture.files && picture.files.length > 0) {
        formData.append("profile_picture", picture.files[0]);
      }

      const btn = form.querySelector("button[type='submit']");

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Updating...";
      }

      try {
        const res = await fetch(`${API}/api/admin-profile/me`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token()}`
          },
          body: formData
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || "Failed to update profile.");
        }

        const profile = data.profile || {};
        fillProfile(profile);

        const savedUser = localUser();
        localStorage.setItem("user", JSON.stringify({ ...savedUser, ...profile }));

        alert("Profile updated successfully.");
      } catch (error) {
        console.error("Admin profile update error:", error);
        alert(error.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Update Profile";
        }
      }
    });
  }

  loadProfile();
});


