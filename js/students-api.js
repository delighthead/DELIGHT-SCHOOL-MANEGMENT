
async function loadNextAdmissionNumber(branchId) {
  const admissionInput = document.getElementById("admission_number");

  if (!admissionInput) return;

  // Existing students keep their admission number while editing.
  if (localStorage.getItem("editing_student_id")) {
    admissionInput.readOnly = false;
    return;
  }

  // New students always use an automatically generated number.
  admissionInput.readOnly = true;

  if (!branchId) {
    admissionInput.value = "";
    admissionInput.placeholder = "Select branch to generate";
    return;
  }

  admissionInput.value = "";
  admissionInput.placeholder = "Generating admission number...";

  try {
    const response = await fetch(
      `/api/students/next-admission-number?branch_id=${encodeURIComponent(branchId)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to generate admission number"
      );
    }

    // Do not overwrite an existing student if Edit was opened
    // while the request was still running.
    if (localStorage.getItem("editing_student_id")) {
      admissionInput.readOnly = false;
      return;
    }

    admissionInput.value = data.admission_number || "";
    admissionInput.placeholder = "Generated automatically";
  } catch (error) {
    console.error("Admission number generation error:", error);

    admissionInput.value = "";
    admissionInput.placeholder = "Could not generate admission number";

    alert(
      error.message +
      ". Please try selecting the branch again."
    );
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const studentForm = document.getElementById("studentForm");
  const studentTableBody = document.getElementById("studentTableBody");
  const branchSelect = document.getElementById("student_branch_id");
  const classSelect = document.getElementById("class_name");
  const admissionInput = document.getElementById("admission_number");

  // Add mode: admission number is generated automatically.
  if (admissionInput && !localStorage.getItem("editing_student_id")) {
    admissionInput.readOnly = true;
    admissionInput.value = "";
    admissionInput.placeholder = "Select branch to generate";
  }

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

  if (branchSelect) {
    branchSelect.addEventListener("change", function () {
      if (!localStorage.getItem("editing_student_id")) {
        loadNextAdmissionNumber(branchSelect.value);
      }
    });
  }

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

  function isBranchScopedAdmin() {
    const user = getLoggedInUser();
    const role = String(user?.role || "").toLowerCase();

    return ["branch_admin", "teacher_admin"].includes(role);
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

      const response = await fetch("/api/branches", {
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

      if (isBranchScopedAdmin()) {
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
      let url = "/api/students";

      if (isBranchScopedAdmin()) {
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

        const currentStatus = String(student.status || "active").toLowerCase();

        const statusLabels = {
          active: "Active",
          inactive: "Disabled / Locked",
          stopped: "Stopped",
          transferred: "Transferred",
          completed: "Completed"
        };

        row.dataset.branchId = String(student.branch_id || "");
        row.dataset.branchName = String(student.branch_name || "");
        row.dataset.classId = String(student.class_id || "");
        row.dataset.className = String(student.class_name || "");
        row.dataset.status = currentStatus;

        row.innerHTML = `
          <td>${student.admission_number || ""}</td>
          <td>${student.full_name || ""}</td>
          <td>${student.branch_name || ""}</td>
          <td>${student.class_name || ""}</td>
          <td>${student.mother_phone || ""}</td>
          <td>${student.father_phone || ""}</td>
          <td>${statusLabels[currentStatus] || currentStatus}</td>
          <td>
            <button type="button" class="small-btn success edit-student-btn" data-id="${student.id}">Edit</button>

            <button type="button" class="small-btn print-student-profile-btn" onclick="printStudentProfileFromButton(this)"
              data-student="${encodeURIComponent(JSON.stringify(student))}">
              Print Profile
            </button>

            <select class="student-status-action" data-id="${student.id}" data-name="${student.full_name || ""}">
              <option value="active" ${currentStatus === "active" ? "selected" : ""}>Active</option>
              <option value="inactive" ${currentStatus === "inactive" ? "selected" : ""}>Disabled / Locked</option>
              <option value="stopped" ${currentStatus === "stopped" ? "selected" : ""}>Stopped</option>
              <option value="transferred" ${currentStatus === "transferred" ? "selected" : ""}>Transferred</option>
              <option value="completed" ${currentStatus === "completed" ? "selected" : ""}>Completed</option>
            </select>

            <button type="button"
              class="small-btn update-student-status-btn"
              data-id="${student.id}"
              style="background:#004b80;color:#fff;border:none;padding:7px 12px;border-radius:5px;font-weight:600;cursor:pointer;opacity:1;">
              Update Status
            </button>
          </td>
        `;

        studentTableBody.appendChild(row);
      });

      document.dispatchEvent(new CustomEvent("students:loaded"));
    } catch (error) {
      console.error(error);
      studentTableBody.innerHTML = `
        <tr>
          <td colspan="8">Cannot connect to backend.</td>
        </tr>
      `;
    }
  }

  studentTableBody?.addEventListener("click", async function (event) {
    const button = event.target.closest(".update-student-status-btn");
    if (!button) return;

    const studentId = Number(button.dataset.id);
    const row = button.closest("tr");
    const statusSelect = row?.querySelector(".student-status-action");

    if (!studentId || !statusSelect) return;

    const newStatus = statusSelect.value;
    const oldStatus = row.dataset.status || "active";

    const statusLabels = {
      active: "Active",
      inactive: "Disabled / Locked",
      stopped: "Stopped",
      transferred: "Transferred",
      completed: "Completed"
    };

    if (newStatus === oldStatus) {
      alert(`This student is already ${statusLabels[newStatus] || newStatus}.`);
      return;
    }

    const student = studentsCache.find(
      item => Number(item.id) === studentId
    );

    const studentName =
      student?.full_name ||
      statusSelect.dataset.name ||
      "this student";

    const confirmed = confirm(
      `Change ${studentName} from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}?`
    );

    if (!confirmed) {
      statusSelect.value = oldStatus;
      return;
    }

    button.disabled = true;
    button.textContent = "Updating...";

    try {
      const response = await fetch(
        `/api/students/${studentId}/status`,
        {
          method: "PATCH",
          headers: {
            ...getAuthOnlyHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update student status"
        );
      }

      alert(
        `${studentName} status changed to ${statusLabels[newStatus] || newStatus}.`
      );

      await loadStudents();
    } catch (error) {
      console.error("Student status update error:", error);

      statusSelect.value = oldStatus;

      alert(
        error.message || "Unable to update student status."
      );
    } finally {
      if (document.body.contains(button)) {
        button.disabled = false;
        button.textContent = "Update Status";
      }
    }
  });

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
      const response = await fetch("/api/classes", {
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
      countText.textContent = `${visibleCount} student record(s) shown`;
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

    if (admissionInput) {
      admissionInput.readOnly = false;
      admissionInput.placeholder = "Enter admission number";
    }

    setValue("full_name", student.full_name);
    setValue("sex", student.sex);
    setValue("date_of_birth", formatDate(student.date_of_birth));
    setValue("date_of_admission", formatDate(student.date_of_admission));
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
      formData.append("date_of_admission", getValue("date_of_admission"));
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
          ? `/api/students/${editingStudentId}`
          : "/api/students";

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

        // Clear any camera/photo preview after a successful save.
        document.dispatchEvent(new CustomEvent("studentPhotoReset"));

        if (admissionInput) {
          admissionInput.readOnly = true;
          admissionInput.value = "";
          admissionInput.placeholder = "Select branch to generate";
        }

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

    // Branch admins already have their branch selected automatically.
    // Generate their first admission number without requiring a change event.
    if (
      branchSelect &&
      branchSelect.value &&
      !localStorage.getItem("editing_student_id")
    ) {
      await loadNextAdmissionNumber(branchSelect.value);
    }
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

      const response = await fetch("/api/branches", {
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

    const settingsResponse = await fetch("/api/settings");
    const settingsData = await settingsResponse.json();
    const settings = settingsData.settings || {};

    const logo = settings.school_logo
      ? `<img src="${settings.school_logo}" style="width:75px;height:75px;object-fit:contain;">`
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




// ==========================================================
// STUDENT CAMERA / PHOTO CAPTURE
// ==========================================================
document.addEventListener("DOMContentLoaded", function () {
  const pictureInput = document.getElementById("student_profile_picture");
  const openCameraBtn = document.getElementById("openStudentCamera");
  const cameraPanel = document.getElementById("studentCameraPanel");
  const video = document.getElementById("studentCameraVideo");
  const canvas = document.getElementById("studentCameraCanvas");
  const captureBtn = document.getElementById("captureStudentPhoto");
  const closeCameraBtn = document.getElementById("closeStudentCamera");
  const previewWrap = document.getElementById("studentPhotoPreviewWrap");
  const preview = document.getElementById("studentPhotoPreview");

  if (
    !pictureInput ||
    !openCameraBtn ||
    !cameraPanel ||
    !video ||
    !canvas ||
    !captureBtn ||
    !closeCameraBtn ||
    !previewWrap ||
    !preview
  ) {
    return;
  }

  let cameraStream = null;
  let previewUrl = null;

  function revokePreviewUrl() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function showPreview(file) {
    if (!file) {
      revokePreviewUrl();
      preview.removeAttribute("src");
      previewWrap.hidden = true;
      return;
    }

    revokePreviewUrl();
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    previewWrap.hidden = false;
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (track) {
        track.stop();
      });
      cameraStream = null;
    }

    video.srcObject = null;
    cameraPanel.hidden = true;
  }

  pictureInput.addEventListener("change", function () {
    const file = pictureInput.files && pictureInput.files[0];

    if (!file) {
      showPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      pictureInput.value = "";
      showPreview(null);
      return;
    }

    showPreview(file);
  });

  openCameraBtn.addEventListener("click", async function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access is not supported by this browser.");
      return;
    }

    try {
      stopCamera();

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" }
        },
        audio: false
      });

      video.srcObject = cameraStream;
      cameraPanel.hidden = false;

      await video.play();
    } catch (error) {
      console.error("Unable to open camera:", error);
      alert(
        "Unable to open the camera. Please allow camera permission in your browser or choose a photo instead."
      );
    }
  });

  captureBtn.addEventListener("click", function () {
    if (!cameraStream || !video.videoWidth || !video.videoHeight) {
      alert("Camera is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      function (blob) {
        if (!blob) {
          alert("Unable to capture the photo. Please try again.");
          return;
        }

        const file = new File(
          [blob],
          "student-camera-" + Date.now() + ".jpg",
          { type: "image/jpeg" }
        );

        const transfer = new DataTransfer();
        transfer.items.add(file);
        pictureInput.files = transfer.files;

        showPreview(file);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  });

  closeCameraBtn.addEventListener("click", function () {
    stopCamera();
  });

  document.addEventListener("studentPhotoReset", function () {
    stopCamera();
    showPreview(null);
  });

  window.addEventListener("beforeunload", function () {
    stopCamera();
    revokePreviewUrl();
  });
});


// STUDENT EXCEL TEMPLATE DOWNLOAD
document.addEventListener("DOMContentLoaded", function () {
  const downloadBtn = document.getElementById("downloadStudentExcelTemplate");
  if (!downloadBtn) return;

  downloadBtn.addEventListener("click", async function () {
    const originalText = downloadBtn.textContent;

    try {
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Preparing Template...";

      const token = localStorage.getItem("token");

      const response = await fetch("/api/students/excel-template", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let message = "Failed to download Excel template.";

        try {
          const data = await response.json();
          if (data.message) message = data.message;
        } catch (_) {}

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Delight_Student_Import_Template.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Student Excel template download error:", error);
      alert(error.message || "Failed to download Excel template.");
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = originalText;
    }
  });
});

// STUDENT EXCEL PREVIEW / VALIDATION
document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("studentExcelFile");
  const previewBtn = document.getElementById("previewStudentExcel");
  const summary = document.getElementById("studentExcelSummary");
  const previewWrap = document.getElementById("studentExcelPreviewWrap");
  const previewBody = document.getElementById("studentExcelPreviewBody");
  const importBtn = document.getElementById("importStudentExcel");

  if (
    !fileInput ||
    !previewBtn ||
    !summary ||
    !previewWrap ||
    !previewBody ||
    !importBtn
  ) {
    return;
  }

  let validatedFile = null;

  const disableImport = function () {
    validatedFile = null;
    importBtn.disabled = true;
    importBtn.title = "Preview and validate the Excel file first";
  };

  fileInput.addEventListener("change", function () {
    disableImport();
    summary.style.display = "none";
    previewWrap.style.display = "none";
    previewBody.innerHTML = "";
  });

  const escapeHtml = value =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  previewBtn.addEventListener("click", async function () {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      alert("Please choose the completed student Excel file first.");
      return;
    }

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      alert("Please select an Excel .xlsx or .xls file.");
      return;
    }

    const originalText = previewBtn.textContent;

    try {
      previewBtn.disabled = true;
      previewBtn.textContent = "Validating...";

      summary.style.display = "none";
      previewWrap.style.display = "none";
      previewBody.innerHTML = "";

      const formData = new FormData();
      formData.append("excel_file", file);

      const response = await fetch("/api/students/excel-preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        let message = result.message || "Failed to validate Excel file.";

        if (
          Array.isArray(result.missing_headers) &&
          result.missing_headers.length
        ) {
          message +=
            "\n\nMissing columns:\n- " +
            result.missing_headers.join("\n- ");
        }

        throw new Error(message);
      }

      summary.style.display = "block";
      summary.innerHTML =
        `<strong>Total:</strong> ${Number(result.total_rows || 0)} &nbsp; | &nbsp; ` +
        `<strong>Valid:</strong> ${Number(result.valid_rows || 0)} &nbsp; | &nbsp; ` +
        `<strong>Errors:</strong> ${Number(result.error_rows || 0)}`;

      const rows = Array.isArray(result.rows) ? result.rows : [];

      for (const row of rows) {
        const data = row.data || {};
        const errors = Array.isArray(row.errors) ? row.errors : [];

        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${escapeHtml(row.excel_row)}</td>
          <td>${row.valid ? "Valid" : "Error"}</td>
          <td>${escapeHtml(data.admission_number || "Auto")}</td>
          <td>${escapeHtml(data.branch)}</td>
          <td>${escapeHtml(data.full_name)}</td>
          <td>${escapeHtml(data.sex)}</td>
          <td>${escapeHtml(data.class_name)}</td>
          <td>${escapeHtml(errors.join(" "))}</td>
        `;

        previewBody.appendChild(tr);
      }

      previewWrap.style.display = "block";

      if (
        Number(result.error_rows || 0) === 0 &&
        Number(result.valid_rows || 0) > 0
      ) {
        validatedFile = file;
        importBtn.disabled = false;
        importBtn.title = "Import the validated students";
      } else {
        disableImport();
      }
    } catch (error) {
      disableImport();
      console.error("Student Excel preview error:", error);
      alert(error.message || "Failed to validate Excel file.");
    } finally {
      previewBtn.disabled = false;
      previewBtn.textContent = originalText;
    }
  });

  importBtn.addEventListener("click", async function () {
    if (!validatedFile) {
      alert("Please preview and validate the Excel file first.");
      disableImport();
      return;
    }

    const confirmed = confirm(
      "Import all validated students now?\n\n" +
      "Admission numbers will be generated automatically and " +
      "registration SMS messages will be sent where parent phone numbers are available."
    );

    if (!confirmed) return;

    const originalText = importBtn.textContent;

    try {
      importBtn.disabled = true;
      previewBtn.disabled = true;
      fileInput.disabled = true;
      importBtn.textContent = "Importing Students...";

      const formData = new FormData();
      formData.append("excel_file", validatedFile);

      const response = await fetch("/api/students/excel-import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        let message =
          result.message || "Failed to import students.";

        if (
          Array.isArray(result.errors) &&
          result.errors.length
        ) {
          const rowErrors = result.errors.map(item => {
            const errors = Array.isArray(item.errors)
              ? item.errors.join(" ")
              : "";

            return `Row ${item.excel_row}: ${errors}`;
          });

          message += "\n\n" + rowErrors.join("\n");
        }

        if (Number(result.imported_count || 0) > 0) {
          message +=
            `\n\n${result.imported_count} student(s) had already been imported before the error occurred.`;
        }

        throw new Error(message);
      }

      const imported =
        Array.isArray(result.imported_students)
          ? result.imported_students
          : [];

      let message =
        `${Number(result.imported_count || 0)} student(s) imported successfully.`;

      if (imported.length) {
        message +=
          "\n\nAdmission Numbers:\n" +
          imported
            .map(student =>
              `${student.admission_number} - ${student.full_name}`
            )
            .join("\n");
      }

      alert(message);

      fileInput.value = "";
      validatedFile = null;
      summary.style.display = "none";
      previewWrap.style.display = "none";
      previewBody.innerHTML = "";
      disableImport();

      // Refresh the page so the Student List shows the new records.
      window.location.reload();
    } catch (error) {
      console.error("Student Excel import error:", error);
      alert(error.message || "Failed to import students.");

      // Require another preview before retrying.
      disableImport();
    } finally {
      previewBtn.disabled = false;
      fileInput.disabled = false;
      importBtn.textContent = originalText;
    }
  });

});
