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
    const role = String(user.role || "").toLowerCase();

    return (
      role === "branch_admin" ||
      role === "teacher_admin"
    );
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

      const role = "Subject Teacher";

      const academicYear =
        value("assign_academic_year") || "2026/2027";

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


/*
 * =========================================================
 * CLASS TEACHER ASSIGNMENT
 * =========================================================
 *
 * This is deliberately separate from subject teaching.
 *
 * A teacher can therefore be:
 *   Class Teacher -> Basic 4
 *
 * while also being:
 *   Subject Teacher -> Basic 4 / Mathematics
 *   Subject Teacher -> Basic 5 / Mathematics
 *   Subject Teacher -> Basic 6 / Mathematics
 */
document.addEventListener("DOMContentLoaded", function () {
  const form =
    document.getElementById("classTeacherAssignForm");

  if (!form) {
    return;
  }

  const branchSelect =
    document.getElementById("class_teacher_branch_id");

  const teacherSelect =
    document.getElementById("class_teacher_teacher_id");

  const classSelect =
    document.getElementById("class_teacher_class_id");

  const academicYearInput =
    document.getElementById("class_teacher_academic_year");

  function getUser() {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch (_) {
      return {};
    }
  }

  function isBranchAdmin() {
    const role =
      String(getUser().role || "").toLowerCase();

    return (
      role === "branch_admin" ||
      role === "teacher_admin"
    );
  }

  function authHeaders() {
    const token =
      localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization:
        token ? `Bearer ${token}` : ""
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function effectiveBranchId() {
    if (isBranchAdmin()) {
      return String(
        getUser().branch_id || ""
      );
    }

    return branchSelect
      ? String(branchSelect.value || "").trim()
      : "";
  }

  async function loadBranches() {
    if (!branchSelect) {
      return;
    }

    /*
     * Existing page scripts normally populate the normal
     * assignment branch dropdown. Copy from it where possible
     * so we preserve the page's existing branch-security logic.
     */
    const existingBranch =
      document.getElementById("assign_branch_id");

    if (isBranchAdmin()) {
      const branchId =
        String(getUser().branch_id || "");

      branchSelect.innerHTML =
        branchId
          ? `<option value="${escapeHtml(branchId)}">${escapeHtml(
              existingBranch &&
              existingBranch.options[
                existingBranch.selectedIndex
              ]
                ? existingBranch.options[
                    existingBranch.selectedIndex
                  ].textContent
                : "Assigned Branch"
            )}</option>`
          : '<option value="">No branch assigned</option>';

      branchSelect.disabled = true;
      return;
    }

    if (
      existingBranch &&
      existingBranch.options.length > 1
    ) {
      branchSelect.innerHTML =
        existingBranch.innerHTML;

      return;
    }

    /*
     * Give teachers-api.js time to populate the existing
     * branch dropdown, then copy it.
     */
    setTimeout(() => {
      if (
        existingBranch &&
        existingBranch.options.length
      ) {
        branchSelect.innerHTML =
          existingBranch.innerHTML;
      }
    }, 900);
  }

  async function loadTeachers() {
    if (!teacherSelect) {
      return;
    }

    const branchId =
      effectiveBranchId();

    teacherSelect.innerHTML =
      '<option value="">Loading teachers...</option>';

    if (!branchId) {
      teacherSelect.innerHTML =
        '<option value="">Select branch first</option>';
      return;
    }

    try {
      const res = await fetch(
        `/api/teachers?branch_id=${encodeURIComponent(
          branchId
        )}`,
        {
          headers: authHeaders()
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
          "Failed to load teachers"
        );
      }

      const teachers =
        Array.isArray(data)
          ? data
          : Array.isArray(data.teachers)
            ? data.teachers
            : [];

      teacherSelect.innerHTML =
        '<option value="">Select teacher</option>';

      teachers.forEach(teacher => {
        const option =
          document.createElement("option");

        option.value = teacher.id;

        option.textContent =
          teacher.full_name ||
          teacher.teacher_name ||
          teacher.teacher_id ||
          `Teacher ${teacher.id}`;

        teacherSelect.appendChild(option);
      });

    } catch (error) {
      console.error(
        "Load Class Teacher teachers error:",
        error
      );

      teacherSelect.innerHTML =
        '<option value="">Unable to load teachers</option>';
    }
  }

  async function loadClasses() {
    if (!classSelect) {
      return;
    }

    const branchId =
      effectiveBranchId();

    classSelect.innerHTML =
      '<option value="">Loading classes...</option>';

    if (!branchId) {
      classSelect.innerHTML =
        '<option value="">Select branch first</option>';
      return;
    }

    try {
      const res = await fetch(
        `/api/classes?branch_id=${encodeURIComponent(
          branchId
        )}`,
        {
          headers: authHeaders()
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
          "Failed to load classes"
        );
      }

      const classes =
        Array.isArray(data)
          ? data
          : Array.isArray(data.classes)
            ? data.classes
            : Array.isArray(data.data)
              ? data.data
              : [];

      classSelect.innerHTML =
        '<option value="">Select class</option>';

      classes.forEach(cls => {
        const option =
          document.createElement("option");

        option.value =
          cls.class_name ||
          cls.name ||
          "";

        option.dataset.classId =
          String(cls.id || "");

        option.textContent =
          cls.class_name ||
          cls.name ||
          "";

        classSelect.appendChild(option);
      });

    } catch (error) {
      console.error(
        "Load Class Teacher classes error:",
        error
      );

      classSelect.innerHTML =
        '<option value="">Unable to load classes</option>';
    }
  }

  async function refreshClassTeacherForm() {
    await Promise.all([
      loadTeachers(),
      loadClasses()
    ]);
  }

  if (branchSelect) {
    branchSelect.addEventListener(
      "change",
      refreshClassTeacherForm
    );
  }

  /*
   * Wait briefly because existing page scripts populate
   * branch information after DOMContentLoaded.
   */
  setTimeout(async () => {
    await loadBranches();

    if (effectiveBranchId()) {
      await refreshClassTeacherForm();
    }
  }, 1000);

  form.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const branchId =
        effectiveBranchId();

      const teacherId =
        teacherSelect
          ? String(
              teacherSelect.value || ""
            ).trim()
          : "";

      const className =
        classSelect
          ? String(
              classSelect.value || ""
            ).trim()
          : "";

      const academicYear =
        academicYearInput
          ? String(
              academicYearInput.value || ""
            ).trim()
          : "";

      const missing = [];

      if (!branchId) {
        missing.push("Branch");
      }

      if (!teacherId) {
        missing.push("Teacher");
      }

      if (!className) {
        missing.push("Class");
      }

      if (missing.length) {
        alert(
          "Please select: " +
          missing.join(", ")
        );

        return;
      }

      const button =
        form.querySelector(
          'button[type="submit"]'
        );

      const originalText =
        button
          ? button.textContent
          : "";

      const isEditing =
        button?.dataset.editingClassTeacher ===
        "true";

      if (button) {
        button.disabled = true;
        button.textContent =
          "Saving Class Teacher...";
      }

      try {
        const selectedOption =
          classSelect.options[
            classSelect.selectedIndex
          ];

        const selectedClassId =
          Number(
            selectedOption?.dataset.classId || 0
          );

        if (
          !Number.isInteger(selectedClassId) ||
          selectedClassId <= 0
        ) {
          throw new Error(
            "Could not determine the selected class ID."
          );
        }

        const endpoint =
          "/api/teachers/assignments/class-teacher/update";

        const method = "PUT";

        const requestPayload = {
          teacher_id:
            Number(teacherId),
          branch_id:
            Number(branchId),
          class_id:
            selectedClassId,
          academic_year:
            academicYear ||
            "2026/2027"
        };

        const res = await fetch(
          endpoint,
          {
            method,
            headers: authHeaders(),
            body: JSON.stringify(
              requestPayload
            )
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
            "Failed to assign Class Teacher"
          );
        }

        if (
          !isEditing &&
          data.duplicate === true
        ) {
          alert(
            "This Class Teacher assignment already exists."
          );
        } else {
          alert(
            data.message ||
            (
              isEditing
                ? "Class Teacher assignment updated successfully."
                : "Class Teacher assigned successfully."
            )
          );
        }

        if (button) {
          delete button.dataset.editingClassTeacher;

          button.textContent =
            "Save Class Teacher Assignment";
        }

        if (classSelect) {
          classSelect.value = "";
        }

        if (
          typeof window.loadTeachers ===
          "function"
        ) {
          window.loadTeachers();
        }

      } catch (error) {
        console.error(
          "Class Teacher assignment error:",
          error
        );

        alert(error.message);

      } finally {
        if (button) {
          button.disabled = false;

          if (
            button.dataset.editingClassTeacher ===
            "true"
          ) {
            button.textContent =
              originalText ||
              "Update Class Teacher Assignment";
          } else {
            button.textContent =
              "Save Class Teacher Assignment";
          }
        }
      }
    }
  );
});
