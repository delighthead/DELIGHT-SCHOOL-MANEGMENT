document.addEventListener("DOMContentLoaded", function () {
  const childrenProfileBox = document.getElementById("childrenProfileBox");
  const childrenSelector = document.getElementById("parentChildrenSelector");

  const parentContactForm = document.getElementById("parentContactForm");
  const parentFullNameReadonly = document.getElementById("parent_full_name_readonly");
  const parentBranchReadonly = document.getElementById("parent_branch_readonly");
  const parentGhanaCardReadonly = document.getElementById("parent_ghana_card_readonly");
  const parentPhoneEdit = document.getElementById("parent_phone_edit");
  const parentEmailEdit = document.getElementById("parent_email_edit");
  const parentContactMsg = document.getElementById("parentContactMsg");

  let children = [];
  let selectedChildId = null;

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function display(value, fallback = "Not provided") {
    const text = String(value ?? "").trim();
    return text ? safe(text) : fallback;
  }

  function titleCase(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  function photoContent(child, small = false) {
    if (child.profile_picture) {
      return `<img src="${safe(child.profile_picture)}" alt="${safe(child.full_name || "Student")}">`;
    }

    const initial = String(child.full_name || "S").trim().charAt(0).toUpperCase();

    if (small) {
      return `<span>${safe(initial)}</span>`;
    }

    return `<span>Student<br>Photo</span>`;
  }

  function setContactMessage(message, isError) {
    if (!parentContactMsg) return;

    parentContactMsg.textContent = message || "";
    parentContactMsg.style.color = isError ? "#b00020" : "#1b5e20";
  }

  async function loadMyContactProfile() {
    const response = await fetch("/api/parents/my/profile", {
      headers: getAuthOnlyHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load parent profile.");
    }

    const parent = data.parent || {};

    if (parentFullNameReadonly) {
      parentFullNameReadonly.value = parent.full_name || "";
    }

    if (parentBranchReadonly) {
      parentBranchReadonly.value = parent.branch_name || "";
    }

    if (parentGhanaCardReadonly) {
      parentGhanaCardReadonly.value = parent.ghana_card_number || "";
    }

    if (parentPhoneEdit) {
      parentPhoneEdit.value = parent.phone || "";
    }

    if (parentEmailEdit) {
      parentEmailEdit.value = parent.email || "";
    }
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
      const response = await fetch("/api/parents/my/profile", {
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

      setContactMessage(
        data.message || "Profile updated successfully.",
        false
      );

      await loadMyContactProfile();

    } catch (error) {
      setContactMessage(
        error.message || "Cannot connect to backend.",
        true
      );
    }
  }

  function getSelectedChild() {
    return children.find(
      child => Number(child.id) === Number(selectedChildId)
    ) || children[0] || null;
  }

  function renderChildrenSelector() {
    if (!childrenSelector) return;

    if (!children.length) {
      childrenSelector.innerHTML = "<p>No active children found.</p>";
      return;
    }

    childrenSelector.innerHTML = children.map(child => {
      const active =
        Number(child.id) === Number(selectedChildId) ? " active" : "";

      return `
        <button
          type="button"
          class="parent-child-select-card${active}"
          data-child-id="${safe(child.id)}"
        >
          <div class="parent-child-select-photo">
            ${photoContent(child, true)}
          </div>

          <div class="parent-child-select-info">
            <strong>${display(child.full_name, "Student")}</strong>
            <span>${display(child.class_name, "Class not assigned")}</span>
            <span>${display(child.branch_name, "Branch not assigned")}</span>
          </div>
        </button>
      `;
    }).join("");

    childrenSelector
      .querySelectorAll(".parent-child-select-card")
      .forEach(button => {
        button.addEventListener("click", function () {
          selectedChildId = this.dataset.childId;

          renderChildrenSelector();
          renderSelectedChild();
        });
      });
  }

  function infoItem(label, value) {
    const text = String(value ?? "").trim();

    if (!text) {
      return "";
    }

    return `
      <div class="info-item">
        <strong>${safe(label)}</strong>
        <span>${safe(text)}</span>
      </div>
    `;
  }

  function renderSelectedChild() {
    if (!childrenProfileBox) return;

    const child = getSelectedChild();

    if (!child) {
      childrenProfileBox.innerHTML = `
        <section class="dashboard-section">
          <p>No active child is linked to this parent account.</p>
        </section>
      `;
      return;
    }

    const personalItems = [
      infoItem("Full Name", child.full_name),
      infoItem("Student ID", child.student_id),
      infoItem("Admission Number", child.admission_number),
      infoItem("Sex", child.sex),
      infoItem("Date of Birth", formatDate(child.date_of_birth)),
      infoItem("Place of Birth", child.place_of_birth),
      infoItem("Nationality", child.nationality),
      infoItem("Language Spoken", child.language_spoken),
      infoItem("Branch", child.branch_name),
      infoItem("Class", child.class_name),
      infoItem("Status", titleCase(child.status))
    ].join("");

    const guardianItems = [
      infoItem("Relationship", titleCase(child.relationship)),
      infoItem("Mother's Name", child.mother_name),
      infoItem("Mother's Ghana Card", child.mother_ghana_card),
      infoItem("Mother's Phone", child.mother_phone),
      infoItem("Father's Name", child.father_name),
      infoItem("Father's Ghana Card", child.father_ghana_card),
      infoItem("Father's Phone", child.father_phone)
    ].join("");

    childrenProfileBox.innerHTML = `
      <section class="dashboard-section">

        <div class="parent-profile-hero">

          <div class="parent-profile-photo">
            ${photoContent(child)}
          </div>

          <div>
            <h2>${display(child.full_name, "Student")}</h2>

            ${
              child.student_id
                ? `<p><strong>Student ID:</strong> ${safe(child.student_id)}</p>`
                : ""
            }

            ${
              child.admission_number
                ? `<p><strong>Admission Number:</strong> ${safe(child.admission_number)}</p>`
                : ""
            }

            ${
              child.class_name
                ? `<p><strong>Class:</strong> ${safe(child.class_name)}</p>`
                : ""
            }

            ${
              child.branch_name
                ? `<p><strong>Branch:</strong> ${safe(child.branch_name)}</p>`
                : ""
            }

            ${
              child.status
                ? `<p><strong>Status:</strong> ${safe(titleCase(child.status))}</p>`
                : ""
            }
          </div>

        </div>

        <h3 class="parent-profile-section-title">
          Personal Information
        </h3>

        <div class="info-grid">
          ${
            personalItems ||
            `<p>No personal information available.</p>`
          }
        </div>

        <h3 class="parent-profile-section-title">
          Parent / Guardian Information
        </h3>

        <div class="info-grid">
          ${
            guardianItems ||
            `<p>No parent or guardian information available.</p>`
          }
        </div>

      </section>
    `;
  }

  async function loadChildrenProfiles() {
    if (!childrenProfileBox) return;

    try {
      const response = await fetch("/api/parents/my/children", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load child profile."
        );
      }

      children = data.children || [];

      if (!children.length) {
        selectedChildId = null;

        if (childrenSelector) {
          childrenSelector.innerHTML =
            "<p>No active children found.</p>";
        }

        renderSelectedChild();
        return;
      }

      selectedChildId = children[0].id;

      renderChildrenSelector();
      renderSelectedChild();

    } catch (error) {
      console.error(error);

      if (childrenSelector) {
        childrenSelector.innerHTML =
          `<p>${safe(error.message || "Cannot connect to backend.")}</p>`;
      }

      childrenProfileBox.innerHTML = `
        <section class="dashboard-section">
          <p>${safe(error.message || "Cannot connect to backend.")}</p>
        </section>
      `;
    }
  }

  if (parentContactForm) {
    parentContactForm.addEventListener(
      "submit",
      updateMyContactProfile
    );
  }

  loadMyContactProfile().catch(function (error) {
    setContactMessage(
      error.message || "Could not load parent profile.",
      true
    );
  });

  loadChildrenProfiles();
});
