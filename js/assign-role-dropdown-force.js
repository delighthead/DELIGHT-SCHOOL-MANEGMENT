document.addEventListener("DOMContentLoaded", function () {
  const roleField = document.getElementById("assign_role");
  if (!roleField) return;

  // If already a select, ensure expected options exist.
  if (roleField.tagName && roleField.tagName.toLowerCase() === "select") {
    const expected = ["Admin", "Class Teacher", "Subject Teacher"];
    const existing = Array.from(roleField.options || []).map(option => option.value);

    if (!existing.includes("")) {
      const first = document.createElement("option");
      first.value = "";
      first.textContent = "Select role";
      roleField.insertBefore(first, roleField.firstChild);
    }

    expected.forEach(value => {
      if (!existing.includes(value)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        roleField.appendChild(option);
      }
    });

    if (!roleField.value) {
      roleField.value = "Subject Teacher";
    }

    return;
  }

  // If old markup still has an input, replace it with a select.
  const select = document.createElement("select");
  select.id = "assign_role";
  select.name = roleField.name || "assign_role";

  [
    { value: "", label: "Select role" },
    { value: "Admin", label: "Admin" },
    { value: "Class Teacher", label: "Class Teacher" },
    { value: "Subject Teacher", label: "Subject Teacher" }
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
