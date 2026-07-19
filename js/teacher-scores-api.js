document.addEventListener("DOMContentLoaded", function () {
  const scoreForm = document.getElementById("teacherScoreForm");
  const studentSelect = document.getElementById("teacher_score_student_id");
  const scoreTableBody = document.getElementById("teacherScoreTableBody");

  let loggedInTeacher = null;

  function getLoggedInUser() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  }

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function oneDecimal(value) {
    return Number(value || 0).toFixed(1);
  }

  async function getLoggedInTeacher() {
    const user = getLoggedInUser();

    if (!user || user.role !== "teacher") {
      throw new Error("Please login as a teacher.");
    }

    const response = await fetch(`http://127.0.0.1:5000/api/teachers/by-user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Teacher record not found.");
    }

    return data.teacher;
  }

  function studentName(student) {
    return student.full_name || `${student.first_name || ""} ${student.surname || ""}`.trim();
  }

  async function loadAssignedStudents() {
    if (!studentSelect) return;

    loggedInTeacher = await getLoggedInTeacher();

    const response = await fetch(`http://127.0.0.1:5000/api/teachers/${loggedInTeacher.id}/students`);
    const data = await response.json();

    studentSelect.innerHTML = '<option value="">Select student</option>';

    (data.students || []).forEach(function (student) {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = `${studentName(student)} - ${student.admission_number || ""} - ${student.class_name || ""}`;
      studentSelect.appendChild(option);
    });
  }

  async function loadTeacherScores() {
    if (!scoreTableBody) return;

    try {
      if (!loggedInTeacher) {
        loggedInTeacher = await getLoggedInTeacher();
      }

      const response = await fetch(`http://127.0.0.1:5000/api/scores?branch_id=${loggedInTeacher.branch_id}`, {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      scoreTableBody.innerHTML = "";

      if (!response.ok) {
        scoreTableBody.innerHTML = `
          <tr>
            <td colspan="9">${data.message || "Could not load scores."}</td>
          </tr>
        `;
        return;
      }

      const assignedResponse = await fetch(`http://127.0.0.1:5000/api/teachers/${loggedInTeacher.id}/students`);
      const assignedData = await assignedResponse.json();
      const assignedIds = new Set((assignedData.students || []).map(s => Number(s.id)));

      const scores = (data.scores || []).filter(score => assignedIds.has(Number(score.student_id)));

      if (scores.length === 0) {
        scoreTableBody.innerHTML = `
          <tr>
            <td colspan="9">No scores found.</td>
          </tr>
        `;
        return;
      }

      scores.forEach(function (score) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${score.student_name || ""}</td>
          <td>${score.admission_number || ""}</td>
          <td>${score.class_name || ""}</td>
          <td>${score.subject || ""}</td>
          <td>${score.term || ""}</td>
          <td>${oneDecimal(score.assessment_score)}</td>
          <td>${oneDecimal(score.examination_score)}</td>
          <td>${oneDecimal(score.total_score)}</td>
          <td>${score.approval_status || ""}</td>
        `;

        scoreTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      scoreTableBody.innerHTML = `
        <tr>
          <td colspan="9">${error.message}</td>
        </tr>
      `;
    }
  }

  if (scoreForm) {
    scoreForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      try {
        if (!loggedInTeacher) {
          loggedInTeacher = await getLoggedInTeacher();
        }

        const scoreData = {
          branch_id: loggedInTeacher.branch_id,
          student_id: document.getElementById("teacher_score_student_id").value,
          subject: document.getElementById("teacher_score_subject").value.trim(),
          term: document.getElementById("teacher_score_term").value,
          academic_year: document.getElementById("teacher_score_academic_year").value.trim(),
          assessment_score: document.getElementById("teacher_assessment_score").value,
          examination_score: document.getElementById("teacher_examination_score").value,
          position: "",
          remarks: document.getElementById("teacher_score_remarks").value.trim(),
          approval_status: "pending"
        };

        const response = await fetch("http://127.0.0.1:5000/api/scores", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(scoreData)
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to upload score.");
          return;
        }

        alert("Score uploaded successfully. Waiting for admin approval.");
        scoreForm.reset();
        document.getElementById("teacher_score_academic_year").value = "2025/2026";
        await loadAssignedStudents();
        await loadTeacherScores();
      } catch (error) {
        console.error(error);
        alert(error.message || "Cannot connect to backend.");
      }
    });
  }

  async function start() {
    try {
      await loadAssignedStudents();
      await loadTeacherScores();
    } catch (error) {
      console.error(error);
      if (scoreTableBody) {
        scoreTableBody.innerHTML = `
          <tr>
            <td colspan="9">${error.message}</td>
          </tr>
        `;
      }
    }
  }

  start();
});

// Excel Score Template Download and Upload
document.addEventListener("DOMContentLoaded", function () {
  const branchSelect = document.getElementById("excel_branch_id");
  const classSelect = document.getElementById("excel_class_id");
  const subjectInput = document.getElementById("excel_subject");
  const termInput = document.getElementById("excel_term");
  const academicYearInput = document.getElementById("excel_academic_year");
  const downloadBtn = document.getElementById("downloadScoreTemplateBtn");
  const uploadBtn = document.getElementById("uploadScoreExcelBtn");
  const fileInput = document.getElementById("score_excel_file");

  function getToken() {
    return localStorage.getItem("token");
  }

  function getHeaders() {
    return {
      Authorization: `Bearer ${getToken()}`
    };
  }

  async function loadExcelSettings() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/settings");
      const data = await res.json();
      const settings = data.settings || {};

      if (termInput && !termInput.value) termInput.value = settings.current_term || "";
      if (academicYearInput && !academicYearInput.value) academicYearInput.value = settings.academic_year || "";
    } catch (error) {
      console.error(error);
    }
  }

  async function loadExcelBranches() {
    if (!branchSelect) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/branches", {
        headers: getHeaders()
      });

      const data = await res.json();
      const branches = data.branches || [];

      branchSelect.innerHTML = '<option value=""></option>';

      branches.forEach(branch => {
        const opt = document.createElement("option");
        opt.value = branch.id;
        opt.textContent = branch.branch_name || branch.name || "";
        branchSelect.appendChild(opt);
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function loadExcelClasses() {
    if (!classSelect) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/classes", {
        headers: getHeaders()
      });

      const data = await res.json();
      const classes = data.classes || [];

      classSelect.innerHTML = '<option value="">Select class</option>';

      classes.forEach(cls => {
        const opt = document.createElement("option");
        opt.value = cls.id;
        opt.textContent = cls.class_name;
        classSelect.appendChild(opt);
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function downloadTemplate() {
    if (!branchSelect.value || !classSelect.value || !subjectInput.value || !termInput.value || !academicYearInput.value) {
      alert("Please select branch, class, subject, term, and academic year.");
      return;
    }

    const params = new URLSearchParams({
      branch_id: branchSelect.value,
      class_id: classSelect.value,
      subject: subjectInput.value.trim(),
      term: termInput.value,
      academic_year: academicYearInput.value.trim()
    });

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/scores/excel/template?${params.toString()}`, {
        headers: getHeaders()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Could not download template");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `score-template-${subjectInput.value}-${termInput.value}-${academicYearInput.value}.xlsx`
        .replaceAll(" ", "-")
        .replaceAll("/", "-");

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function uploadExcelScores() {
    if (!branchSelect.value || !subjectInput.value || !termInput.value || !academicYearInput.value) {
      alert("Please select branch, subject, term, and academic year.");
      return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select the filled Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("branch_id", branchSelect.value);
    formData.append("subject", subjectInput.value.trim());
    formData.append("term", termInput.value);
    formData.append("academic_year", academicYearInput.value.trim());
    formData.append("score_file", fileInput.files[0]);

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {
      const res = await fetch("http://127.0.0.1:5000/api/scores/excel/upload", {
        method: "POST",
        headers: getHeaders(),
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      alert(
        `Excel upload successful.\nSaved: ${data.saved_count}\nUpdated: ${data.updated_count}\nSkipped: ${data.skipped_count}`
      );

      location.reload();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload Excel Scores";
    }
  }

  if (downloadBtn) downloadBtn.addEventListener("click", downloadTemplate);
  if (uploadBtn) uploadBtn.addEventListener("click", uploadExcelScores);

  loadExcelSettings();
  loadExcelBranches();
  loadExcelClasses();
});


