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

  const subjectFields = [
    "excel_subject",
    "admin_excel_subject",
    "bulk_approval_subject",
    "score_subject",
    "subject"
  ];

  function replaceInputWithDropdown(id) {
    const oldInput = document.getElementById(id);

    if (!oldInput) return;
    if (oldInput.tagName.toLowerCase() === "select") return;

    const select = document.createElement("select");
    select.id = oldInput.id;
    select.name = oldInput.name || oldInput.id;
    select.required = oldInput.required;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select subject";
    select.appendChild(defaultOption);

    subjects.forEach(function (subject) {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      select.appendChild(option);
    });

    oldInput.parentNode.replaceChild(select, oldInput);
  }

  subjectFields.forEach(replaceInputWithDropdown);
});
