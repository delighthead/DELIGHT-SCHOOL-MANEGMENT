document.addEventListener("DOMContentLoaded", function () {
  const childrenProfileBox = document.getElementById("childrenProfileBox");
  const parentContactForm = document.getElementById("parentContactForm");
  const parentFullNameReadonly = document.getElementById("parent_full_name_readonly");
  const parentBranchReadonly = document.getElementById("parent_branch_readonly");
  const parentGhanaCardReadonly = document.getElementById("parent_ghana_card_readonly");
  const parentPhoneEdit = document.getElementById("parent_phone_edit");
  const parentEmailEdit = document.getElementById("parent_email_edit");
  const parentContactMsg = document.getElementById("parentContactMsg");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function studentPhoto(child) {
    if (child.profile_picture) {
      return `<img src="http://127.0.0.1:5000${child.profile_picture}" alt="Student Photo" style="width:120px;height:120px;border-radius:50%;object-fit:cover;">`;
    }

    return `<div style="width:120px;height:120px;border-radius:50%;background:#003b70;color:#ffcc00;display:flex;align-items:center;justify-content:center;font-weight:bold;">Student Photo</div>`;
  }

  function setContactMessage(message, isError) {
    if (!parentContactMsg) return;
    parentContactMsg.textContent = message || "";
    parentContactMsg.style.color = isError ? "#b00020" : "#1b5e20";
  }

  async function loadMyContactProfile() {
    const response = await fetch("http://127.0.0.1:5000/api/parents/my/profile", {
      headers: getAuthOnlyHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load parent profile.");
    }

    const parent = data.parent || {};

    if (parentFullNameReadonly) parentFullNameReadonly.value = parent.full_name || "";
    if (parentBranchReadonly) parentBranchReadonly.value = parent.branch_name || "";
    if (parentGhanaCardReadonly) parentGhanaCardReadonly.value = parent.ghana_card_number || "";
    if (parentPhoneEdit) parentPhoneEdit.value = parent.phone || "";
    if (parentEmailEdit) parentEmailEdit.value = parent.email || "";
  }

  async function updateMyContactProfile(event) {
    event.preventDefault();

    const phone = (parentPhoneEdit ? parentPhoneEdit.value : "").trim();
    const email = (parentEmailEdit ? parentEmailEdit.value : "").trim();

    if (!phone) {
      setContactMessage("Phone number is required.", true);
      return;
    }

    setContactMessage("Updating contact...", false);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/profile", {
        method: "PUT",
        headers: {
          ...getAuthOnlyHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone, email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update contact details.");
      }

      setContactMessage(data.message || "Profile updated successfully.", false);
      await loadMyContactProfile();
    } catch (error) {
      setContactMessage(error.message || "Cannot connect to backend.", true);
    }
  }

  async function loadChildrenProfiles() {
    if (!childrenProfileBox) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/children", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      childrenProfileBox.innerHTML = "";

      if (!response.ok) {
        childrenProfileBox.innerHTML = `<p>${data.message || "Could not load child profile."}</p>`;
        return;
      }

      const children = data.children || [];

      if (children.length === 0) {
        childrenProfileBox.innerHTML = "<p>No active children found.</p>";
        return;
      }

      children.forEach(function (child) {
        const section = document.createElement("section");
        section.className = "dashboard-section";

        section.innerHTML = `
          <h2>${child.full_name || ""}</h2>

          <div style="display:flex;gap:25px;align-items:flex-start;flex-wrap:wrap;background:#f3f5f8;padding:20px;border-radius:10px;margin-bottom:20px;">
            ${studentPhoto(child)}

            <div>
              <h2>${child.full_name || ""}</h2>
              <p><strong>Admission Number:</strong> ${child.admission_number || ""}</p>
              <p><strong>Student ID:</strong> ${child.student_id || ""}</p>
              <p><strong>Branch:</strong> ${child.branch_name || ""}</p>
              <p><strong>Class:</strong> ${child.class_name || ""}</p>
              <p><strong>Status:</strong> ${child.status || ""}</p>
            </div>
          </div>

          <h3>Personal Information</h3>
          <div class="dashboard-cards">
            <div class="dashboard-card"><h3>Full Name</h3><p>${child.full_name || ""}</p></div>
            <div class="dashboard-card"><h3>Sex</h3><p>${child.sex || ""}</p></div>
            <div class="dashboard-card"><h3>Date of Birth</h3><p>${formatDate(child.date_of_birth)}</p></div>
            <div class="dashboard-card"><h3>Place of Birth</h3><p>${child.place_of_birth || ""}</p></div>
            <div class="dashboard-card"><h3>Nationality</h3><p>${child.nationality || ""}</p></div>
            <div class="dashboard-card"><h3>Language Spoken</h3><p>${child.language_spoken || ""}</p></div>
            <div class="dashboard-card"><h3>Branch</h3><p>${child.branch_name || ""}</p></div>
            <div class="dashboard-card"><h3>Class</h3><p>${child.class_name || ""}</p></div>
          </div>

          <h3>Parent / Guardian Information</h3>
          <div class="dashboard-cards">
            <div class="dashboard-card"><h3>Mother's Name</h3><p>${child.mother_name || ""}</p></div>
            <div class="dashboard-card"><h3>Mother's Ghana Card</h3><p>${child.mother_ghana_card || ""}</p></div>
            <div class="dashboard-card"><h3>Mother's Phone</h3><p>${child.mother_phone || ""}</p></div>
            <div class="dashboard-card"><h3>Father's Name</h3><p>${child.father_name || ""}</p></div>
            <div class="dashboard-card"><h3>Father's Ghana Card</h3><p>${child.father_ghana_card || ""}</p></div>
            <div class="dashboard-card"><h3>Father's Phone</h3><p>${child.father_phone || ""}</p></div>
            <div class="dashboard-card"><h3>Relationship</h3><p>${child.relationship || ""}</p></div>
          </div>
        `;

        childrenProfileBox.appendChild(section);
      });
    } catch (error) {
      console.error(error);
      childrenProfileBox.innerHTML = "<p>Cannot connect to backend.</p>";
    }
  }

  if (parentContactForm) {
    parentContactForm.addEventListener("submit", updateMyContactProfile);
  }

  loadMyContactProfile().catch(function (error) {
    setContactMessage(error.message || "Could not load parent profile.", true);
  });

  loadChildrenProfiles();
});


