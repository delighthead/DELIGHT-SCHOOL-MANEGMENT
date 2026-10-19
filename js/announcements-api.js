document.addEventListener("DOMContentLoaded", function () {
  const announcementForm = document.getElementById("announcementForm");

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
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

  if (announcementForm) {
    announcementForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const selectedAudience =
        document.getElementById("announcement_audience").value;

      const audienceMapping = {
        teachers: {
          audience: "teachers",
          branch_id: null
        },
        kotobabi_parents: {
          audience: "parents",
          branch_id: 3
        },
        ofankor_parents: {
          audience: "parents",
          branch_id: 2
        },
        all: {
          audience: "all",
          branch_id: null
        }
      };

      const selectedMapping = audienceMapping[selectedAudience];

      if (!selectedMapping) {
        alert("Please select a valid announcement audience.");
        return;
      }

      const currentUser = getLoggedInUser();

      if (!currentUser) {
        alert("Your session has expired. Please log in again.");
        return;
      }

      if (!isSuperAdmin()) {
        if (
          selectedMapping.branch_id === null ||
          Number(selectedMapping.branch_id) !== Number(currentUser.branch_id)
        ) {
          alert(
            "Only the Super Admin can publish announcements " +
            "to both branches or another branch."
          );
          return;
        }
      }

      const announcementData = {
        branch_id: selectedMapping.branch_id,
        title: document.getElementById("announcement_title").value.trim(),
        message: document.getElementById("announcement_message").value.trim(),
        audience: selectedMapping.audience
      };

      try {
        const response = await fetch("/api/announcements", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(announcementData)
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to add announcement");
          return;
        }

        let successMessage = "Announcement added successfully.";

        if (data.sms_status === "sent") {
          successMessage += ` SMS sent to ${data.sms_recipient_count || 0} recipient(s).`;
        } else if (data.sms_status === "failed") {
          successMessage += " Announcement was published, but SMS sending failed.";
        } else if (data.sms_status === "skipped") {
          successMessage += " No SMS was sent because no recipient phone numbers were found.";
        } else if (data.sms_status === "not_applicable") {
          successMessage += " No SMS is sent for the Students audience.";
        }

        alert(successMessage);
        announcementForm.reset();
        if (typeof window.loadAnnouncementsFinal === "function") {
          window.loadAnnouncementsFinal();
        }
      } catch (error) {
        console.error(error);
        console.error("Cannot connect to backend.");
      }
    });
  }

  // Announcement table is managed by announcements-list-final.js.
  // Branch dropdown was removed in STEP 464D.
});


