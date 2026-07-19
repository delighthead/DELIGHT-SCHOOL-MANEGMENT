document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";
  const form = document.getElementById("teacherForm");

  if (!form) return;

  function token() {
    return localStorage.getItem("token") || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function isBranchAdmin() {
    return String(getUser().role || "").toLowerCase() === "branch_admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  }

  function getValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  document.addEventListener("click", function (event) {
    const editBtn = event.target.closest(".edit-teacher-btn");
    if (!editBtn) return;

    try {
      const teacher = JSON.parse(decodeURIComponent(editBtn.dataset.record || "{}"));

      form.dataset.editingTeacherId = teacher.id || "";

      setValue("teacher_branch_id", teacher.branch_id);
      setValue("teacher_id", teacher.teacher_id);
      setValue("teacher_full_name", teacher.full_name || teacher.name);
      setValue("teacher_ghana_card_number", teacher.ghana_card_number || teacher.ghana_card);
      setValue("teacher_phone", teacher.phone);
      setValue("teacher_email", teacher.email);
      setValue("teacher_address", teacher.address);
      setValue("teacher_status", String(teacher.status || "active").toLowerCase());

      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.textContent = "Update Teacher";

      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      alert("Could not load teacher for editing.");
    }
  }, true);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const editingId = form.dataset.editingTeacherId || "";

    const payload = {
      branch_id: isBranchAdmin() ? getBranchId() : getValue("teacher_branch_id"),
      teacher_id: getValue("teacher_id"),
      full_name: getValue("teacher_full_name"),
      ghana_card_number: getValue("teacher_ghana_card_number"),
      phone: getValue("teacher_phone"),
      email: getValue("teacher_email"),
      address: getValue("teacher_address"),
      status: String(getValue("teacher_status") || "active").toLowerCase()
    };

    if (!payload.branch_id || !payload.teacher_id || !payload.full_name || !payload.ghana_card_number || !payload.phone) {
      alert("Please fill Branch, Teacher ID, Full Name, Ghana Card, and Phone Number.");
      return false;
    }

    const isEditing = Boolean(editingId);

    const url = isEditing
      ? `${API}/api/teachers/${editingId}`
      : `${API}/api/teachers`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token() ? `Bearer ${token()}` : ""
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save teacher.");
        return false;
      }

      alert(data.message || (isEditing ? "Teacher updated successfully." : "Teacher added successfully."));

      form.reset();
      delete form.dataset.editingTeacherId;

      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.textContent = "Add Teacher";

      location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to save teacher.");
    }

    return false;
  }, true);
});
