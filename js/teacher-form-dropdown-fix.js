document.addEventListener("DOMContentLoaded", function () {
  function normalizeAssignRoleField() {
    const byId = document.getElementById("assign_role");
    const roleField = byId || document.querySelector("#teacherAssignForm input[placeholder*='Subject Teacher']");

    if (!roleField) return;

    const options = [
      { value: "", label: "Select role" },
      { value: "Admin", label: "Admin" },
      { value: "Class Teacher", label: "Class Teacher" },
      { value: "Subject Teacher", label: "Subject Teacher" }
    ];

    if (roleField.tagName && roleField.tagName.toLowerCase() === "select") {
      const existingValues = Array.from(roleField.options || []).map(option => option.value);

      options.forEach(item => {
        if (!existingValues.includes(item.value)) {
          const option = document.createElement("option");
          option.value = item.value;
          option.textContent = item.label;
          roleField.appendChild(option);
        }
      });

      if (!roleField.value) {
        roleField.value = "Subject Teacher";
      }

      return;
    }

    const select = document.createElement("select");
    select.id = "assign_role";
    select.name = roleField.name || "assign_role";

    options.forEach(item => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      if (item.value === "Subject Teacher") {
        option.selected = true;
      }
      select.appendChild(option);
    });

    roleField.replaceWith(select);
  }

  function loadTeacherStatus() {
    const statusSelect = document.getElementById("teacher_status");
    if (!statusSelect) return;

    statusSelect.innerHTML = `
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="locked">Locked</option>
      <option value="disabled">Disabled</option>
    `;
  }

  loadTeacherStatus();
  normalizeAssignRoleField();
});
