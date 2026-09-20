document.addEventListener("DOMContentLoaded", function () {
  const API = "";

  const form = document.getElementById("teacherAssignForm");

  if (!form) {
    return;
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }

  function isBranchAdmin() {
    const user = getUser();
    return String(user.role || "").toLowerCase() === "branch_admin";
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function authHeaders() {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    };
  }

  function selectedSubjects() {
    return Array.from(
      document.querySelectorAll(
        'input[name="assign_subjects"]:checked'
      )
    ).map(input => input.value);
  }

  function selectedClasses() {
    return Array.from(
      document.querySelectorAll(
        'input[name="assign_classes"]:checked'
      )
    ).map(input => ({
      id: input.value,
      name: input.dataset.className
    }));
  }

  async function loadClasses() {
    const container =
      document.getElementById("assign_class_checkboxes");

    if (!container) return;

    const branchId = isBranchAdmin()
      ? String(getUser().branch_id || "")
      : value("assign_branch_id");

    if (!branchId) {
      container.innerHTML =
        "<p style='margin:0;'>Select a branch first to load classes.</p>";
      return;
    }

    container.innerHTML =
      "<p style='margin:0;'>Loading classes...</p>";

    try {
      const res = await fetch(
        `/api/classes?branch_id=${encodeURIComponent(branchId)}`,
        {
          headers: authHeaders()
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load classes"
        );
      }

      const classes = Array.isArray(data)
        ? data
        : Array.isArray(data.classes)
          ? data.classes
          : Array.isArray(data.data)
            ? data.data
            : [];

      if (!classes.length) {
        container.innerHTML =
          "<p style='margin:0;'>No classes found for this branch.</p>";
        return;
      }

      container.innerHTML = classes.map(cls => {
        const id = cls.id ?? cls.class_id;
        const name = cls.class_name || cls.name || "";

        return `
          <label class="assignment-check-item">
            <input
              type="checkbox"
              name="assign_classes"
              value="${id}"
              data-class-name="${String(name)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}"
            >
            <span>${String(name)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</span>
          </label>
        `;
      }).join("");

    } catch (error) {
      console.error("Load classes error:", error);

      container.innerHTML =
        `<p style="margin:0;color:red;">${error.message}</p>`;
    }
  }

  const branchSelect =
    document.getElementById("assign_branch_id");

  if (branchSelect) {
    branchSelect.addEventListener("change", loadClasses);
  }

  /*
   * Some existing scripts populate the branch dropdown after
   * DOMContentLoaded, so give them time before checking it.
   */
  setTimeout(loadClasses, 700);

  form.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const teacherId = value("assign_teacher_id");

      const branchId = isBranchAdmin()
        ? String(getUser().branch_id || "")
        : value("assign_branch_id");

      const classes = selectedClasses();
      const subjects = selectedSubjects();

      const role =
        value("assign_role") || "Subject Teacher";

      const academicYear =
        value("assign_academic_year") || "2025/2026";

      const missing = [];

      if (!teacherId) missing.push("Teacher");
      if (!branchId) missing.push("Branch");

      if (!classes.length) {
        missing.push("at least one Class");
      }

      if (!subjects.length) {
        missing.push("at least one Subject");
      }

      if (missing.length) {
        alert("Please select: " + missing.join(", "));
        return false;
      }

      const combinations = [];

      classes.forEach(cls => {
        subjects.forEach(subject => {
          combinations.push({
            class_name: cls.name,
            subject
          });
        });
      });

      const button =
        form.querySelector('button[type="submit"]');

      const originalButtonText =
        button ? button.textContent : "";

      if (button) {
        button.disabled = true;
        button.textContent =
          `Assigning ${combinations.length} assignment(s)...`;
      }

      let created = 0;
      let skipped = 0;
      const failures = [];

      try {
        for (const assignment of combinations) {

          const payload = {
            teacher_database_id: teacherId,
            branch_id: branchId,
            class_name: assignment.class_name,
            subject: assignment.subject,
            role,
            academic_year: academicYear,
            status: "active"
          };

          try {
            const res = await fetch(
              `${API}/api/teachers/assign`,
              {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload)
              }
            );

            const data = await res.json();

            if (!res.ok) {
              failures.push(
                `${assignment.class_name} / ` +
                `${assignment.subject}: ` +
                `${data.message || "Failed"}`
              );
              continue;
            }

            if (data.duplicate === true) {
              skipped++;
            } else {
              created++;
            }

          } catch (error) {
            failures.push(
              `${assignment.class_name} / ` +
              `${assignment.subject}: ${error.message}`
            );
          }
        }

        let message =
          `${created} teacher assignment(s) created successfully.`;

        if (skipped > 0) {
          message += ` ${skipped} duplicate(s) skipped.`;
        }

        if (failures.length) {
          message +=
            `\n\n${failures.length} assignment(s) failed:\n` +
            failures.join("\n");
        }

        alert(message);

        if (created > 0) {
          document
            .querySelectorAll(
              'input[name="assign_classes"], ' +
              'input[name="assign_subjects"]'
            )
            .forEach(input => {
              input.checked = false;
            });

          /*
           * Refresh teacher list so assigned classes/subjects
           * can be seen immediately.
           */
          if (typeof window.loadTeachers === "function") {
            window.loadTeachers();
          } else {
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }
        }

      } finally {
        if (button) {
          button.disabled = false;
          button.textContent =
            originalButtonText || "Assign Teacher";
        }
      }

      return false;
    },
    true
  );
});
