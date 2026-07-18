(function () {
  const API = "http://127.0.0.1:5000";

  function token() {
    return localStorage.getItem("token") || "";
  }

  function fullUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return API + path + "?v=" + Date.now();
  }

  function addAdminSidebarPicture(profilePicture) {
    if (!profilePicture) return;

    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    if (document.getElementById("adminSidebarProfilePhotoBox")) return;

    const box = document.createElement("div");
    box.id = "adminSidebarProfilePhotoBox";
    box.style.textAlign = "center";
    box.style.margin = "0 auto 18px auto";

    box.innerHTML = `
      <img src="${fullUrl(profilePicture)}"
           alt="Admin Profile Photo"
           style="
             width: 135px;
             height: 135px;
             border-radius: 50%;
             object-fit: cover;
             border: 4px solid #ffcc00;
             background: #ffffff;
             display: block;
             margin: 0 auto;
           ">
    `;

    sidebar.insertBefore(box, sidebar.firstChild);
  }

  async function loadAdminPicture() {
    try {
      const res = await fetch(`${API}/api/admin-profile/me`, {
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const data = await res.json();

      if (!res.ok) return;

      const profile = data.profile || {};

      if (profile.profile_picture) {
        addAdminSidebarPicture(profile.profile_picture);
      }
    } catch (error) {
      console.error("Admin sidebar picture error:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadAdminPicture, 400);
    setTimeout(loadAdminPicture, 1200);
  });
})();
