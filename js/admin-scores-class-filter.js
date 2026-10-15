document.addEventListener("DOMContentLoaded", function () {
  const branchSelect = document.getElementById("score_branch_id");
  const classSelect = document.getElementById("score_class_id");
  const studentSelect = document.getElementById("score_student_id");

  if (!branchSelect || !classSelect || !studentSelect) return;

  function headers() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  let requestVersion = 0;
  let students = [];

  function setOptions(select, placeholder) {
    select.replaceChildren(new Option(placeholder, ""));
  }

  async function loadClasses() {
    const branchId = branchSelect.value;
    const version = ++requestVersion;

    setOptions(classSelect, branchId ? "Loading classes..." : "Select branch first");
    setOptions(studentSelect, "Select class first");

    if (!branchId) return;

    try {
      const response = await fetch("/api/classes", {
        headers: headers()
      });

      if (!response.ok) throw new Error("Could not load classes");

      const data = await response.json();

      if (version !== requestVersion) return;

      setOptions(classSelect, "Select class");

      (data.classes || []).forEach(function (item) {
        classSelect.add(new Option(item.class_name, item.id));
      });
    } catch (error) {
      console.error("Class loading error:", error);
      setOptions(classSelect, "Failed to load classes");
    }
  }

  async function loadStudents() {
    const branchId = branchSelect.value;
    const classId = classSelect.value;
    const version = ++requestVersion;

    setOptions(studentSelect, classId ? "Loading students..." : "Select class first");

    if (!branchId || !classId) return;

    try {
      const response = await fetch(
        `/api/students?branch_id=${encodeURIComponent(branchId)}`,
        { headers: headers() }
      );

      if (!response.ok) throw new Error("Could not load students");

      const data = await response.json();

      if (version !== requestVersion) return;

      students = (data.students || data.data || []).filter(function (student) {
        return String(student.branch_id) === String(branchId) &&
               String(student.class_id) === String(classId);
      });

      setOptions(
        studentSelect,
        students.length ? "Select student" : "No students in this class"
      );

      students.forEach(function (student) {
        studentSelect.add(
          new Option(
            `${student.full_name || ""} - ${student.admission_number || ""}`,
            student.id
          )
        );
      });
    } catch (error) {
      console.error("Student loading error:", error);
      setOptions(studentSelect, "Failed to load students");
    }
  }

  branchSelect.addEventListener("change", loadClasses);
  classSelect.addEventListener("change", loadStudents);

  // Branch options may be loaded asynchronously by scores-api.js.
  // Detect programmatic branch selection, including Branch Admin accounts.
  let lastBranchId = null;

  function checkBranchSelection() {
    const currentBranchId = branchSelect.value;

    if (currentBranchId !== lastBranchId) {
      lastBranchId = currentBranchId;
      loadClasses();
    }
  }

  checkBranchSelection();

  const branchObserver = new MutationObserver(checkBranchSelection);
  branchObserver.observe(branchSelect, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled"]
  });

  // Also detect programmatic value changes that do not emit events.
  setInterval(checkBranchSelection, 500);
});
