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
        ghana_card_number: document.getElementById("teacher_ghana_card_number")?.value.trim() || "",
        phone: document.getElementById("teacher_phone")?.value.trim() || "",
        email: document.getElementById("teacher_email")?.value.trim() || "",
        address: document.getElementById("teacher_address")?.value.trim() || "",
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
        setValue("teacher_ghana_card_number", teacher.ghana_card_number || teacher.ghana_card);
        setValue("teacher_phone", teacher.phone);
        setValue("teacher_email", teacher.email);
        setValue("teacher_address", teacher.address);
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
