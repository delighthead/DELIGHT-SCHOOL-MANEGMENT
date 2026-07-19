document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";
  const form = document.getElementById("teacherAssignForm");

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
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "admin";
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const classSelect = document.getElementById("assign_class_id");
    const selectedClassText = classSelect && classSelect.selectedIndex >= 0
      ? classSelect.options[classSelect.selectedIndex].textContent.trim()
      : "";

    const payload = {
      teacher_database_id: value("assign_teacher_id"),
      branch_id: isBranchAdmin() ? (getUser().branch_id || "") : value("assign_branch_id"),
      class_name: selectedClassText,
      subject: value("assign_subject"),
      role: value("assign_role") || "Subject Teacher",
      academic_year: value("assign_academic_year") || "2025/2026",
      status: "active"
    };

    const missing = [];

    if (!payload.teacher_database_id) missing.push("Teacher");
    if (!payload.branch_id) missing.push("Branch");
    if (!payload.class_name || payload.class_name.toLowerCase().includes("select")) missing.push("Class");
    if (!payload.subject) missing.push("Subject");

    if (missing.length > 0) {
      alert("Missing: " + missing.join(", "));
      console.log("Assign teacher payload:", payload);
      return false;
    }

    try {
      const res = await fetch(`${API}/api/teachers/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token() ? `Bearer ${token()}` : ""
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to assign teacher.");
        console.log("Assign teacher backend response:", data);
        return false;
      }

      alert(data.message || "Teacher assigned successfully.");
      form.reset();
      location.reload();
    } catch (error) {
      console.error("Assign teacher error:", error);
      alert("Failed to assign teacher.");
    }

    return false;
  }, true);
});
