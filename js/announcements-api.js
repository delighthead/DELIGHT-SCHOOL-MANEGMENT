document.addEventListener("DOMContentLoaded", function () {
  const announcementForm = document.getElementById("announcementForm");
  const announcementTableBody = document.getElementById("announcementTableBody");
  const branchSelect = document.getElementById("announcement_branch_id");
  const branchWrapper = document.getElementById("announcement_branch_wrapper");

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

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  }

  function isSuperAdmin() {
    const user = getLoggedInUser();
    return user && user.role === "super_admin";
  }

  function isAdmin() {
    const user = getLoggedInUser();
    return user && user.role === "branch_admin";
  }

  function getAdminId() {
    const user = getLoggedInUser();
    return user ? user.branch_id : null;
  }

  function formatAudience(audience) {
    if (audience === "all") return "Everyone";
    if (audience === "parents") return "Parents";
    if (audience === "teachers") return "Teachers";
    if (audience === "students") return "Students";
    return audience || "";
  }

  async function loadBranches() {
    if (!branchSelect) return;

    if (isSuperAdmin()) {
      if (branchWrapper) {
        branchWrapper.style.display = "none";
      }
      branchSelect.removeAttribute("required");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/branches", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      branchSelect.innerHTML = '<option value="">Select branch</option>';

      data.branches.forEach(function (branch) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.branch_name;
        branchSelect.appendChild(option);
      });

      if (isAdmin()) {
        branchSelect.value = getAdminId();
        branchSelect.disabled = true;
      } else {
        branchSelect.disabled = false;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadAnnouncements() {
    if (!announcementTableBody) return;

    try {
      let url = "http://127.0.0.1:5000/api/announcements";

      if (isAdmin()) {
        url += `?branch_id=${getAdminBranchId()}`;
      }

      const response = await fetch(url, {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      announcementTableBody.innerHTML = "";

      if (!data.announcements || data.announcements.length === 0) {
        announcementTableBody.innerHTML = `
          <tr>
            <td colspan="6">No announcements found.</td>
          </tr>
        `;
        return;
      }

      data.announcements.forEach(function (announcement) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${announcement.branch_name || "All es"}</td>
          <td>${announcement.title || ""}</td>
          <td>${announcement.message || ""}</td>
          <td>${formatAudience(announcement.audience)}</td>
          <td>${announcement.created_at ? announcement.created_at.slice(0, 10) : ""}</td>
          <td>
            <button class="small-btn danger delete-announcement-btn" data-id="${announcement.id}">Delete</button>
          </td>
        `;

        announcementTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      announcementTableBody.innerHTML = `
        <tr>
          <td colspan="6">Could not load announcements.</td>
        </tr>
      `;
    }
  }

  if (announcementForm) {
    announcementForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const announcementData = {
        branch_id: isSuperAdmin() ? null : getAdminId(),
        title: document.getElementById("announcement_title").value.trim(),
        message: document.getElementById("announcement_message").value.trim(),
        audience: document.getElementById("announcement_audience").value
      };

      try {
        const response = await fetch("http://127.0.0.1:5000/api/announcements", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(announcementData)
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to add announcement");
          return;
        }

        alert("Announcement added successfully");
        announcementForm.reset();
        loades();
        loadAnnouncements();
      } catch (error) {
        console.error(error);
        console.error("Cannot connect to backend.");
      }
    });
  }

  if (announcementTableBody) {
    announcementTableBody.addEventListener("click", async function (event) {
      const deleteBtn = event.target.closest(".delete-announcement-btn");
      if (!deleteBtn) return;

      const confirmDelete = confirm("Are you sure you want to delete this announcement?");
      if (!confirmDelete) return;

      try {
        const response = await fetch(`http://127.0.0.1:5000/api/announcements/${deleteBtn.dataset.id}`, {
          method: "DELETE",
          headers: getAuthOnlyHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to delete announcement");
          return;
        }

        alert("Announcement deleted successfully");
        loadAnnouncements();
      } catch (error) {
        console.error(error);
        console.error("Cannot connect to backend.");
      }
    });
  }

  loadBranches();
  loadAnnouncements();
});


