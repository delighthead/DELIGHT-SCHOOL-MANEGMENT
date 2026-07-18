document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/settings");
    const data = await response.json();

    if (!response.ok) return;

    const settings = data.settings || {};

    const academicYear = settings.academic_year || "";
    const currentTerm = settings.current_term || "";

    function setValue(selector, value) {
      const fields = document.querySelectorAll(selector);
      fields.forEach(field => {
        if (!field.value || field.value.trim() === "") {
          field.value = value;
        }
      });
    }

    // Academic year fields
    setValue("#academic_year", academicYear);
    setValue("[name='academic_year']", academicYear);
    setValue("#attendance_academic_year", academicYear);
    setValue("#score_academic_year", academicYear);
    setValue("#fee_academic_year", academicYear);
    setValue("#report_academic_year", academicYear);

    // Term fields
    setValue("#current_term", currentTerm);
    setValue("#term", currentTerm);
    setValue("[name='term']", currentTerm);
    setValue("#attendance_term", currentTerm);
    setValue("#score_term", currentTerm);
    setValue("#fee_term", currentTerm);
    setValue("#report_term", currentTerm);

    // Show label if page has session display area
    const sessionBox = document.getElementById("academicSessionBox");
    if (sessionBox) {
      sessionBox.innerHTML = `
        <strong>Academic Year:</strong> ${academicYear}
        &nbsp; | &nbsp;
        <strong>Current Term:</strong> ${currentTerm}
      `;
    }

  } catch (error) {
    console.error("Could not load academic session:", error);
  }
});
