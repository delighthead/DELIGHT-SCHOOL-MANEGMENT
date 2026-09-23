document.addEventListener("DOMContentLoaded", function () {
  const API = "";

  const teacherForm = document.getElementById("teacherForm");
  const assignForm = document.getElementById("teacherAssignForm");
  const teacherTableBody = document.getElementById("teacherTableBody");

  const teacherBranch = document.getElementById("teacher_branch_id");
  const assignBranch = document.getElementById("assign_branch_id");
  const assignTeacher = document.getElementById("assign_teacher_id");
  const assignClass = document.getElementById("assign_class_id");
  const assignSubject = document.getElementById("assign_subject");

  let editingTeacherId = null;
  let isSavingTeacher = false;

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function getRole() {
    return String(getUser().role || "").toLowerCase();
  }

  function isSuperAdmin() {
    return getRole() === "super_admin";
  }

  function canManageTeachers() {
    return ["super_admin", "admin", "branch_admin", "teacher_admin"].includes(getRole());
  }

  function authHeaders(json = false) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
  }

  function isBranchAdmin() {
    const role = getRole();
    return role === "branch_admin" || role === "teacher_admin";
  }

  function getBranchId() {
    return getUser().branch_id || "";
  }

  function addCacheBust(url, forceRefresh) {
    if (!forceRefresh) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}_ts=${Date.now()}`;
  }

  function pickArray(data, key) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  function setOptions(select, items, placeholder, valueKeys, textKeys) {
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;

    items.forEach(item => {
      const option = document.createElement("option");

      let value = "";
      for (const key of valueKeys) {
        if (item[key] !== undefined && item[key] !== null) {
          value = item[key];
          break;
        }
      }

      let text = "";
      for (const key of textKeys) {
        if (item[key]) {
          text = item[key];
          break;
        }
      }

      option.value = value;
      option.textContent = text || value || "Item";
      select.appendChild(option);
    });
  }

  async function loadBranches() {
    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: authHeaders()
      });
      const data = await res.json();
      const branches = pickArray(data, "branches");

      setOptions(
        teacherBranch,
        branches,
        "Select branch",
        ["id", "branch_id"],
        ["branch_name", "name", "location"]
      );

      setOptions(
        assignBranch,
        branches,
        "Select branch",
        ["id", "branch_id"],
        ["branch_name", "name", "location"]
      );

      if (isBranchAdmin()) {
        if (teacherBranch) {
          teacherBranch.value = getBranchId();
          teacherBranch.disabled = true;
        }

        if (assignBranch) {
          assignBranch.value = getBranchId();
          assignBranch.disabled = true;
        }
      } else {
        if (teacherBranch) teacherBranch.disabled = false;
        if (assignBranch) assignBranch.disabled = false;
      }
    } catch (error) {
      console.error("Branches load error:", error);
    }
  }

  async function loadClasses() {
    if (!assignClass) return;

    assignClass.innerHTML = `<option value="">Loading classes...</option>`;

    try {
      let url = `${API}/api/classes`;

      if (isBranchAdmin() && getBranchId()) {
        url += `?branch_id=${getBranchId()}`;
      }

      const res = await fetch(url, {
        headers: authHeaders()
      });

      const data = await res.json();
      const classes = pickArray(data, "classes");

      setOptions(
        assignClass,
        classes,
        "Select class",
        ["id", "class_id"],
        ["class_name", "name"]
      );
    } catch (error) {
      console.error("Classes load error:", error);
      assignClass.innerHTML = `<option value="">Failed to load classes</option>`;
    }
  }

  async function loadTeachers(forceRefresh = false) {
    if (!teacherTableBody) return;

    teacherTableBody.innerHTML = `<tr><td colspan="10">Loading teachers...</td></tr>`;

    try {
      let url = `${API}/api/teachers`;

      if (isBranchAdmin() && getBranchId()) {
        url += `?branch_id=${getBranchId()}`;
      }

      url = addCacheBust(url, forceRefresh);

      const res = await fetch(url, {
        headers: {
          ...authHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        },
        cache: forceRefresh ? "reload" : "no-store"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teachers");
      }

      const teachers = pickArray(data, "teachers");

      if (teachers.length === 0) {
        teacherTableBody.innerHTML = `<tr><td colspan="10">No teachers found.</td></tr>`;
        return teachers;
      }

      teacherTableBody.innerHTML = "";

      teachers.forEach(teacher => {
        const row = document.createElement("tr");
        const actionButtons = [];

        actionButtons.push(`
          <button type="button" class="small-btn success edit-teacher-btn"
            style="background:#16a34a;color:#ffffff;opacity:1;border:none;cursor:pointer;"
            data-id="${teacher.id || ""}"
            data-record="${encodeURIComponent(JSON.stringify(teacher))}">
            Edit
          </button>
        `);

        if (canManageTeachers()) {
          actionButtons.push(`
            <button type="button" class="small-btn danger-btn disable-teacher-btn"
              data-id="${teacher.id || ""}">
              Disable
            </button>
          `);
        }

        if (isSuperAdmin()) {
          actionButtons.push(`
            <button type="button" class="small-btn warning make-teacher-admin-btn"
              data-id="${teacher.id || ""}">
              Make Teacher Admin
            </button>
          `);
        } else {
          actionButtons.push(`
            <small style="display:inline-block; margin-left:4px; color:#6b7280; font-weight:600;">
              Teacher Admin: Super Admin only
            </small>
          `);
        }

        row.innerHTML = `
          <td>${teacher.branch_name || teacher.branch || ""}</td>
          <td>${teacher.teacher_id || ""}</td>
          <td>${teacher.full_name || teacher.name || ""}</td>
          <td>${teacher.ghana_card_number || teacher.ghana_card || ""}</td>
          <td>${teacher.phone || ""}</td>
          <td>${teacher.email || ""}</td>
          <td>${teacher.assigned_classes || ""}</td>
          <td>${teacher.assigned_subjects || ""}</td>
          <td>${teacher.status || ""}</td>
          <td>${actionButtons.join(" ")}</td>
        `;

        teacherTableBody.appendChild(row);
      });

      return teachers;
    } catch (error) {
      console.error("Teachers load error:", error);
      teacherTableBody.innerHTML = `<tr><td colspan="10">${error.message}</td></tr>`;

      if (assignTeacher) {
        assignTeacher.innerHTML = `<option value="">Failed to load teachers</option>`;
      }

      return [];
    }
  }

  async function loadAssignTeachers(selectedBranchId = "") {
    if (!assignTeacher) return;

    const selectedBranch = String(selectedBranchId || (assignBranch ? assignBranch.value : "") || "");
    const scopedBranch = String(getBranchId() || "");
    const branchId = selectedBranch || (isBranchAdmin() ? scopedBranch : "");

    if (!branchId) {
      assignTeacher.innerHTML = `<option value="">Select branch first</option>`;
      return;
    }

    assignTeacher.innerHTML = `<option value="">Loading teachers...</option>`;

    try {
      let url = `${API}/api/teachers`;

      if (branchId) {
        url += `?branch_id=${encodeURIComponent(branchId)}`;
      }

      url = addCacheBust(url, true);

      const res = await fetch(url, {
        headers: {
          ...authHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        },
        cache: "no-store"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teachers");
      }

      const teachers = pickArray(data, "teachers");
      const filteredTeachers = teachers.filter(item => {
        if (!branchId) return true;
        return String(item.branch_id || "") === String(branchId);
      });

      setOptions(
        assignTeacher,
        filteredTeachers,
        "Select teacher",
        ["id", "teacher_id"],
        ["full_name", "name", "teacher_name"]
      );

      if (filteredTeachers.length === 0) {
        assignTeacher.innerHTML = `<option value="">No teachers found for selected branch</option>`;
      }
    } catch (error) {
      console.error("Assign teachers load error:", error);
      assignTeacher.innerHTML = `<option value="">Failed to load teachers</option>`;
    }
  }

  async function loadSubjects() {
    if (!assignSubject) return;

    assignSubject.innerHTML = `<option value="">Loading subjects...</option>`;

    const possibleUrls = [
      `${API}/api/subjects`,
      `${API}/api/settings/subjects`
    ];

    for (const url of possibleUrls) {
      try {
        const res = await fetch(url, {
          headers: authHeaders()
        });

        const data = await res.json();
        const subjects = pickArray(data, "subjects");

        if (res.ok && subjects.length > 0) {
          setOptions(
            assignSubject,
            subjects,
            "Select subject",
            ["id", "subject_id"],
            ["subject_name", "name"]
          );
          return;
        }
      } catch (e) {}
    }

    assignSubject.innerHTML = `
      <option value="">Select subject</option>
      <option value="ENGLISH">ENGLISH</option>
      <option value="MATHEMATICS">MATHEMATICS</option>
      <option value="INTEGRATED SCIENCE">INTEGRATED SCIENCE</option>
      <option value="SOCIAL STUDIES">SOCIAL STUDIES</option>
      <option value="R.M.E">R.M.E</option>
      <option value="CAREER TECHNOLOGY">CAREER TECHNOLOGY</option>
      <option value="COMPUTING">COMPUTING</option>
      <option value="FRENCH">FRENCH</option>
      <option value="GHANAIAN LANGUAGE">GHANAIAN LANGUAGE</option>
      <option value="CREATIVE ARTS">CREATIVE ARTS</option>
      <option value="GHANA HISTORY">GHANA HISTORY</option>
      <option value="PHYSICAL EDUCATION">PHYSICAL EDUCATION</option>
      <option value="OUR WORLD OUR PEOPLE">OUR WORLD OUR PEOPLE</option>
    `;
  }

  if (teacherForm) {
    teacherForm.onsubmit = async function (event) {
      event.preventDefault();

      if (isSavingTeacher) {
        return;
      }

      const branchId = isBranchAdmin()
        ? getBranchId()
        : (document.getElementById("teacher_branch_id")?.value || "");

      const payload = {
        branch_id: branchId,
        teacher_id: document.getElementById("teacher_id")?.value.trim() || "",
        full_name: document.getElementById("teacher_full_name")?.value.trim() || "",
        gender: document.getElementById("teacher_gender")?.value || "",
        date_of_birth: document.getElementById("teacher_date_of_birth")?.value || "",
        ghana_card_number: document.getElementById("teacher_ghana_card_number")?.value.trim() || "",
        phone: document.getElementById("teacher_phone")?.value.trim() || "",
        email: document.getElementById("teacher_email")?.value.trim() || "",
        address: document.getElementById("teacher_address")?.value.trim() || "",
        date_employed: document.getElementById("teacher_date_employed")?.value || "",
        qualification:
          document.getElementById("teacher_qualification")?.value === "Other"
            ? document.getElementById("teacher_other_qualification")?.value.trim() || ""
            : document.getElementById("teacher_qualification")?.value || "",
        status: String(document.getElementById("teacher_status")?.value || "active").toLowerCase()
      };

      if (!payload.branch_id || !payload.teacher_id || !payload.full_name || !payload.ghana_card_number || !payload.phone) {
        alert("Please fill Branch, Teacher ID, Full Name, Ghana Card, and Phone Number.");
        return;
      }

      if (!isBranchAdmin() && !payload.branch_id) {
        alert("Please select a branch before adding the teacher.");
        return;
      }

      isSavingTeacher = true;
      const submitBtn = document.querySelector("#teacherForm button[type='submit']");
      const previousBtnText = submitBtn ? submitBtn.textContent : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
      }

      try {
        const isEditing = editingTeacherId !== null && editingTeacherId !== undefined && editingTeacherId !== "";

        const url = isEditing
          ? `${API}/api/teachers/${editingTeacherId}`
          : `${API}/api/teachers`;

        const method = isEditing ? "PUT" : "POST";

        const res = await fetch(url, {
          method: method,
          headers: authHeaders(true),
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to save teacher.");
          return;
        }

        alert(data.message || (isEditing ? "Teacher updated successfully." : "Teacher added successfully."));

        const expectedTeacherId = String(payload.teacher_id || "").trim().toUpperCase();

        teacherForm.reset();
        editingTeacherId = null;

        if (submitBtn) submitBtn.textContent = "Add Teacher";

        await loadBranches();
        let teachers = await loadTeachers(true);
        await loadAssignTeachers(assignBranch ? assignBranch.value : "");

        // If live caching/replication delays visibility, retry a few short refreshes.
        if (!isEditing && expectedTeacherId) {
          let found = Array.isArray(teachers) && teachers.some(item => {
            return String(item.teacher_id || "").trim().toUpperCase() === expectedTeacherId;
          });

          if (!found) {
            for (let attempt = 0; attempt < 2; attempt += 1) {
              await new Promise(resolve => setTimeout(resolve, 1200));
              teachers = await loadTeachers(true);
              await loadAssignTeachers(assignBranch ? assignBranch.value : "");
              found = Array.isArray(teachers) && teachers.some(item => {
                return String(item.teacher_id || "").trim().toUpperCase() === expectedTeacherId;
              });
              if (found) break;
            }
          }

          if (!found) {
            alert("Teacher was saved, but list refresh is delayed. Please refresh once if still not visible.");
          }
        }
      } catch (error) {
        console.error("Teacher save error:", error);
        alert("Failed to save teacher.");
      } finally {
        isSavingTeacher = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          if (editingTeacherId) {
            submitBtn.textContent = "Update Teacher";
          } else if (previousBtnText && submitBtn.textContent === "Saving...") {
            submitBtn.textContent = "Add Teacher";
          }
        }
      }
    };
  }

  // Assign Teacher submit is handled by js/assign-teacher-submit-final.js

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  }

  document.addEventListener("click", async function (event) {
    const editBtn = event.target.closest(".edit-teacher-btn");

    if (editBtn) {
      try {
        const teacher = JSON.parse(decodeURIComponent(editBtn.dataset.record || "{}"));

        editingTeacherId = teacher.id;

        setValue("teacher_branch_id", teacher.branch_id);
        setValue("teacher_id", teacher.teacher_id);
        setValue("teacher_full_name", teacher.full_name || teacher.name);
        setValue("teacher_gender", teacher.gender || "");
        setValue(
          "teacher_date_of_birth",
          teacher.date_of_birth ? String(teacher.date_of_birth).slice(0, 10) : ""
        );
        setValue("teacher_ghana_card_number", teacher.ghana_card_number || teacher.ghana_card);
        setValue("teacher_phone", teacher.phone);
        setValue("teacher_email", teacher.email);
        setValue("teacher_address", teacher.address);
        setValue(
          "teacher_date_employed",
          teacher.date_employed ? String(teacher.date_employed).slice(0, 10) : ""
        );

        const qualificationSelect = document.getElementById("teacher_qualification");
        const otherQualificationWrap = document.getElementById("teacher_other_qualification_wrap");
        const otherQualificationInput = document.getElementById("teacher_other_qualification");

        const qualificationOptions = qualificationSelect
          ? Array.from(qualificationSelect.options).map(option => option.value)
          : [];

        if (
          teacher.qualification &&
          qualificationSelect &&
          !qualificationOptions.includes(teacher.qualification)
        ) {
          qualificationSelect.value = "Other";

          if (otherQualificationInput) {
            otherQualificationInput.value = teacher.qualification;
          }

          if (otherQualificationWrap) {
            otherQualificationWrap.style.display = "block";
          }
        } else {
          setValue("teacher_qualification", teacher.qualification || "");

          if (otherQualificationInput) {
            otherQualificationInput.value = "";
          }

          if (otherQualificationWrap) {
            otherQualificationWrap.style.display = "none";
          }
        }

        setValue("teacher_status", teacher.status || "active");

        const submitBtn = document.querySelector("#teacherForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Update Teacher";

        if (teacherForm) {
          teacherForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch (error) {
        console.error("Could not load teacher for editing:", error);
        alert("Could not load teacher for editing.");
      }
    }

    const disableBtn = event.target.closest(".disable-teacher-btn");

    if (disableBtn) {
      const confirmDisable = confirm("Disable this teacher account? The teacher will not be deleted.");

      if (!confirmDisable) return;

      try {
        const res = await fetch(`${API}/api/teachers/${disableBtn.dataset.id}/disable`, {
          method: "PUT",
          headers: authHeaders(true)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to disable teacher.");
          return;
        }

        alert(data.message || "Teacher disabled successfully.");
        await loadTeachers();
      } catch (error) {
        console.error("Teacher disable error:", error);
        alert("Failed to disable teacher.");
      }
    }
  });

  const qualificationSelect = document.getElementById("teacher_qualification");
  const otherQualificationWrap = document.getElementById("teacher_other_qualification_wrap");
  const otherQualificationInput = document.getElementById("teacher_other_qualification");

  if (qualificationSelect) {
    qualificationSelect.addEventListener("change", function () {
      const isOther = qualificationSelect.value === "Other";

      if (otherQualificationWrap) {
        otherQualificationWrap.style.display = isOther ? "block" : "none";
      }

      if (!isOther && otherQualificationInput) {
        otherQualificationInput.value = "";
      }
    });
  }

  async function start() {
    await loadBranches();
    await loadClasses();
    await loadTeachers();
    await loadAssignTeachers(assignBranch ? assignBranch.value : "");
    await loadSubjects();
  }

  if (assignBranch) {
    assignBranch.addEventListener("change", function () {
      loadAssignTeachers(assignBranch.value);
    });
  }

  start();
});


/* ==========================================================
   MANAGE TEACHER ASSIGNMENTS
   Allows admin to edit/remove assigned class/subject records
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const API = "";
  const assignmentsTableBody = document.getElementById("teacherAssignmentsTableBody");

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders(json = false) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
    return headers;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadTeacherAssignments() {
    if (!assignmentsTableBody) return;

    assignmentsTableBody.innerHTML =
      `<tr><td colspan="7">Loading teacher assignments...</td></tr>`;

    try {
      const res = await fetch(`${API}/api/teachers/assignments?_ts=${Date.now()}`, {
        headers: authHeaders(),
        cache: "no-store"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teacher assignments");
      }

      const assignments = Array.isArray(data.assignments) ? data.assignments : [];

      if (assignments.length === 0) {
        assignmentsTableBody.innerHTML =
          `<tr><td colspan="7">No teacher assignments found.</td></tr>`;
        return;
      }

      assignmentsTableBody.innerHTML = assignments.map(item => {
        const encoded = encodeURIComponent(JSON.stringify(item));

        return `
          <tr>
            <td>${escapeHtml(item.branch_name || "")}</td>
            <td>${escapeHtml(item.teacher_name || item.teacher_code || "")}</td>
            <td>${escapeHtml(item.class_name || "")}</td>
            <td>${escapeHtml(item.subject || "")}</td>
            <td>${escapeHtml(item.role || "")}</td>
            <td>${escapeHtml(item.academic_year || "")}</td>
            <td>
              <button type="button"
                class="small-btn success edit-assignment-btn"
                data-record="${encoded}">
                Edit
              </button>

              <button type="button"
                class="small-btn danger-btn delete-assignment-btn"
                data-id="${escapeHtml(item.id)}">
                Remove
              </button>
            </td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      console.error("Load teacher assignments error:", error);
      assignmentsTableBody.innerHTML =
        `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  async function updateTeacherAssignment(record) {
    const newSubject = prompt("Change subject:", record.subject || "");
    if (newSubject === null) return;

    const newRole = prompt("Change role:", record.role || "Subject Teacher");
    if (newRole === null) return;

    const newYear = prompt("Change academic year:", record.academic_year || "2025/2026");
    if (newYear === null) return;

    try {
      const res = await fetch(`${API}/api/teachers/assignments/${record.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({
          subject: newSubject.trim(),
          role: newRole.trim(),
          academic_year: newYear.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update assignment");
      }

      alert(data.message || "Assignment updated successfully.");
      await loadTeacherAssignments();

      if (typeof window.location !== "undefined") {
        // Also refresh teacher list by clicking page reload later if needed
      }
    } catch (error) {
      console.error("Update assignment error:", error);
      alert(error.message);
    }
  }

  async function deleteTeacherAssignment(id) {
    if (!confirm("Remove this teacher assignment? This will make it inactive.")) {
      return;
    }

    try {
      const res = await fetch(`${API}/api/teachers/assignments/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to remove assignment");
      }

      alert(data.message || "Assignment removed successfully.");
      await loadTeacherAssignments();
    } catch (error) {
      console.error("Delete assignment error:", error);
      alert(error.message);
    }
  }

  document.addEventListener("click", function (event) {
    const editBtn = event.target.closest(".edit-assignment-btn");
    const deleteBtn = event.target.closest(".delete-assignment-btn");

    if (editBtn) {
      const record = JSON.parse(decodeURIComponent(editBtn.dataset.record || "{}"));
      updateTeacherAssignment(record);
    }

    if (deleteBtn) {
      deleteTeacherAssignment(deleteBtn.dataset.id);
    }
  });

  loadTeacherAssignments();

  const assignForm = document.getElementById("teacherAssignForm");
  if (assignForm) {
    assignForm.addEventListener("submit", function () {
      setTimeout(loadTeacherAssignments, 1200);
    });
  }

  window.loadTeacherAssignments = loadTeacherAssignments;
});


/* ==========================================================
   EDIT ASSIGNMENT USING FORM CHECKBOXES - NO PROMPT POPUP
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  let editingAssignmentId = null;

  function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value || "";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function checkSubject(subject) {
    document
      .querySelectorAll('input[name="assign_subjects"]')
      .forEach(input => {
        input.checked =
          String(input.value || "").trim().toUpperCase() ===
          String(subject || "").trim().toUpperCase();
      });
  }

  function checkClass(classId) {
    const container = document.getElementById("assign_class_checkboxes");
    if (!container) return;

    container.querySelectorAll("input[type='checkbox']").forEach(input => {
      input.checked = String(input.value) === String(classId);
    });
  }

  document.addEventListener("click", function (event) {
    const editBtn = event.target.closest(".edit-assignment-btn");
    if (!editBtn) return;

    const record = JSON.parse(
      decodeURIComponent(editBtn.dataset.record || "{}")
    );

    editingAssignmentId = record.id;

    setSelectValue("assign_branch_id", record.branch_id);

    setTimeout(() => {
      setSelectValue("assign_teacher_id", record.teacher_id);
      checkClass(record.class_id);
      checkSubject(record.subject);

      const role = document.getElementById("assign_role");
      const year = document.getElementById("assign_academic_year");
      const submitBtn = document.querySelector("#teacherAssignForm button[type='submit']");

      if (role) role.value = record.role || "Subject Teacher";
      if (year) year.value = record.academic_year || "";

      if (submitBtn) {
        submitBtn.textContent = "Update Assignment";
        submitBtn.dataset.editingAssignmentId = editingAssignmentId;
      }

      document
        .getElementById("teacherAssignForm")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 900);
  });

  const assignForm = document.getElementById("teacherAssignForm");

  if (assignForm) {
    assignForm.addEventListener("submit", async function (event) {
      const submitBtn = document.querySelector("#teacherAssignForm button[type='submit']");
      const editId = submitBtn?.dataset.editingAssignmentId;

      if (!editId) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const selectedSubject = Array.from(
        document.querySelectorAll('input[name="assign_subjects"]:checked')
      ).map(input => input.value)[0];

      const role = document.getElementById("assign_role")?.value || "Subject Teacher";
      const academicYear = document.getElementById("assign_academic_year")?.value || "2025/2026";

      if (!selectedSubject) {
        alert("Please select a subject.");
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Updating...";

        const res = await fetch(`/api/teachers/assignments/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          },
          body: JSON.stringify({
            subject: selectedSubject,
            role,
            academic_year: academicYear
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to update assignment");
        }

        alert(data.message || "Assignment updated successfully.");

        submitBtn.textContent = "Assign Teacher";
        delete submitBtn.dataset.editingAssignmentId;

        assignForm.reset();

        if (typeof window.loadTeacherAssignments === "function") {
          await window.loadTeacherAssignments();
        }

        location.reload();
      } catch (error) {
        alert(error.message);
      } finally {
        submitBtn.disabled = false;
      }
    }, true);
  }
});


/* ==========================================================
   SHOW ENTRIES CONTROL FOR MANAGE TEACHER ASSIGNMENTS
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const tbody = document.getElementById("teacherAssignmentsTableBody");
  if (!tbody) return;

  const table = tbody.closest("table");
  if (!table) return;

  const tableWrapper = table.parentElement;
  if (!tableWrapper) return;

  if (document.getElementById("teacherAssignmentsShowEntries")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "submission-table-toolbar";
  toolbar.id = "teacherAssignmentsShowEntries";

  toolbar.innerHTML = `
    <label>
      Show
      <select id="teacherAssignmentsPageSize">
        <option value="5" selected>5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="all">All</option>
      </select>
      entries
    </label>
    <span id="teacherAssignmentsEntriesInfo">Showing entries</span>
  `;

  tableWrapper.parentNode.insertBefore(toolbar, tableWrapper);

  const pageSizeSelect = document.getElementById("teacherAssignmentsPageSize");
  const info = document.getElementById("teacherAssignmentsEntriesInfo");

  function applyLimit() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const dataRows = rows.filter(row => !row.textContent.toLowerCase().includes("loading"));

    if (dataRows.length === 0) {
      if (info) info.textContent = "Showing 0 entries";
      return;
    }

    const value = pageSizeSelect.value;
    const limit = value === "all" ? dataRows.length : Number(value);

    dataRows.forEach((row, index) => {
      row.style.display = index < limit ? "" : "none";
    });

    if (info) {
      info.textContent = `Showing ${Math.min(limit, dataRows.length)} of ${dataRows.length} entries`;
    }
  }

  pageSizeSelect.addEventListener("change", applyLimit);

  const observer = new MutationObserver(function () {
    setTimeout(applyLimit, 100);
  });

  observer.observe(tbody, {
    childList: true
  });

  setTimeout(applyLimit, 800);
});


/* ==========================================================
   GROUP MANAGE TEACHER ASSIGNMENTS VIEW
   Show one row per teacher/class/year/role with all subjects
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const tbody = document.getElementById("teacherAssignmentsTableBody");
  if (!tbody) return;

  function groupAssignmentRows() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (rows.length === 0) return;

    const normalRows = rows.filter(row => {
      const text = row.textContent.toLowerCase();
      return !text.includes("loading") && !text.includes("no teacher assignments");
    });

    if (normalRows.length === 0) return;

    const groups = new Map();

    normalRows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;

      const branch = cells[0].textContent.trim();
      const teacher = cells[1].textContent.trim();
      const className = cells[2].textContent.trim();
      const subject = cells[3].textContent.trim();
      const role = cells[4].textContent.trim();
      const year = cells[5].textContent.trim();

      const editBtn = row.querySelector(".edit-assignment-btn");
      const removeBtn = row.querySelector(".delete-assignment-btn");

      let record = {};
      try {
        record = JSON.parse(decodeURIComponent(editBtn?.dataset.record || "{}"));
      } catch (e) {}

      const key = [
        branch,
        teacher,
        className,
        role,
        year
      ].join("||");

      if (!groups.has(key)) {
        groups.set(key, {
          branch,
          teacher,
          className,
          role,
          year,
          subjects: [],
          ids: [],
          records: []
        });
      }

      const group = groups.get(key);

      if (subject && !group.subjects.includes(subject)) {
        group.subjects.push(subject);
      }

      if (record.id && !group.ids.includes(String(record.id))) {
        group.ids.push(String(record.id));
      }

      if (record.id) {
        group.records.push(record);
      }
    });

    if (groups.size === 0) return;

    tbody.innerHTML = "";

    Array.from(groups.values()).forEach(group => {
      // Use copies so firstRecord does not contain an array
      // that also contains firstRecord itself.
      const firstRecord = group.records[0]
        ? { ...group.records[0] }
        : {};

      firstRecord.group_subjects = [...group.subjects];
      firstRecord.group_assignment_ids = [...group.ids];
      firstRecord.group_records = group.records.map(record => ({
        ...record
      }));

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${group.branch}</td>
        <td>${group.teacher}</td>
        <td>${group.className}</td>
        <td>${group.subjects.join(", ")}</td>
        <td>${group.role}</td>
        <td>${group.year}</td>
        <td>
          <button type="button"
            class="small-btn success edit-assignment-btn"
            data-record="${encodeURIComponent(JSON.stringify(firstRecord))}">
            Edit
          </button>

          <button type="button"
            class="small-btn danger-btn delete-assignment-group-btn"
            data-ids="${group.ids.join(",")}">
            Remove
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  const observer = new MutationObserver(function () {
    clearTimeout(window.__groupTeacherAssignmentsTimer);
    window.__groupTeacherAssignmentsTimer = setTimeout(groupAssignmentRows, 150);
  });

  observer.observe(tbody, {
    childList: true
  });

  setTimeout(groupAssignmentRows, 1200);

  document.addEventListener("click", async function (event) {
    const btn = event.target.closest(".delete-assignment-group-btn");
    if (!btn) return;

    const ids = String(btn.dataset.ids || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    if (ids.length === 0) return;

    if (!confirm("Remove all subjects in this teacher assignment group?")) {
      return;
    }

    try {
      for (const id of ids) {
        const res = await fetch(`/api/teachers/assignments/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to remove assignment");
        }
      }

      alert("Teacher assignment group removed successfully.");

      if (typeof window.loadTeacherAssignments === "function") {
        await window.loadTeacherAssignments();
      } else {
        location.reload();
      }
    } catch (error) {
      alert(error.message);
    }
  });
});


/* ==========================================================
   FINAL GROUPED TEACHER ASSIGNMENTS WITH 5/10/20/ALL
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const tbody = document.getElementById("teacherAssignmentsTableBody");
  if (!tbody) return;

  let groupedAssignments = [];
  let pageSize = "5";

  function authHeaders(json = false) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    const token = localStorage.getItem("token") || "";
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function ensureToolbar() {
    const table = tbody.closest("table");
    const wrapper = table ? table.parentElement : null;
    if (!wrapper) return;

    let toolbar = document.getElementById("teacherAssignmentsShowEntries");

    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "submission-table-toolbar";
      toolbar.id = "teacherAssignmentsShowEntries";

      toolbar.innerHTML = `
        <label>
          Show
          <select id="teacherAssignmentsPageSize">
            <option value="5" selected>5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="all">All</option>
          </select>
          entries
        </label>
        <span id="teacherAssignmentsEntriesInfo">Showing 0 entries</span>
      `;

      wrapper.parentNode.insertBefore(toolbar, wrapper);
    }

    const select = document.getElementById("teacherAssignmentsPageSize");
    if (select && !select.dataset.bound) {
      select.dataset.bound = "yes";
      select.addEventListener("change", function () {
        pageSize = this.value;
        renderGroupedAssignments();
      });
    }
  }

  function groupAssignments(assignments) {
    const map = new Map();

    assignments.forEach(item => {
      const key = [
        item.branch_id,
        item.teacher_id,
        item.class_id,
        item.role || "",
        item.academic_year || ""
      ].join("||");

      if (!map.has(key)) {
        map.set(key, {
          branch_name: item.branch_name || "",
          teacher_name: item.teacher_name || item.teacher_code || "",
          class_name: item.class_name || "",
          role: item.role || "",
          academic_year: item.academic_year || "",
          subjects: [],
          ids: [],
          records: []
        });
      }

      const group = map.get(key);

      if (item.subject && !group.subjects.includes(item.subject)) {
        group.subjects.push(item.subject);
      }

      if (item.id && !group.ids.includes(String(item.id))) {
        group.ids.push(String(item.id));
      }

      group.records.push(item);
    });

    return Array.from(map.values());
  }

  function renderGroupedAssignments() {
    ensureToolbar();

    const info = document.getElementById("teacherAssignmentsEntriesInfo");
    const limit = pageSize === "all" ? groupedAssignments.length : Number(pageSize);
    const visibleItems = groupedAssignments.slice(0, limit);

    if (groupedAssignments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No teacher assignments found.</td></tr>`;
      if (info) info.textContent = "Showing 0 entries";
      return;
    }

    tbody.innerHTML = visibleItems.map(group => {
      // Use copies so firstRecord does not contain an array
      // that also contains firstRecord itself.
      const firstRecord = group.records[0]
        ? { ...group.records[0] }
        : {};

      firstRecord.group_subjects = [...group.subjects];
      firstRecord.group_assignment_ids = [...group.ids];
      firstRecord.group_records = group.records.map(record => ({
        ...record
      }));

      return `
        <tr>
          <td>${escapeHtml(group.branch_name)}</td>
          <td>${escapeHtml(group.teacher_name)}</td>
          <td>${escapeHtml(group.class_name)}</td>
          <td>${escapeHtml(group.subjects.join(", "))}</td>
          <td>${escapeHtml(group.role)}</td>
          <td>${escapeHtml(group.academic_year)}</td>
          <td>
            <button type="button"
              class="small-btn success edit-assignment-btn"
              data-record="${encodeURIComponent(JSON.stringify(firstRecord))}">
              Edit
            </button>

            <button type="button"
              class="small-btn danger-btn delete-assignment-group-final-btn"
              data-ids="${escapeHtml(group.ids.join(","))}">
              Remove
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (info) {
      info.textContent =
        `Showing ${visibleItems.length} of ${groupedAssignments.length} entries`;
    }
  }

  async function loadGroupedTeacherAssignmentsFinal() {
    ensureToolbar();

    tbody.innerHTML = `<tr><td colspan="7">Loading teacher assignments...</td></tr>`;

    try {
      const res = await fetch(`/api/teachers/assignments?_ts=${Date.now()}`, {
        headers: authHeaders(),
        cache: "no-store"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load teacher assignments.");
      }

      const assignments = Array.isArray(data.assignments) ? data.assignments : [];
      groupedAssignments = groupAssignments(assignments);

      renderGroupedAssignments();
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  document.addEventListener("click", async function (event) {
    const btn = event.target.closest(".delete-assignment-group-final-btn");
    if (!btn) return;

    const ids = String(btn.dataset.ids || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    if (ids.length === 0) return;

    if (!confirm("Remove this teacher assignment group?")) {
      return;
    }

    try {
      for (const id of ids) {
        const res = await fetch(`/api/teachers/assignments/${id}`, {
          method: "DELETE",
          headers: authHeaders()
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to remove assignment.");
        }
      }

      alert("Teacher assignment removed successfully.");
      await loadGroupedTeacherAssignmentsFinal();
    } catch (error) {
      alert(error.message);
    }
  });

  window.loadTeacherAssignments = loadGroupedTeacherAssignmentsFinal;

  setTimeout(loadGroupedTeacherAssignmentsFinal, 1000);
  setTimeout(loadGroupedTeacherAssignmentsFinal, 2500);
});
