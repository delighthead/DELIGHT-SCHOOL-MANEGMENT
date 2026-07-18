document.addEventListener("DOMContentLoaded", function () {
  const studentForm = document.getElementById("studentForm");
  const studentTableBody = document.getElementById("studentTableBody");
  const branchSelect = document.getElementById("student_branch_id");
  const classSelect = document.getElementById("class_name");

  const DEFAULT_CLASSES = [
    "Nursery 1",
    "Nursery 2",
    "Kindergarten 1",
    "Kindergarten 2",
    "Basic 1",
    "Basic 2",
    "Basic 3",
    "Basic 4",
    "Basic 5",
    "Basic 6",
    "Basic 7",
    "Basic 8",
    "Basic 9"
  ];

  let studentsCache = [];

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function isAdmin() {
    const user = getLoggedInUser();
    return user && user.role === "branch_admin";
  }

  function getAdminId() {
    const user = getLoggedInUser();
    return user ? user.branch_id : null;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  }

  function formatDate(dateValue) {
    if (!dateValue) return "";
    return String(dateValue).slice(0, 10);
  }

  async function loades() {
    if (!branchSelect) return;

    try {
      branchSelect.innerHTML = '<option value="">Loading branches...</option>';

      const response = await fetch("http://127.0.0.1:5000/api/branches", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      console.log("es API response:", data);

      if (!response.ok) {
        branchSelect.innerHTML = '<option value="">Failed to load branches</option>';
        return;
      }

      const branches = data.branches || [];

      branchSelect.innerHTML = '<option value=""></option>';

      branches.forEach(function (branch) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.branch_name || branch.name || "";
        branchSelect.appendChild(option);
      });

      if (isAdmin()) {
        branchSelect.value = getAdminId();
        
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const role = String(user.role || "").toLowerCase();

        if (role === "super_admin") {
          branchSelect.disabled = false;
        } else {
          branchSelect.disabled = true;
        }
    
      }
    } catch (error) {
      console.error(" loading error:", error);
      branchSelect.innerHTML = '<option value="">Cannot load branches</option>';
    }
  }

  async function loadStudents() {
    if (!studentTableBody) return;

    try {
      let url = "http://127.0.0.1:5000/api/students";

      if (isAdmin()) {
        url += `?branch_id=${getAdminId()}`;
      }

      const response = await fetch(url, {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      studentsCache = data.students || [];
      updateStudentCount(studentsCache.length, studentsCache.length);
      studentTableBody.innerHTML = "";

      if (!response.ok) {
        studentTableBody.innerHTML = `
          <tr>
            <td colspan="8">${data.message || "Failed to load students."}</td>
          </tr>
        `;
        return;
      }

      if (studentsCache.length === 0) {
        updateStudentCount(0, 0);
        studentTableBody.innerHTML = `
          <tr>
            <td colspan="8">No students found.</td>
          </tr>
        `;
        return;
      }

      studentsCache.forEach(function (student) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${student.admission_number || ""}</td>
          <td>${student.full_name || ""}</td>
          <td>${student.branch_name || ""}</td>
          <td>${student.class_name || ""}</td>
          <td>${student.mother_phone || ""}</td>
          <td>${student.father_phone || ""}</td>
          <td>${student.status || ""}</td>
          <td>
            <button type="button" class="small-btn success edit-student-btn" data-id="${student.id}">Edit</button>

            <button type="button" class="small-btn print-student-profile-btn" onclick="printStudentProfileFromButton(this)"
              data-student="${encodeURIComponent(JSON.stringify(student))}">
              Print Profile
            </button>
          </td>
        `;

        studentTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      studentTableBody.innerHTML = `
        <tr>
          <td colspan="8">Cannot connect to backend.</td>
        </tr>
      `;
    }
  }

  async function loadClasses() {
    if (!classSelect) return;

    const oldValue = classSelect.value;
    classSelect.innerHTML = '<option value="">Loading classes...</option>';

    function fillClassOptions(classNames) {
      classSelect.innerHTML = '<option value="">Select class</option>';

      classNames.forEach(function (name) {
        const className = String(name || "").trim();
        if (!className) return;

        const option = document.createElement("option");
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
      });

      if (oldValue) {
        classSelect.value = oldValue;
      }
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/classes", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load classes");
      }

      const classes = Array.isArray(data.classes) ? data.classes : [];

      const classNames = classes
        .map(function (cls) {
          return cls.class_name || cls.name || "";
        })
        .filter(Boolean);

      if (classNames.length > 0) {
        fillClassOptions(classNames);
      } else {
        fillClassOptions(DEFAULT_CLASSES);
      }
    } catch (error) {
      console.error("Class loading error:", error);
      fillClassOptions(DEFAULT_CLASSES);
    }
  }

  function updateStudentCount(visibleCount, totalCount) {
    const countText =
      document.getElementById("studentCountText") ||
      document.getElementById("student_count_text") ||
      document.querySelector("#studentTableCount");

    if (countText) {
      countText.textContent = `Showing ${visibleCount} out of ${totalCount} students`;
    }
  }

  function getStudentById(id) {
    return studentsCache.find(s => Number(s.id) === Number(id));
  }

  document.addEventListener("click", function (event) {
    const editBtn = event.target.closest(".edit-student-btn");
    if (!editBtn) return;

    const student = getStudentById(editBtn.dataset.id);
    if (!student) return;

    if (branchSelect && !branchSelect.disabled) {
      branchSelect.value = student.branch_id || "";
    }

    setValue("student_id", student.student_id || student.admission_number);
    setValue("admission_number", student.admission_number);
    setValue("full_name", student.full_name);
    setValue("sex", student.sex);
    setValue("date_of_birth", formatDate(student.date_of_birth));
    setValue("place_of_birth", student.place_of_birth);
    setValue("nationality", student.nationality);
    setValue("language_spoken", student.language_spoken);
    setValue("class_name", student.class_name);
    setValue("mother_name", student.mother_name);
    setValue("mother_ghana_card", student.mother_ghana_card);
    setValue("mother_phone", student.mother_phone);
    setValue("father_name", student.father_name);
    setValue("father_ghana_card", student.father_ghana_card);
    setValue("father_phone", student.father_phone);
    setValue("student_status", student.status || "active");

    localStorage.setItem("editing_student_id", student.id);

    const submitBtn = document.querySelector("#studentForm button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Update Student";

    studentForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  if (studentForm) {
    studentForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const editingStudentId = localStorage.getItem("editing_student_id");

      const formData = new FormData();

      
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = String(user.role || "").toLowerCase();

    if (role === "super_admin") {
      formData.append("branch_id", getValue("student_branch_id"));
    } else {
      formData.append("branch_id", user.branch_id || getValue("student_branch_id"));
    }
    
      formData.append("student_id", getValue("student_id") || getValue("admission_number"));
      formData.append("admission_number", getValue("admission_number"));
      formData.append("full_name", getValue("full_name"));
      formData.append("sex", getValue("sex"));
      formData.append("date_of_birth", getValue("date_of_birth"));
      formData.append("place_of_birth", getValue("place_of_birth"));
      formData.append("nationality", getValue("nationality"));
      formData.append("language_spoken", getValue("language_spoken"));
      formData.append("class_name", getValue("class_name"));
      formData.append("mother_name", getValue("mother_name"));
      formData.append("mother_ghana_card", getValue("mother_ghana_card"));
      formData.append("mother_phone", getValue("mother_phone"));
      formData.append("father_name", getValue("father_name"));
      formData.append("father_ghana_card", getValue("father_ghana_card"));
      formData.append("father_phone", getValue("father_phone"));
      formData.append("status", getValue("student_status") || "active");

      const pictureInput = document.getElementById("student_profile_picture");
      if (pictureInput && pictureInput.files.length > 0) {
        formData.append("profile_picture", pictureInput.files[0]);
      }

      try {
        const url = editingStudentId
          ? `http://127.0.0.1:5000/api/students/${editingStudentId}`
          : "http://127.0.0.1:5000/api/students";

        const response = await fetch(url, {
          method: editingStudentId ? "PUT" : "POST",
          headers: getAuthOnlyHeaders(),
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to save student.");
          return;
        }

        alert(editingStudentId ? "Student updated successfully." : "Student added successfully.");

        localStorage.removeItem("editing_student_id");
        studentForm.reset();

        const submitBtn = document.querySelector("#studentForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Add Student";

        await loades();
        await loadStudents();
      } catch (error) {
        console.error(error);
        alert("Cannot connect to backend.");
      }
    });
  }

  async function start() {
    await loades();
    await loadClasses();
    await loadStudents();
  }

  start();
});

// Force branch dropdown fix
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(async function () {
    const branchSelect = document.getElementById("student_branch_id");
    if (!branchSelect) return;

    if (branchSelect.options.length > 1 && branchSelect.value !== "") return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://127.0.0.1:5000/api/branches", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();
      const branches = data.branches || [];

      branchSelect.innerHTML = '<option value=""></option>';

      branches.forEach(function (branch) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.branch_name;
        branchSelect.appendChild(option);
      });

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "branch_admin") {
        branchSelect.value = user.branch_id;
        
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const role = String(user.role || "").toLowerCase();

        if (role === "super_admin") {
          branchSelect.disabled = false;
        } else {
          branchSelect.disabled = true;
        }
    
      }
    } catch (error) {
      console.error("Force branch load failed:", error);

      branchSelect.innerHTML = `
        <option value="">Select branch</option>
        <option value="4">Kotobabi</option>
        <option value="5">Ofankor</option>
      `;
    }
  }, 800);
});


// Direct Print Student Profile button function
window.printStudentProfileFromButton = async function (button) {
  try {
    const student = JSON.parse(decodeURIComponent(button.dataset.student));

    const settingsResponse = await fetch("http://127.0.0.1:5000/api/settings");
    const settingsData = await settingsResponse.json();
    const settings = settingsData.settings || {};

    const logo = settings.school_logo
      ? `<img src="http://127.0.0.1:5000${settings.school_logo}" style="width:75px;height:75px;object-fit:contain;">`
      : "";

    const win = window.open("", "_blank");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Profile</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }

          body {
            font-family: Arial, sans-serif;
            color: #222;
            font-size: 13px;
            margin: 0;
            padding: 0;
          }

          .print-btn {
            margin-bottom: 10px;
            padding: 8px 14px;
            background: #111827;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }

          .profile {
            border: 2px solid #111;
            padding: 18px;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #111;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }

          .header h2 {
            margin: 4px 0;
            font-size: 22px;
          }

          .header p {
            margin: 2px 0;
          }

          .title {
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            margin: 12px 0;
            text-decoration: underline;
          }

          .section-title {
            margin-top: 18px;
            margin-bottom: 8px;
            font-size: 15px;
            font-weight: bold;
            background: #f0f0f0;
            padding: 6px;
            border: 1px solid #ccc;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 25px;
          }

          .item {
            border-bottom: 1px dotted #777;
            padding: 5px 0;
          }

          .signatures {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 40px;
            text-align: center;
          }

          .line {
            border-top: 1px solid #333;
            padding-top: 5px;
          }

          @media print {
            .print-btn { display: none; }
          }
        </style>
      </head>

      <body>
        <button class="print-btn" onclick="window.print()">Print Student Profile</button>

        <div class="profile">
          <div class="header">
            ${logo}
            <h2>${settings.school_name || "Delight International School"}</h2>
            <p>${settings.school_motto || ""}</p>
            <p>${settings.school_address || ""}</p>
            <p>${settings.school_phone || ""} ${settings.school_email ? " | " + settings.school_email : ""}</p>
          </div>

          <div class="title">STUDENT ADMISSION PROFILE</div>

          <div class="section-title">Student Information</div>
          <div class="grid">
            <div class="item"><strong>Admission No.:</strong> ${student.admission_number || ""}</div>
            <div class="item"><strong>Full Name:</strong> ${student.full_name || ""}</div>
            <div class="item"><strong>:</strong> ${student.branch_name || ""}</div>
            <div class="item"><strong>Class:</strong> ${student.class_name || ""}</div>
            <div class="item"><strong>Gender:</strong> ${student.sex || student.gender || ""}</div>
            <div class="item"><strong>Date of Birth:</strong> ${student.date_of_birth ? String(student.date_of_birth).slice(0, 10) : ""}</div>
            <div class="item"><strong>Place of Birth:</strong> ${student.place_of_birth || ""}</div>
            <div class="item"><strong>Nationality:</strong> ${student.nationality || ""}</div>
            <div class="item"><strong>Language Spoken:</strong> ${student.language_spoken || ""}</div>
            <div class="item"><strong>Status:</strong> ${student.status || ""}</div>
          </div>

          <div class="section-title">Parent / Guardian Information</div>
          <div class="grid">
            <div class="item"><strong>Mother Name:</strong> ${student.mother_name || ""}</div>
            <div class="item"><strong>Mother Phone:</strong> ${student.mother_phone || ""}</div>
            <div class="item"><strong>Mother Ghana Card:</strong> ${student.mother_ghana_card || ""}</div>
            <div class="item"><strong>Father Name:</strong> ${student.father_name || ""}</div>
            <div class="item"><strong>Father Phone:</strong> ${student.father_phone || ""}</div>
            <div class="item"><strong>Father Ghana Card:</strong> ${student.father_ghana_card || ""}</div>
          </div>

          <div class="signatures">
            <div><div class="line">Parent / Guardian Signature</div></div>
            <div><div class="line">School Administrator Signature</div></div>
          </div>
        </div>
      </body>
      </html>
    `);

    win.document.close();
  } catch (error) {
    console.error(error);
    alert("Could not open student profile.");
  }
};


