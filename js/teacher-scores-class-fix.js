document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function findClassSelects() {
    const selects = Array.from(document.querySelectorAll("select"));

    return selects.filter(select => {
      const id = (select.id || "").toLowerCase();
      const name = (select.name || "").toLowerCase();
      const text = (select.innerText || "").toLowerCase();

      return (
        id.includes("class") ||
        name.includes("class") ||
        text.includes("select class")
      );
    });
  }

  function getClassId(cls) {
    return cls.id || cls.class_id || cls.classId || "";
  }

  function getClassName(cls) {
    return cls.class_name || cls.name || cls.className || cls.title || "";
  }

  async function fetchClasses() {
    const token = localStorage.getItem("token");

    const endpoints = [
      "/api/classes",
      "/api/teacher/classes",
      "/api/teachers/classes",
      "/api/teacher-assigned/classes"
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(API + endpoint, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ""
          }
        });

        if (!res.ok) continue;

        const data = await res.json();

        const classes =
          data.classes ||
          data.assigned_classes ||
          data.teacher_classes ||
          data.data ||
          data;

        if (Array.isArray(classes) && classes.length > 0) {
          return classes;
        }
      } catch (error) {
        console.log("Class endpoint failed:", endpoint);
      }
    }

    return [];
  }

  function toClassOptions(classes) {
    const seen = new Set();
    const options = [];

    classes.forEach(cls => {
      const id = getClassId(cls);
      const name = getClassName(cls);
      const value = String(id || name || "").trim();
      const label = String(name || id || "").trim();

      if (!value || !label) return;

      const key = `${value}::${label.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);

      options.push({ value, label });
    });

    return options;
  }

  async function loadClassDropdowns() {
    const classSelects = findClassSelects();
    if (!classSelects.length) return;

    const classes = await fetchClasses();
    const options = toClassOptions(classes);

    // Avoid replacing dropdowns with incomplete hardcoded values when API classes are unavailable.
    if (options.length === 0) {
      return;
    }

    classSelects.forEach(classSelect => {
      const currentValue = classSelect.value;
      classSelect.disabled = false;
      classSelect.innerHTML = `<option value="">Select class</option>`;

      options.forEach(item => {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.label;
        classSelect.appendChild(option);
      });

      if (currentValue) {
        classSelect.value = currentValue;
      }
    });
  }

  loadClassDropdowns();
  setTimeout(loadClassDropdowns, 800);
  setTimeout(loadClassDropdowns, 1800);
});
