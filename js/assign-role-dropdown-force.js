document.addEventListener("DOMContentLoaded", function () {
  const roleField = document.getElementById("assign_role");
  if (!roleField) return;

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function isBranchScopedAdmin() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "branch_admin" || role === "teacher_admin";
  }

  const allowedRoles = isBranchScopedAdmin()
    ? ["Class Teacher", "Subject Teacher"]
    : ["Admin", "Class Teacher", "Subject Teacher"];

  // If already a select, ensure expected options exist.
  if (roleField.tagName && roleField.tagName.toLowerCase() === "select") {
    roleField.innerHTML = "";

    const first = document.createElement("option");
    first.value = "";
    first.textContent = "Select role";
    roleField.appendChild(first);

    allowedRoles.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      roleField.appendChild(option);
    });

    roleField.value = "Subject Teacher";

    return;
  }

  // If old markup still has an input, replace it with a select.
  const select = document.createElement("select");
  select.id = "assign_role";
  select.name = roleField.name || "assign_role";

  [
    { value: "", label: "Select role" },
    ...allowedRoles.map(value => ({ value, label: value }))
  ].forEach(item => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    if (item.value === "Subject Teacher") {
      option.selected = true;
    }
    select.appendChild(option);
  });

  roleField.replaceWith(select);
});
