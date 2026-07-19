document.addEventListener("DOMContentLoaded", function () {
  const subjects = [
    "ENGLISH",
    "MATHEMATICS",
    "INTEGRATED SCIENCE",
    "SOCIAL STUDIES",
    "R.M.E",
    "CAREER TECHNOLOGY",
    "COMPUTING",
    "FRENCH",
    "GHANAIAN LANGUAGE",
    "CREATIVE ARTS",
    "GHANA HISTORY",
    "PHYSICAL EDUCATION",
    "OUR WORLD OUR PEOPLE"
  ];

  function findSubjectInput() {
    // Try common IDs first
    const knownIds = [
      "subject",
      "assignment_subject",
      "teacher_subject",
      "assign_subject",
      "subject_name"
    ];

    for (const id of knownIds) {
      const el = document.getElementById(id);
      if (el) return el;
    }

    // Find input by placeholder or label text
    const inputs = document.querySelectorAll("input");

    for (const input of inputs) {
      const placeholder = (input.placeholder || "").toLowerCase();
      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();

      if (
        placeholder.includes("mathematics") ||
        placeholder.includes("subject") ||
        id.includes("subject") ||
        name.includes("subject")
      ) {
        return input;
      }
    }

    return null;
  }

  function makeSubjectDropdown() {
    const oldInput = findSubjectInput();

    if (!oldInput) return;
    if (oldInput.tagName.toLowerCase() === "select") return;

    const select = document.createElement("select");
    select.id = oldInput.id || "subject";
    select.name = oldInput.name || select.id;
    select.required = oldInput.required;

    const first = document.createElement("option");
    first.value = "";
    first.textContent = "Select subject";
    select.appendChild(first);

    subjects.forEach(subject => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      select.appendChild(option);
    });

    oldInput.parentNode.replaceChild(select, oldInput);
  }

  makeSubjectDropdown();

  // Run again after other scripts finish loading
  setTimeout(makeSubjectDropdown, 800);
  setTimeout(makeSubjectDropdown, 1500);
});
