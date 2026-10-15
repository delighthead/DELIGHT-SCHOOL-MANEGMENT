/* Basic 9 Mock Examinations — Part 1 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = id => document.getElementById(id);
  const ADMIN_ROLES = [
    "super_admin", "branch_admin", "admin", "teacher_admin"
  ];

  const state = {
    user: null,
    branchId: null,
    exams: [],
    subjects: [],
    students: [],
    scores: [],
    currentExam: null,
    currentSubject: null
  };

  function message(text, error = false) {
    const element = $("mockMessage");
    if (!element) return;
    element.textContent = text;
    element.className = error ? "mock-error" : "mock-success";
  }

  function clearSelect(id, placeholder) {
    const select = $(id);
    select.replaceChildren(new Option(placeholder, ""));
  }

  function fillSelect(id, items, getValue, getLabel) {
    const select = $(id);
    items.forEach(item => {
      select.add(new Option(getLabel(item), String(getValue(item))));
    });
  }

  async function api(path, options = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Your login session is missing. Please log in.");
    }

    // STEP 441C — MOCK EXAMINATION API BASE URL
    const apiOrigin =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin;

    const response = await fetch(`${apiOrigin}/api${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
  }

  function resetScores() {
    state.students = [];
    state.scores = [];

    $("mockScoresBody").replaceChildren();

    const row = $("mockScoresBody").insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.textContent = "Select a subject and load students.";
  }

  async function loadBranches() {
    const data = await api("/branches");

    const branches = Array.isArray(data)
      ? data
      : (data.branches || []);

    clearSelect("mockBranch", "Select branch");

    const allowed = state.user.role === "super_admin"
      ? branches
      : branches.filter(branch =>
          Number(branch.id) === Number(state.user.branch_id)
        );

    fillSelect(
      "mockBranch",
      allowed,
      branch => branch.id,
      branch => branch.branch_name || branch.name || `Branch ${branch.id}`
    );

    if (allowed.length === 1) {
      $("mockBranch").value = String(allowed[0].id);
      await loadExams();
    }
  }

  // Load available school subjects from the backend.
  async function loadAvailableSubjects() {
    const select = $("mockNewSubject");

    if (!select) return;

    clearSelect("mockNewSubject", "Loading subjects...");

    const branchId = Number($("mockBranch").value);

    if (!branchId) {
      clearSelect("mockNewSubject", "Select branch first");
      return;
    }

    try {
      const data = await api(
        `/mock-exams/available-subjects?branch_id=${encodeURIComponent(branchId)}`
      );

      const subjects = Array.isArray(data.subjects)
        ? data.subjects
        : [];

      clearSelect("mockNewSubject", "Select Subject");

      subjects.forEach(subject => {
        if (typeof subject === "string" && subject.trim()) {
          select.add(new Option(subject, subject));
        }
      });

      if (select.options.length === 1) {
        clearSelect(
          "mockNewSubject",
          "No assigned subjects available"
        );
      }

    } catch (error) {
      clearSelect(
        "mockNewSubject",
        "Unable to load subjects"
      );

      message(error.message, true);
    }
  }

  async function loadExams() {
    state.branchId = Number($("mockBranch").value) || null;
    await loadAvailableSubjects();
    state.currentExam = null;
    state.currentSubject = null;
    state.subjects = [];
    renderConfiguredSubjects();

    clearSelect("mockExam", "Select mock examination");
    clearSelect("mockSubject", "Select subject");
    resetScores();

    if (!state.branchId) return;

    const data = await api(
      `/mock-exams?branch_id=${encodeURIComponent(state.branchId)}`
    );

    state.exams = data.exams || [];

    fillSelect(
      "mockExam",
      state.exams,
      exam => exam.id,
      exam => `${exam.mock_name} — ${exam.academic_year}`
    );

    message(`${state.exams.length} mock examination(s) available.`);
  }

  async function loadSubjects() {
    const examId = Number($("mockExam").value);

    state.currentExam = state.exams.find(
      exam => Number(exam.id) === examId
    ) || null;

    state.currentSubject = null;
    clearSelect("mockSubject", "Select subject");
    resetScores();

    if (!state.currentExam) {
      state.subjects = [];
      renderConfiguredSubjects();
      $("mockExamDetails").textContent = "";
      return;
    }

    const data = await api(
      `/mock-exams/${examId}/subjects?branch_id=${state.branchId}`
    );

    state.subjects = data.subjects || [];

    renderConfiguredSubjects();

    fillSelect(
      "mockSubject",
      state.subjects,
      subject => subject.id,
      subject => `${subject.subject} (${subject.objectives_max}/${subject.written_max})`
    );

    $("mockExamDetails").textContent =
      `${state.currentExam.mock_name} | ` +
      `${state.currentExam.academic_year} | ` +
      `Status: ${data.status || state.currentExam.status}`;

    message(`${state.subjects.length} subject(s) available.`);
  }

  // Display subjects configured for the selected mock examination.
  // Draft and Active examinations allow subject configuration.
  // Completed examinations remain locked.
  function updateMockSubjectControls() {
    const subjectSelect = $("mockNewSubject");
    const formatSelect = $("mockMarkingFormat");
    const addButton = $("addMockSubjectBtn");

    const canConfigure =
      ADMIN_ROLES.includes(state.user?.role) &&
      Boolean(state.currentExam) &&
      ["draft", "active"].includes(
        String(state.currentExam.status).toLowerCase()
      );

    if (subjectSelect) {
      subjectSelect.disabled = !canConfigure;
    }

    if (formatSelect) {
      formatSelect.disabled = !canConfigure;
    }

    if (addButton) {
      addButton.disabled = !canConfigure;

      addButton.title = canConfigure
        ? "Add a subject to this mock examination"
        : "Only administrators can add subjects to Draft or Active examinations";
    }
  }

  // Display the selected examination in the Enter Scores section.
  function updateMockScoreExamInfo() {
    const branchSelect = $("mockBranch");
    const exam = state.currentExam;

    const branchElement = $("mockScoreBranchInfo");
    const examElement = $("mockScoreExamNameInfo");
    const yearElement = $("mockScoreYearInfo");
    const statusElement = $("mockScoreStatusInfo");

    if (
      !branchElement ||
      !examElement ||
      !yearElement ||
      !statusElement
    ) {
      return;
    }

    const selectedBranch =
      branchSelect && branchSelect.value
        ? branchSelect.selectedOptions[0]?.textContent.trim()
        : null;

    branchElement.textContent = selectedBranch || "Not selected";

    examElement.textContent =
      exam ? exam.mock_name : "Not selected";

    yearElement.textContent =
      exam ? exam.academic_year : "—";

    const status = exam
      ? String(exam.status || "").toLowerCase()
      : "";

    statusElement.textContent = status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Not selected";

    statusElement.dataset.status = status;
  }

  function renderConfiguredSubjects() {
    updateMockSubjectControls();
    updateMockScoreExamInfo();

    const body = $("mockConfiguredSubjectsBody");
    const context = $("mockConfiguredSubjectsContext");

    if (!body || !context) return;

    body.replaceChildren();

    const branch = $("mockBranch");
    const branchName = branch?.selectedOptions[0]?.textContent || "";

    if (!state.currentExam) {
      context.textContent =
        "Select a branch and mock examination to view subjects.";

      const row = body.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5;
      cell.textContent =
        "Select a mock examination to display subjects.";
      return;
    }

    context.textContent =
      `Branch: ${branchName} | ` +
      `Examination: ${state.currentExam.mock_name} | ` +
      `Academic Year: ${state.currentExam.academic_year}`;

    if (!state.subjects.length) {
      const row = body.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5;
      cell.textContent =
        "No subjects have been configured for this examination.";
      return;
    }

    state.subjects.forEach(subject => {
      const row = body.insertRow();

      const objectives = Number(subject.objectives_max);
      const written = Number(subject.written_max);

      [
        subject.subject,
        objectives,
        written,
        objectives + written,
        "Configured"
      ].forEach(value => {
        const cell = row.insertCell();
        cell.textContent = String(value);
      });
    });
  }

  function selectSubject() {
    const subjectId = Number($("mockSubject").value);

    state.currentSubject = state.subjects.find(
      subject => Number(subject.id) === subjectId
    ) || null;

    resetScores();

    $("mockMarkingInfo").textContent = state.currentSubject
      ? `${state.currentSubject.subject}: ` +
        `Objectives / ${state.currentSubject.objectives_max}, ` +
        `Written / ${state.currentSubject.written_max}`
      : "Select an examination and subject to begin.";
  }

  async function initialize() {
    try {
      const rawUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!rawUser || !token) {
        window.location.replace("../pages/login.html");
        return;
      }

      state.user = JSON.parse(rawUser);

      if (
        !state.user ||
        ![...ADMIN_ROLES, "teacher"].includes(state.user.role)
      ) {
        window.location.replace("../pages/login.html");
        return;
      }

      const admin = ADMIN_ROLES.includes(state.user.role);

      // STEP 455C — PROFILE AND PARENTS NAVIGATION
      const profileLink = $("mockMyProfileLink");
      const parentsLink = $("mockManageParentsLink");

      if (profileLink) {
        profileLink.href = admin
          ? "admin-profile.html"
          : "teacher-profile.html";
      }

      if (parentsLink) {
        parentsLink.hidden = !admin;
      }

      $("mockAdminSection").hidden = !admin;


      // STEP 411: INDEPENDENT WORKSPACE NAVIGATION
      const mockNavigation = document.querySelector(
        ".mock-modern-navigation"
      );

      const workspaceIds = [
        "mockDashboardOverview",
        "mockOverview",
        "mockAdminSection",
        "mockScoreSection",
        "mockResultsWorkspace",
        "mockReportCardsWorkspace",
        "mockExportWorkspace"
      ];

      const managementIds = [
        "mockManageSubjects"
      ];

      function openMockWorkspace(targetId, selectedLink) {
        // STEP 454B — SIDEBAR AND MESSAGE FIX
        document.body.classList.toggle(
          "mock-dashboard-overview-active",
          targetId === "mockDashboardOverview"
        );

        const isManagement = managementIds.includes(targetId);

        if (isManagement && !admin) {
          return;
        }

        const target = document.getElementById(targetId);

        if (!target) {
          return;
        }

        workspaceIds.forEach(id => {
          const section = document.getElementById(id);

          if (section) {
            section.hidden = true;
          }
        });

        const examPanel = $("mockManageExaminations");
        const subjectPanel = $("mockManageSubjects");

        // Examination management now belongs to Mock Examinations.
        // Only administrators may access its controls.
        if (examPanel) {
          examPanel.hidden = !admin;
        }

        // Manage Subjects remains an independent workspace.
        if (subjectPanel) {
          subjectPanel.hidden =
            targetId !== "mockManageSubjects";
        }

        if (isManagement) {
          $("mockAdminSection").hidden = false;
        } else {
          target.hidden = false;
        }

        if (mockNavigation) {
          mockNavigation.querySelectorAll("a").forEach(link => {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
          });
        }

        if (selectedLink) {
          selectedLink.classList.add("active");
          selectedLink.setAttribute(
            "aria-current",
            "page"
          );
        }

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

      if (mockNavigation) {
        const navigationLinks = mockNavigation.querySelectorAll(
          'a[href^="#"]:not([href="#"])'
        );

        mockNavigation.querySelectorAll(
          ".mock-admin-navigation"
        ).forEach(link => {
          link.hidden = !admin;
        });

        navigationLinks.forEach(link => {
          link.addEventListener("click", event => {
            const targetId = link.getAttribute("href").slice(1);

            event.preventDefault();

            if (link.hidden) {
              return;
            }

            openMockWorkspace(targetId, link);
          });
        });

        // STEP 453B — DEFAULT DASHBOARD OVERVIEW
        const defaultLink = mockNavigation.querySelector(
          'a[href="#mockDashboardOverview"]'
        );

        openMockWorkspace("mockDashboardOverview", defaultLink);
      }

      $("mockPanelTitle").textContent =
        admin ? "Admin Panel" : "Teacher Panel";



      $("mockBranch").addEventListener("change", () => {
        loadExams()
          .then(() => loadMockDashboard())
          .catch(error => message(error.message, true));
      });

      $("mockExam").addEventListener("change", () => {
        loadSubjects()
          .then(() => loadMockDashboard())
          .catch(error => message(error.message, true));
      });

      $("mockSubject").addEventListener("change", selectSubject);

      await loadBranches();
      await loadMockDashboard();
    } catch (error) {
      message(error.message || "Failed to initialize dashboard.", true);
    }
  }

  // Dashboard initialization runs after all setup code.


  function displayStudentName(student) {
    return (
      student.full_name ||
      [
        student.first_name,
        student.other_name,
        student.surname
      ].filter(Boolean).join(" ") ||
      `Student ${student.id}`
    );
  }

  function scoreValue(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function validateMarks(objectives, written) {
    const subject = state.currentSubject;

    if (!subject) {
      throw new Error("Select a subject first.");
    }

    if (
      objectives === null ||
      written === null ||
      objectives < 0 ||
      written < 0 ||
      objectives > Number(subject.objectives_max) ||
      written > Number(subject.written_max)
    ) {
      throw new Error(
        `Objectives must be 0–${subject.objectives_max} ` +
        `and Written must be 0–${subject.written_max}.`
      );
    }

    if (
      Math.round(objectives * 100) !== objectives * 100 ||
      Math.round(written * 100) !== written * 100
    ) {
      throw new Error("Enter marks to a maximum of two decimal places.");
    }
  }

  function renderStudentScores() {
    const body = $("mockScoresBody");
    body.replaceChildren();

    if (!state.students.length) {
      const row = body.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = "No active students found for this examination.";
      return;
    }

    for (const student of state.students) {
      const saved = state.scores.find(score =>
        Number(score.student_id) === Number(student.id) &&
        Number(score.subject_setting_id) ===
          Number(state.currentSubject.id)
      );

      const row = body.insertRow();
      row.dataset.studentId = String(student.id);

      const nameCell = row.insertCell();
      nameCell.textContent = displayStudentName(student);

      const admissionCell = row.insertCell();
      admissionCell.textContent =
        student.admission_number || student.student_id || "—";

      const objectivesCell = row.insertCell();
      const objectivesInput = document.createElement("input");
      objectivesInput.type = "number";
      objectivesInput.min = "0";
      objectivesInput.max = String(state.currentSubject.objectives_max);
      objectivesInput.step = "0.01";
      objectivesInput.className = "mock-objectives";
      objectivesInput.setAttribute(
        "aria-label",
        `Objectives for ${displayStudentName(student)}`
      );

      if (saved && saved.objectives_score !== null) {
        objectivesInput.value = saved.objectives_score;
      }

      objectivesCell.appendChild(objectivesInput);

      const writtenCell = row.insertCell();
      const writtenInput = document.createElement("input");
      writtenInput.type = "number";
      writtenInput.min = "0";
      writtenInput.max = String(state.currentSubject.written_max);
      writtenInput.step = "0.01";
      writtenInput.className = "mock-written";
      writtenInput.setAttribute(
        "aria-label",
        `Written for ${displayStudentName(student)}`
      );

      if (saved && saved.written_score !== null) {
        writtenInput.value = saved.written_score;
      }

      writtenCell.appendChild(writtenInput);

      const totalCell = row.insertCell();
      const gradeCell = row.insertCell();
      const remarksCell = row.insertCell();
      const actionCell = row.insertCell();

      totalCell.className = "mock-total";
      gradeCell.className = "mock-grade";
      remarksCell.className = "mock-remarks";

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "Save";
      actionCell.appendChild(saveButton);

      if (saved) {
        totalCell.textContent = saved.total_score ?? "—";
        gradeCell.textContent = saved.grade || "—";
        remarksCell.textContent = saved.remarks || "—";
      }

      function updatePreview() {
        const objectives = scoreValue(objectivesInput.value);
        const written = scoreValue(writtenInput.value);

        if (objectives === null || written === null) {
          totalCell.textContent = "—";
        } else {
          totalCell.textContent = (objectives + written).toFixed(2);
        }

        gradeCell.textContent = "Save to calculate";
        remarksCell.textContent = "—";
      }

      objectivesInput.addEventListener("input", updatePreview);
      writtenInput.addEventListener("input", updatePreview);

      saveButton.addEventListener("click", async () => {
        try {
          const objectives = scoreValue(objectivesInput.value);
          const written = scoreValue(writtenInput.value);

          validateMarks(objectives, written);

          if (state.currentExam.status !== "active") {
            throw new Error(
              "Scores can only be saved for an active examination."
            );
          }

          saveButton.disabled = true;
          saveButton.textContent = "Saving...";

          const result = await api(
            `/mock-exams/${state.currentExam.id}/scores`,
            {
              method: "POST",
              body: JSON.stringify({
                branch_id: state.branchId,
                student_id: student.id,
                subject_setting_id: state.currentSubject.id,
                objectives_score: objectives,
                written_score: written
              })
            }
          );

          totalCell.textContent = result.total_score;
          gradeCell.textContent = result.grade || "—";
          remarksCell.textContent = result.remarks || "—";

          const existingIndex = state.scores.findIndex(score =>
            Number(score.student_id) === Number(student.id) &&
            Number(score.subject_setting_id) ===
              Number(state.currentSubject.id)
          );

          const updated = {
            student_id: student.id,
            subject_setting_id: state.currentSubject.id,
            objectives_score: objectives,
            written_score: written,
            total_score: result.total_score,
            grade: result.grade,
            remarks: result.remarks
          };

          if (existingIndex >= 0) {
            state.scores[existingIndex] = updated;
          } else {
            state.scores.push(updated);
          }

          message(`Saved mock score for ${displayStudentName(student)}.`);
        } catch (error) {
          message(error.message, true);
        } finally {
          saveButton.disabled = false;
          saveButton.textContent = "Save";
        }
      });

      if (state.currentExam.status !== "active") {
        objectivesInput.disabled = true;
        writtenInput.disabled = true;
        saveButton.disabled = true;
      }
    }
  }


  // STEP 449D — READ-ONLY MOCK EXAMINATION RESULTS

  let mockResultsRequestId = 0;

  function mockResultsText(id, value) {
    const element = $(id);
    if (element) {
      element.textContent = String(value ?? "—");
    }
  }

  function mockResultsNotice(text, isError = false) {
    const element = $("mockResultsMessage");
    if (!element) return;

    element.textContent = text;
    element.style.color = isError ? "#b42318" : "#087443";
  }

  function clearMockResultsTable(text) {
    const body = $("mockResultsBody");
    if (!body) return;

    body.replaceChildren();

    const row = body.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 8;
    cell.textContent = text;
  }

  function renderMockResults(students, subjects, scores) {
    const body = $("mockResultsBody");
    if (!body) return;

    body.replaceChildren();

    const selectedSubject = $("mockResultsSubject").value;

    const visibleSubjects = subjects.filter(subject =>
      selectedSubject === "all" ||
      String(subject.id) === selectedSubject
    );

    let rowCount = 0;
    let savedCount = 0;

    for (const student of students) {
      for (const subject of visibleSubjects) {
        const saved = scores.find(score =>
          Number(score.student_id) === Number(student.id) &&
          Number(score.subject_setting_id) === Number(subject.id)
        );

        const row = body.insertRow();

        const values = [
          displayStudentName(student),
          student.admission_number || student.student_id || "",
          subject.subject || "—",
          saved?.objectives_score ?? "—",
          saved?.written_score ?? "—",
          saved?.total_score ?? "—",
          saved?.grade ?? "—",
          saved?.remarks || "Not Entered"
        ];

        for (const value of values) {
          const cell = row.insertCell();
          cell.textContent = String(value);
        }

        if (saved) {
          savedCount++;
        }

        rowCount++;
      }
    }

    if (!rowCount) {
      clearMockResultsTable(
        "No students or subjects found for this examination."
      );
    }

    mockResultsNotice(
      rowCount + " result row(s) displayed. " +
      savedCount + " subject score(s) saved."
    );
  }

  async function loadMockResults() {
    const requestId = ++mockResultsRequestId;

    const exam = state.currentExam;

    if (!exam || !state.branchId) {
      clearMockResultsTable(
        "Select a branch and examination first."
      );

      mockResultsNotice(
        "Please select an examination.",
        true
      );

      return;
    }

    const body = $("mockResultsBody");
    const filter = $("mockResultsSubject");
    const button = $("loadMockResultsBtn");

    if (!body || !filter || !button) return;

    button.disabled = true;

    clearMockResultsTable("Loading examination results...");
    mockResultsNotice("Loading saved scores...");

    const branchId = Number(state.branchId);
    const examId = Number(exam.id);

    try {
      const branchSelect = $("mockBranch");

      const branchName =
        branchSelect?.selectedOptions?.[0]?.textContent ||
        state.user?.branch_name ||
        "—";

      mockResultsText("mockResultsBranch", branchName);
      mockResultsText(
        "mockResultsExam",
        exam.mock_name || exam.name || "Mock " + examId
      );
      mockResultsText(
        "mockResultsYear",
        exam.academic_year || "—"
      );
      mockResultsText(
        "mockResultsStatus",
        exam.status || "—"
      );

      const branch = encodeURIComponent(branchId);

      const [studentData, scoreData] = await Promise.all([
        api(
          "/mock-exams/" + examId +
          "/students?branch_id=" + branch
        ),
        api(
          "/mock-exams/" + examId +
          "/scores?branch_id=" + branch
        )
      ]);

      if (
        requestId !== mockResultsRequestId ||
        Number(state.currentExam?.id) !== examId ||
        Number(state.branchId) !== branchId
      ) {
        return;
      }

      const students = studentData.students || [];
      const scores = scoreData.scores || [];

      const subjects = state.subjects.filter(subject =>
        Number(subject.mock_id) === examId
      );

      const previousFilter = filter.value;

      filter.replaceChildren(
        new Option("All Subjects", "all")
      );

      for (const subject of subjects) {
        filter.add(
          new Option(
            subject.subject || "Subject " + subject.id,
            String(subject.id)
          )
        );
      }

      if (
        previousFilter === "all" ||
        subjects.some(subject =>
          String(subject.id) === previousFilter
        )
      ) {
        filter.value = previousFilter;
      }

      renderMockResults(students, subjects, scores);

    } catch (error) {
      if (requestId === mockResultsRequestId) {
        clearMockResultsTable(
          "Unable to load examination results."
        );

        mockResultsNotice(error.message, true);
      }

    } finally {
      if (requestId === mockResultsRequestId) {
        button.disabled = false;
      }
    }
  }

  const mockResultsButton = $("loadMockResultsBtn");

  if (mockResultsButton) {
    mockResultsButton.addEventListener(
      "click",
      () => loadMockResults()
    );
  }

  const mockResultsFilter = $("mockResultsSubject");

  if (mockResultsFilter) {
    mockResultsFilter.addEventListener(
      "change",
      () => loadMockResults()
    );
  }



  // STEP 451G — MOCK EXPORT WORKSPACE

  let mockExportPrepared = null;

  function mockExportSetStatus(text, isError = false) {
    const element = $("mockExportStatus");
    if (!element) return;

    element.textContent = text;
    element.style.color = isError ? "#b42318" : "#087443";
  }

  function mockExportReset() {
    mockExportPrepared = null;

    const button = $("mockExportDownloadBtn");
    if (button) button.disabled = true;
  }

  async function prepareMockResultsExport() {
    const exam = state.currentExam;
    const branchId = Number(state.branchId);

    if (!exam || !branchId) {
      throw new Error("Select a branch and mock examination first.");
    }

    const examId = Number(exam.id);
    const branch = encodeURIComponent(branchId);

    const branchName =
      $("mockBranch")?.selectedOptions?.[0]?.textContent ||
      state.user?.branch_name ||
      "—";

    $("mockExportBranch").textContent = branchName;

    $("mockExportExam").textContent =
      exam.mock_name || exam.name || "Mock " + examId;

    $("mockExportYear").textContent =
      exam.academic_year || "—";

    const [studentData, scoreData] = await Promise.all([
      api(
        "/mock-exams/" + examId +
        "/students?branch_id=" + branch
      ),
      api(
        "/mock-exams/" + examId +
        "/scores?branch_id=" + branch
      )
    ]);

    if (
      Number(state.currentExam?.id) !== examId ||
      Number(state.branchId) !== branchId
    ) {
      throw new Error(
        "Examination selection changed. Please load results again."
      );
    }

    const students = studentData.students || [];
    const scores = scoreData.scores || [];

    const subjects = state.subjects.filter(subject =>
      Number(subject.mock_id) === examId
    );

    if (!students.length) {
      throw new Error("No students found for this examination.");
    }

    if (!subjects.length) {
      throw new Error("No examination subjects found.");
    }

    const rows = [];

    for (const student of students) {
      for (const subject of subjects) {
        const saved = scores.find(score =>
          Number(score.student_id) === Number(student.id) &&
          Number(score.subject_setting_id) === Number(subject.id)
        );

        rows.push([
          displayStudentName(student),
          student.admission_number || student.student_id || "",
          subject.subject || "",
          saved?.objectives_score ?? "",
          saved?.written_score ?? "",
          saved?.total_score ?? "",
          saved?.grade ?? "",
          saved?.remarks || "Not Entered"
        ]);
      }
    }

    mockExportPrepared = {
      examId,
      branchId,
      branchName,
      examName: exam.mock_name || exam.name || "Mock " + examId,
      year: exam.academic_year || "",
      studentCount: students.length,
      rows
    };

    $("mockExportDownloadBtn").disabled = false;

    mockExportSetStatus(
      students.length + " student(s), " +
      subjects.length + " subject(s), " +
      rows.length + " result row(s) ready for export."
    );
  }

  function downloadPreparedMockResults() {
    const data = mockExportPrepared;

    if (!data) {
      throw new Error("Click Load Results before exporting.");
    }

    if (
      Number(state.currentExam?.id) !== data.examId ||
      Number(state.branchId) !== data.branchId
    ) {
      mockExportReset();

      throw new Error(
        "Examination selection changed. Load results again."
      );
    }

    const rows = [
      ["DELIGHT INTERNATIONAL SCHOOL"],
      ["BASIC 9 MOCK EXAMINATION RESULTS"],
      ["Branch", data.branchName],
      ["Examination", data.examName],
      ["Academic Year", data.year],
      [],
      [
        "Student",
        "Admission No.",
        "Subject",
        "Objectives",
        "Written",
        "Total",
        "Grade",
        "Remarks"
      ],
      ...data.rows
    ];

    const csv = rows.map(row =>
      row.map(csvCell).join(",")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      "Basic9_" +
      safeFilename(data.examName) +
      "_All_Results.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    mockExportSetStatus(
      "Excel-compatible results exported successfully for " +
      data.studentCount + " student(s)."
    );
  }

  const mockExportLoadButton = $("mockExportLoadBtn");
  const mockExportDownloadButton = $("mockExportDownloadBtn");

  if (mockExportLoadButton) {
    mockExportLoadButton.addEventListener("click", async () => {
      mockExportReset();
      mockExportLoadButton.disabled = true;

      mockExportSetStatus("Loading saved examination results...");

      try {
        await prepareMockResultsExport();
      } catch (error) {
        mockExportSetStatus(error.message, true);
      } finally {
        mockExportLoadButton.disabled = false;
      }
    });
  }

  if (mockExportDownloadButton) {
    mockExportDownloadButton.addEventListener("click", () => {
      try {
        downloadPreparedMockResults();
      } catch (error) {
        mockExportSetStatus(error.message, true);
      }
    });
  }

  // END STEP 451G


  // STEP 452B — LIVE MOCK DASHBOARD

  let mockDashboardRequestId = 0;

  function mockDashText(id, value) {
    const element = $(id);
    if (element) element.textContent = String(value ?? "—");
  }

  function mockDashNotice(text, isError = false) {
    const element = $("mockDashMessage");
    if (!element) return;

    element.textContent = text;
    element.style.color = isError ? "#b42318" : "#087443";
  }


  // STEP 457B — SUBJECT PERFORMANCE PIE CHART

  // STEP 458A — HORIZONTAL SUBJECT BAR CHART
  function renderMockSubjectPieChart(subjectData) {

    const chart = document.getElementById("mockSubjectPieChart");
    const averageElement = document.getElementById("mockPieAverage");

    if (!chart || !averageElement) return;

    const data = subjectData
      .filter(item =>
        Number.isFinite(item.average) &&
        item.average >= 0
      )
      .sort((a, b) =>
        b.average - a.average ||
        a.name.localeCompare(b.name)
      );

    chart.replaceChildren();

    if (!data.length) {
      averageElement.textContent = "—";
      chart.textContent = "No subject scores available.";
      return;
    }

    const total = data.reduce(
      (sum, item) => sum + item.average,
      0
    );

    averageElement.textContent =
      (total / data.length).toFixed(2);

    const colors = [
      "#073b70",
      "#0875a7",
      "#0f93b8",
      "#18a0a6",
      "#27ae60",
      "#7353ba",
      "#e67e22",
      "#2980b9",
      "#d35470",
      "#7f8c8d"
    ];

    data.forEach((item, index) => {

      const row = document.createElement("div");
      row.className = "mock-subject-bar-row";

      const label = document.createElement("div");
      label.className = "mock-subject-bar-label";

      const rank = document.createElement("span");
      rank.className = "mock-subject-bar-rank";
      rank.textContent = String(index + 1);

      const name = document.createElement("span");
      name.textContent = item.name;

      label.append(rank, name);

      const track = document.createElement("div");
      track.className = "mock-subject-bar-track";

      const fill = document.createElement("div");
      fill.className = "mock-subject-bar-fill";

      fill.style.width =
        Math.min(100, Math.max(0, item.average)) + "%";

      fill.style.background =
        colors[index % colors.length];

      track.appendChild(fill);

      const value = document.createElement("strong");
      value.className = "mock-subject-bar-value";
      value.textContent = item.average.toFixed(2);

      row.append(label, track, value);
      chart.appendChild(row);
    });

    chart.setAttribute(
      "aria-label",
      "Subject performance ranked highest to lowest: " +
      data.map(item =>
        item.name + " " + item.average.toFixed(2)
      ).join(", ")
    );
  }

  // END STEP 457B

async function loadMockDashboard() {
    const requestId = ++mockDashboardRequestId;

    const exam = state.currentExam;
    const branchId = Number(state.branchId);

    mockDashText("mockDashExams", state.exams.length);

    if (!exam || !branchId) {
      mockDashNotice(
        "Select a branch and examination under Mock Examinations first."
      );
      return;
    }

    const examId = Number(exam.id);
    const branch = encodeURIComponent(branchId);

    mockDashNotice("Loading dashboard statistics...");

    try {
      const [studentData, scoreData] = await Promise.all([
        api(
          "/mock-exams/" + examId +
          "/students?branch_id=" + branch
        ),
        api(
          "/mock-exams/" + examId +
          "/scores?branch_id=" + branch
        )
      ]);

      if (
        requestId !== mockDashboardRequestId ||
        Number(state.currentExam?.id) !== examId ||
        Number(state.branchId) !== branchId
      ) {
        return;
      }

      const students = studentData.students || [];
      const scores = scoreData.scores || [];

      const subjects = state.subjects.filter(subject =>
        Number(subject.mock_id) === examId
      );

      const studentIds = new Set(
        students.map(student => Number(student.id))
      );

      const subjectIds = new Set(
        subjects.map(subject => Number(subject.id))
      );

      const validScores = scores.filter(score =>
        studentIds.has(Number(score.student_id)) &&
        subjectIds.has(Number(score.subject_setting_id)) &&
        Number.isFinite(Number(score.total_score)) &&
        score.total_score !== null
      );

      const total = validScores.reduce(
        (sum, score) => sum + Number(score.total_score),
        0
      );

      const average = validScores.length
        ? (total / validScores.length).toFixed(2)
        : "—";

      mockDashText("mockDashStudents", students.length);
      mockDashText("mockDashSubjects", subjects.length);
      mockDashText("mockDashScores", validScores.length);
      mockDashText("mockDashAverage", average);
      mockDashText("mockDashStatus", exam.status || "—");

      mockDashText(
        "mockDashBranch",
        $("mockBranch")?.selectedOptions?.[0]?.textContent || "—"
      );

      mockDashText(
        "mockDashExam",
        exam.mock_name || exam.name || "Mock " + examId
      );

      mockDashText(
        "mockDashYear",
        exam.academic_year || "—"
      );


      // STEP 457B: Collect averages for the pie chart.
      const mockPieSubjectData = [];

      const body = $("mockDashSubjectsBody");
      body.replaceChildren();

      for (const subject of subjects) {
        const subjectScores = validScores.filter(score =>
          Number(score.subject_setting_id) === Number(subject.id)
        );

        const marks = subjectScores.map(score =>
          Number(score.total_score)
        );

        const subjectAverage = marks.length
          ? (
              marks.reduce((sum, mark) => sum + mark, 0) /
              marks.length
            ).toFixed(2)
          : "—";


        // STEP 457B: Store the subject's calculated average.
        if (marks.length) {
          mockPieSubjectData.push({
            name: subject.subject || "Unknown Subject",
            average: Number(subjectAverage)
          });
        }

        const row = body.insertRow();

        const values = [
          subject.subject || "—",
          marks.length,
          subjectAverage,
          marks.length ? Math.max(...marks).toFixed(2) : "—",
          marks.length ? Math.min(...marks).toFixed(2) : "—"
        ];

        for (const value of values) {
          row.insertCell().textContent = String(value);
        }
      }


      renderMockSubjectPieChart(mockPieSubjectData);

      if (!subjects.length) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "No subjects configured.";
      }

      mockDashNotice(
        "Dashboard updated successfully for " +
        students.length + " student(s)."
      );

    } catch (error) {
      if (requestId === mockDashboardRequestId) {
        mockDashNotice(error.message, true);
      }
    }
  }

  const mockDashRefreshButton = $("mockDashRefreshBtn");

  if (mockDashRefreshButton) {
    mockDashRefreshButton.addEventListener(
      "click",
      () => loadMockDashboard()
    );
  }

  // END STEP 452B

  // STEP 449K — MOCK RESULTS PRINT AND EXPORT

  function getDisplayedMockResults() {
    const table = document.querySelector(
      "#mockResultsWorkspace .mock-results-table"
    );

    if (!table) {
      throw new Error("Mock Results table not found.");
    }

    const headers = Array.from(
      table.querySelectorAll("thead th")
    ).map(cell => cell.textContent.trim());

    const rows = Array.from(
      table.querySelectorAll("tbody tr")
    ).filter(row =>
      row.cells.length === headers.length
    ).map(row =>
      Array.from(row.cells).map(cell =>
        cell.textContent.trim()
      )
    );

    if (!rows.length) {
      throw new Error(
        "No examination results available. Refresh Results first."
      );
    }

    return { headers, rows };
  }

  function getMockResultsDetails() {
    const value = id =>
      $(id)?.textContent?.trim() || "—";

    return {
      branch: value("mockResultsBranch"),
      examination: value("mockResultsExam"),
      year: value("mockResultsYear"),
      status: value("mockResultsStatus")
    };
  }

  function escapeMockResultsHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );
  }

  function printDisplayedMockResults() {
    const { headers, rows } = getDisplayedMockResults();
    const details = getMockResultsDetails();

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Allow pop-ups for this website to print results."
      );
    }

    const escape = escapeMockResultsHtml;

    const heading = headers.map(item =>
      "<th>" + escape(item) + "</th>"
    ).join("");

    const body = rows.map(row =>
      "<tr>" + row.map(item =>
        "<td>" + escape(item) + "</td>"
      ).join("") + "</tr>"
    ).join("");

    const documentHtml = [
      "<!DOCTYPE html>",
      "<html><head><meta charset='utf-8'>",
      "<title>Basic 9 Mock Examination Results</title>",
      "<style>",
      "@page{size:A4 landscape;margin:12mm}",
      "body{font-family:Arial,sans-serif;color:#172b4d}",
      "h1{text-align:center;font-size:20px;margin-bottom:4px}",
      "h2{text-align:center;font-size:16px;margin-top:0}",
      ".info{margin:18px 0;line-height:1.7;font-size:12px}",
      "table{width:100%;border-collapse:collapse;font-size:10px}",
      "th{background:#103d70;color:white;padding:9px 6px;",
      "border:1px solid #103d70;text-align:left}",
      "td{padding:8px 6px;border:1px solid #cbd5e1}",
      "tr:nth-child(even){background:#f1f5f9}",
      "thead{display:table-header-group}",
      "tr{break-inside:avoid}",
      "@media print{",
      "th{print-color-adjust:exact;-webkit-print-color-adjust:exact}",
      "}",
      "</style></head><body>",
      "<h1>DELIGHT INTERNATIONAL SCHOOL</h1>",
      "<h2>BASIC 9 MOCK EXAMINATION RESULTS</h2>",
      "<div class='info'>",
      "<strong>Branch:</strong> " + escape(details.branch) + "<br>",
      "<strong>Examination:</strong> " +
        escape(details.examination) + "<br>",
      "<strong>Academic Year:</strong> " +
        escape(details.year) + "<br>",
      "<strong>Status:</strong> " + escape(details.status),
      "</div>",
      "<table><thead><tr>" + heading + "</tr></thead>",
      "<tbody>" + body + "</tbody></table>",
      "</body></html>"
    ].join("");

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();

    printWindow.focus();
    printWindow.print();
  }

  function exportDisplayedMockResults() {
    const { headers, rows } = getDisplayedMockResults();
    const details = getMockResultsDetails();

    const data = [
      ["DELIGHT INTERNATIONAL SCHOOL"],
      ["BASIC 9 MOCK EXAMINATION RESULTS"],
      ["Branch", details.branch],
      ["Examination", details.examination],
      ["Academic Year", details.year],
      ["Status", details.status],
      [],
      headers,
      ...rows
    ];

    const csv = data.map(row =>
      row.map(csvCell).join(",")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    link.download =
      "Basic9_" +
      safeFilename(details.examination) +
      "_Results.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function updateMockResultsActionButtons() {
    const printButton = $("printMockResultsBtn");
    const exportButton = $("exportMockResultsBtn");

    if (!printButton || !exportButton) return;

    const table = $("mockResultsBody");

    const hasResults = Boolean(
      table &&
      Array.from(table.rows).some(row =>
        row.cells.length === 8
      )
    );

    printButton.disabled = !hasResults;
    exportButton.disabled = !hasResults;
  }

  const printResultsButton = $("printMockResultsBtn");
  const exportResultsButton = $("exportMockResultsBtn");

  if (printResultsButton) {
    printResultsButton.addEventListener("click", () => {
      try {
        printDisplayedMockResults();
      } catch (error) {
        mockResultsNotice(error.message, true);
      }
    });
  }

  if (exportResultsButton) {
    exportResultsButton.addEventListener("click", () => {
      try {
        exportDisplayedMockResults();
      } catch (error) {
        mockResultsNotice(error.message, true);
      }
    });
  }

  if ($("mockResultsBody")) {
    const observer = new MutationObserver(
      updateMockResultsActionButtons
    );

    observer.observe($("mockResultsBody"), {
      childList: true,
      subtree: true
    });

    updateMockResultsActionButtons();
  }

  // END STEP 449K

  async function loadStudentScores() {
    if (!state.currentExam || !state.currentSubject) {
      throw new Error("Select an examination and subject first.");
    }

    const examId = state.currentExam.id;
    const branch = encodeURIComponent(state.branchId);

    const [studentData, scoreData] = await Promise.all([
      api(`/mock-exams/${examId}/students?branch_id=${branch}`),
      api(`/mock-exams/${examId}/scores?branch_id=${branch}`)
    ]);

    state.students = studentData.students || [];
    state.scores = scoreData.scores || [];

    renderStudentScores();

    message(`${state.students.length} student(s) loaded.`);
  }

  $("loadMockScoresBtn").addEventListener("click", () => {
    loadStudentScores().catch(error => message(error.message, true));
  });


  async function loadMockClasses() {
    const branchId = Number($("mockBranch").value);

    clearSelect("mockClass", "Select Basic 9 class");

    if (!branchId) return;

    const data = await api(
      `/classes?branch_id=${encodeURIComponent(branchId)}`
    );

    const classes = Array.isArray(data)
      ? data
      : (data.classes || []);

    const basic9Classes = classes.filter(item => {
      const name = String(
        item.class_name || item.name || ""
      ).toLowerCase();

      return (
        name.includes("basic 9") ||
        name.includes("basic nine") ||
        name.includes("jhs 3") ||
        name.includes("jhs three")
      );
    });

    fillSelect(
      "mockClass",
      basic9Classes,
      item => item.id,
      item => item.class_name || item.name || `Class ${item.id}`
    );

    if (!basic9Classes.length) {
      message(
        "No Basic 9 class found for the selected branch.",
        true
      );
    }
  }

  async function createMockExamination() {
    const branchId = Number($("mockBranch").value);
    const classId = Number($("mockClass").value);
    const mockName = $("mockName").value.trim();
    const academicYear = $("mockAcademicYear").value.trim();

    if (!branchId || !classId || !mockName || !academicYear) {
      throw new Error(
        "Select branch and class, then enter mock name and academic year."
      );
    }

    if (!window.confirm(
      `Create ${mockName} for academic year ${academicYear}?`
    )) {
      return;
    }

    const result = await api("/mock-exams", {
      method: "POST",
      body: JSON.stringify({
        branch_id: branchId,
        class_id: classId,
        mock_name: mockName,
        academic_year: academicYear
      })
    });

    await loadExams();

    if (result.mock_id) {
      $("mockExam").value = String(result.mock_id);
      await loadSubjects();
    }

    message(result.message || "Mock examination created.");
  }

  async function addMockSubject() {
    if (!state.currentExam) {
      throw new Error("Select a mock examination first.");
    }

    if (!["draft", "active"].includes(
      String(state.currentExam.status).toLowerCase()
    )) {
      throw new Error(
        "Subjects can only be added while the examination is Draft or Active."
      );
    }

    const subject = $("mockNewSubject").value.trim();
    const objectivesMax = Number($("mockMarkingFormat").value);
    const writtenMax = 100 - objectivesMax;

    if (!subject) {
      throw new Error("Select a subject.");
    }

    // Prevent duplicate subjects within the selected examination.
    const normalizedSubject = subject.trim().toLowerCase();

    const alreadyConfigured = state.subjects.some(
      item =>
        String(item.subject || "").trim().toLowerCase() ===
        normalizedSubject
    );

    if (alreadyConfigured) {
      throw new Error(
        `${subject} is already configured for this mock examination.`
      );
    }

    if (![30, 40].includes(objectivesMax)) {
      throw new Error("Select a valid marking format.");
    }

    const result = await api(
      `/mock-exams/${state.currentExam.id}/subjects`,
      {
        method: "POST",
        body: JSON.stringify({
          branch_id: state.branchId,
          subject,
          objectives_max: objectivesMax,
          written_max: writtenMax
        })
      }
    );

    $("mockNewSubject").value = "";

    await loadSubjects();

    message(result.message || "Mock subject added.");
  }

  async function changeMockStatus(requestedStatus) {
    if (!state.currentExam) {
      throw new Error("Select a mock examination first.");
    }

    const currentStatus = state.currentExam.status;

    if (
      (requestedStatus === "active" && currentStatus !== "draft") ||
      (requestedStatus === "completed" && currentStatus !== "active")
    ) {
      throw new Error(
        `Cannot change examination from ${currentStatus} ` +
        `to ${requestedStatus}.`
      );
    }

    const warning = requestedStatus === "completed"
      ? "Completing this examination will stop further score entry."
      : "Activating this examination will allow score entry.";

    if (!window.confirm(
      `${warning}\n\nContinue?`
    )) {
      return;
    }

    const result = await api(
      `/mock-exams/${state.currentExam.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          branch_id: state.branchId,
          status: requestedStatus
        })
      }
    );

    const examId = state.currentExam.id;

    await loadExams();

    $("mockExam").value = String(examId);

    await loadSubjects();

    message(
      result.message ||
      `Examination status changed to ${requestedStatus}.`
    );
  }

  function administrationAction(action) {
    return async () => {
      try {
        await action();
      } catch (error) {
        message(error.message, true);
      }
    };
  }

  $("createMockBtn").addEventListener(
    "click",
    administrationAction(createMockExamination)
  );

  $("addMockSubjectBtn").addEventListener(
    "click",
    administrationAction(addMockSubject)
  );

  $("activateMockBtn").addEventListener(
    "click",
    administrationAction(() => changeMockStatus("active"))
  );

  $("completeMockBtn").addEventListener(
    "click",
    administrationAction(() => changeMockStatus("completed"))
  );

  $("mockBranch").addEventListener("change", () => {
    if (ADMIN_ROLES.includes(state.user?.role)) {
      loadMockClasses().catch(error => message(error.message, true));
    }
  });

  // Load Basic 9 classes after branch selection is initialized.
  const originalLoadBranches = loadBranches;

  loadBranches = async function () {
    await originalLoadBranches();

    if (ADMIN_ROLES.includes(state.user?.role)) {
      await loadMockClasses();
    }
  };


  function csvCell(value) {
    let text = String(value ?? "");

    // Prevent spreadsheet applications interpreting student data as formulas.
    if (/^[\s]*[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
  }

  function safeFilename(value) {
    return String(value || "Mock")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 70);
  }

  async function exportMockScores() {
    if (!state.currentExam || !state.currentSubject) {
      throw new Error("Select an examination and subject first.");
    }

    // Fetch the latest saved records rather than exporting unsaved inputs.
    await loadStudentScores();

    const exam = state.currentExam;
    const subject = state.currentSubject;

    const headings = [
      "Student",
      "Admission Number",
      "Subject",
      "Objectives",
      "Written",
      "Total",
      "Grade",
      "Remarks"
    ];

    const rows = [
      ["DELIGHT INTERNATIONAL SCHOOL"],
      ["BASIC 9 MOCK EXAMINATION RESULTS"],
      ["Examination", exam.mock_name],
      ["Academic Year", exam.academic_year],
      ["Subject", subject.subject],
      ["Marking Format",
        `${subject.objectives_max} Objectives + ${subject.written_max} Written`],
      [],
      headings
    ];

    for (const student of state.students) {
      const score = state.scores.find(item =>
        Number(item.student_id) === Number(student.id) &&
        Number(item.subject_setting_id) === Number(subject.id)
      );

      rows.push([
        displayStudentName(student),
        student.admission_number || student.student_id || "",
        subject.subject,
        score?.objectives_score ?? "",
        score?.written_score ?? "",
        score?.total_score ?? "",
        score?.grade ?? "",
        score?.remarks ?? ""
      ]);
    }

    const csv = "\uFEFF" + rows
      .map(row => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = [
      "Basic9",
      safeFilename(exam.mock_name),
      safeFilename(subject.subject),
      safeFilename(exam.academic_year)
    ].join("_") + ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    message(
      `Excel-compatible results exported for ${subject.subject}.`
    );
  }


  // STEP 446X — DOWNLOAD MOCK SCORE EXCEL TEMPLATE
  $("downloadMockTemplateBtn").addEventListener("click", async () => {
    const button = $("downloadMockTemplateBtn");

    try {
      if (
        !state.branchId ||
        !state.currentExam ||
        !state.currentSubject
      ) {
        throw new Error(
          "Select a branch, mock examination and subject first."
        );
      }

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      button.disabled = true;
      button.textContent = "Preparing Excel...";

      const apiOrigin =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? `${window.location.protocol}//${window.location.hostname}:5000`
          : window.location.origin;

      const params = new URLSearchParams({
        branch_id: String(state.branchId),
        subject_setting_id: String(state.currentSubject.id)
      });

      const url =
        `${apiOrigin}/api/mock-exams/` +
        `${state.currentExam.id}/scores/template?${params}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.message ||
          `Excel download failed: HTTP ${response.status}`
        );
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The downloaded Excel file is empty.");
      }

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      const subjectName = state.currentSubject.subject
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      link.href = downloadUrl;
      link.download =
        `Mock_${state.currentExam.id}_${subjectName}_Scores.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);

      message("Excel score template downloaded successfully.");

    } catch (error) {
      message(error.message, true);

    } finally {
      button.disabled = false;
      button.textContent = "Download Score Template";
    }
  });


  // STEP 447S — EXCEL UPLOAD PREVIEW
  let mockExcelPreviewRequest = 0;
  let validatedMockExcel = null;

  function resetMockExcelPreview() {
    mockExcelPreviewRequest++;
    validatedMockExcel = null;

    $("mockExcelPreviewSection").style.display = "none";
    $("mockExcelPreviewBody").replaceChildren();
    $("mockExcelPreviewErrors").replaceChildren();
    $("mockExcelPreviewErrors").style.display = "none";
    $("mockExcelPreviewMessage").textContent = "";
    $("confirmMockExcelImportBtn").disabled = true;
    $("mockExcelFileInput").value = "";
  }

  $("uploadMockExcelBtn").addEventListener("click", () => {
    if (
      !state.branchId ||
      !state.currentExam ||
      !state.currentSubject
    ) {
      message(
        "Select a branch, mock examination and subject first.",
        true
      );
      return;
    }

    $("mockExcelFileInput").click();
  });

  $("cancelMockExcelPreviewBtn").addEventListener(
    "click",
    resetMockExcelPreview
  );

  $("mockExcelFileInput").addEventListener("change", async event => {
    const file = event.target.files[0];

    if (!file) return;

    const button = $("uploadMockExcelBtn");
    const previewSection = $("mockExcelPreviewSection");
    const previewBody = $("mockExcelPreviewBody");
    const errorsElement = $("mockExcelPreviewErrors");
    const previewMessage = $("mockExcelPreviewMessage");

    const requestId = ++mockExcelPreviewRequest;
    validatedMockExcel = null;

    const exam = state.currentExam;
    const subject = state.currentSubject;
    const branchId = state.branchId;

    previewSection.style.display = "block";
    previewBody.replaceChildren();
    errorsElement.replaceChildren();
    errorsElement.style.display = "none";
    $("confirmMockExcelImportBtn").disabled = true;

    try {
      if (!exam || !subject || !branchId) {
        throw new Error(
          "Select a branch, examination and subject first."
        );
      }

      if (!/\.xlsx$/i.test(file.name)) {
        throw new Error("Please select an .xlsx Excel file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Excel file must not exceed 5 MB.");
      }

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      button.disabled = true;
      button.textContent = "Checking Excel...";
      previewMessage.textContent = "Validating uploaded scores...";

      const apiOrigin =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? window.location.protocol + "//" +
            window.location.hostname + ":5000"
          : window.location.origin;

      const form = new FormData();

      form.append("file", file);
      form.append("branch_id", String(branchId));
      form.append("subject_setting_id", String(subject.id));

      const response = await fetch(
        apiOrigin + "/api/mock-exams/" +
        encodeURIComponent(exam.id) +
        "/scores/preview-excel",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token
          },
          body: form
        }
      );

      const data = await response.json().catch(() => ({}));

      if (requestId !== mockExcelPreviewRequest) return;

      if (!response.ok) {
        throw new Error(
          data.message || "Excel preview failed."
        );
      }

      if (
        Number(state.branchId) !== Number(branchId) ||
        Number(state.currentExam?.id) !== Number(exam.id) ||
        Number(state.currentSubject?.id) !== Number(subject.id)
      ) {
        resetMockExcelPreview();
        throw new Error(
          "Selection changed. Please upload the file again."
        );
      }

      const rows = Array.isArray(data.preview)
        ? data.preview
        : [];

      rows.forEach(item => {
        const tr = document.createElement("tr");

        [
          item.student_name,
          item.admission_number,
          item.objectives_score,
          item.written_score,
          item.total_score,
          item.grade,
          item.remarks
        ].forEach(value => {
          const td = document.createElement("td");
          td.textContent = String(value ?? "");
          tr.appendChild(td);
        });

        previewBody.appendChild(tr);
      });

      if (!rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 7;
        td.textContent = "No completed student scores found.";

        tr.appendChild(td);
        previewBody.appendChild(tr);
      }

      const errors = Array.isArray(data.errors)
        ? data.errors
        : [];

      if (errors.length) {
        errorsElement.style.display = "block";

        const heading = document.createElement("strong");
        heading.textContent = "Please correct these errors:";
        errorsElement.appendChild(heading);

        const list = document.createElement("ul");

        errors.forEach(error => {
          const li = document.createElement("li");
          li.textContent = String(error);
          list.appendChild(li);
        });

        errorsElement.appendChild(list);
      }

      previewMessage.textContent =
        (data.message || "Excel preview completed.") +
        " Students previewed: " + rows.length + ".";

      if (data.valid && rows.length > 0) {
        validatedMockExcel = {
          file,
          examId: Number(exam.id),
          subjectId: Number(subject.id),
          branchId: Number(branchId),
          studentCount: rows.length
        };

        if (exam.status === "active") {
          $("confirmMockExcelImportBtn").disabled = false;
        } else {
          previewMessage.textContent +=
            " This examination must be Active before saving.";
        }
      }

      message(
        data.valid
          ? "Excel validated. Review the preview below."
          : "Excel contains errors. No scores were saved.",
        !data.valid
      );

    } catch (error) {
      if (requestId === mockExcelPreviewRequest) {
        previewMessage.textContent = error.message;
        message(error.message, true);
      }

    } finally {
      button.disabled = false;
      button.textContent = "Upload Completed Excel";
      $("confirmMockExcelImportBtn").disabled =
        !validatedMockExcel ||
        state.currentExam?.status !== "active";
      event.target.value = "";
    }
  });


  // STEP 448D — EXCEL IMPORT CONFIRMATION
  ["mockBranch", "mockExam", "mockSubject"].forEach(id => {
    $(id).addEventListener("change", resetMockExcelPreview);
  });

  $("confirmMockExcelImportBtn").addEventListener("click", async () => {
    const selected = validatedMockExcel;
    const button = $("confirmMockExcelImportBtn");

    try {
      if (!selected) {
        throw new Error(
          "Upload and validate an Excel file before saving."
        );
      }

      if (
        Number(state.branchId) !== selected.branchId ||
        Number(state.currentExam?.id) !== selected.examId ||
        Number(state.currentSubject?.id) !== selected.subjectId
      ) {
        resetMockExcelPreview();
        throw new Error(
          "Your examination selection changed. Upload again."
        );
      }

      if (state.currentExam?.status !== "active") {
        throw new Error(
          "Only Active mock examinations accept scores."
        );
      }

      const confirmed = window.confirm(
        "Save " + selected.studentCount +
        " student score(s) from this Excel file? " +
        "Existing scores for these students and this subject " +
        "will be updated."
      );

      if (!confirmed) return;

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      button.disabled = true;
      button.textContent = "Saving Scores...";

      const apiOrigin =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? window.location.protocol + "//" +
            window.location.hostname + ":5000"
          : window.location.origin;

      const form = new FormData();

      form.append("file", selected.file);
      form.append("branch_id", String(selected.branchId));
      form.append(
        "subject_setting_id",
        String(selected.subjectId)
      );

      const response = await fetch(
        apiOrigin + "/api/mock-exams/" +
        encodeURIComponent(selected.examId) +
        "/scores/import-excel",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token
          },
          body: form
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const details = Array.isArray(data.errors)
          ? data.errors.slice(0, 5).join("; ")
          : "";

        throw new Error(
          (data.message || "Excel import failed.") +
          (details ? " " + details : "")
        );
      }

      const savedCount = Number(data.saved_count) || 0;

      resetMockExcelPreview();

      message(
        "Successfully saved " + savedCount +
        " student score(s) from Excel."
      );

      await loadStudentScores();

      message(
        "Successfully saved " + savedCount +
        " student score(s) from Excel."
      );

    } catch (error) {
      message(error.message, true);

    } finally {
      button.textContent = "Confirm and Save Scores";
      button.disabled = true;
    }
  });

  $("exportMockExcelBtn").addEventListener("click", async () => {
    try {
      await exportMockScores();
    } catch (error) {
      message(error.message, true);
    }
  });


  async function printAllMockReports() {
    if (!state.currentExam) {
      throw new Error("Select a mock examination first.");
    }

    if (typeof window.DelightMockReport?.buildReportCard !== "function") {
      throw new Error("Mock report card template is not loaded.");
    }

    const exam = {
      ...state.currentExam,
      branch_name: getMockReportBranchName()
    };
    const branchId = state.branchId;

    // Open immediately after the user's click to avoid popup blocking.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Allow pop-ups for this website to print mock report cards."
      );
    }

    try {
      printWindow.document.open();
      printWindow.document.write(
        "<!DOCTYPE html><html><head><title>Preparing Mock Reports</title>" +
        "</head><body><p>Preparing mock examination reports...</p></body></html>"
      );
      printWindow.document.close();

      const examId = encodeURIComponent(exam.id);
      const branchQuery = `branch_id=${encodeURIComponent(branchId)}`;

      const [studentsData, subjectsData, scoresData, settingsData] =
        await Promise.all([
          api(`/mock-exams/${examId}/students?${branchQuery}`),
          api(`/mock-exams/${examId}/subjects?${branchQuery}`),
          api(`/mock-exams/${examId}/scores?${branchQuery}`),
          api("/settings")
        ]);

      const students = studentsData.students || [];
      const subjects = subjectsData.subjects || [];
      const scores = scoresData.scores || [];
      const settings = settingsData.settings || {};

      if (!students.length) {
        throw new Error(
          "No active students found for this mock examination."
        );
      }

      if (!subjects.length) {
        throw new Error(
          "No accessible subjects found for this mock examination."
        );
      }

      const safe = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]);


      const reportRemarksByStudent = new Map();

      for (const student of students) {
        const remarks = await fetchMockReportRemarks(
          exam.id,
          student.id,
          branchId
        );

        reportRemarksByStudent.set(
          Number(student.id),
          remarks
        );
      }

      const pages = students.map((student, index) =>
        window.DelightMockReport.buildReportCard({
          student,
          exam,
          subjects,
          scores,
          settings,
          reportRemarks: reportRemarksByStudent.get(Number(student.id)) || {},
          pageNumber: index + 1,
          totalPages: students.length
        })
      ).join("\n");

      const title = safe(
        `Basic 9 ${exam.mock_name || "Mock"} Reports`
      );

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>${window.DelightMockReport.REPORT_STYLES}</style>
          <link rel="stylesheet" href="${new URL("../css/mock-report-card-modern.css", window.location.href).href}">
        </head>
        <body>
          ${pages}
        </body>
        </html>
      `);
      printWindow.document.close();

      // STEP 440W — WAIT FOR BULK REPORT STYLESHEET
      // Wait for the stylesheet, school logo and student photographs.
      await Promise.race([
        Promise.all([
          ...Array.from(printWindow.document.images).map(img => {
            if (img.complete) return Promise.resolve();

            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }),

          ...Array.from(
            printWindow.document.querySelectorAll(
              'link[rel="stylesheet"]'
            )
          ).map(link => new Promise(resolve => {
            if (link.sheet) {
              resolve();
              return;
            }

            link.onload = resolve;
            link.onerror = resolve;
          }))
        ]),

        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      if (printWindow.closed) {
        throw new Error("The mock report print window was closed.");
      }

      printWindow.focus();
      printWindow.print();

      message(
        `Prepared ${students.length} mock examination report cards.`
      );

    } catch (error) {
      if (!printWindow.closed) {
        printWindow.close();
      }

      throw error;
    }
  }

  $("printMockReportsBtn").addEventListener("click", async () => {
    try {
      await printAllMockReports();
    } catch (error) {
      message(error.message, true);
    }
  });


  // STEP 440T — REPORT CARD BRANCH NAME

  function getMockReportBranchName() {
    const select = $("mockBranch");

    if (!select || !select.value) {
      return "";
    }

    return select.selectedOptions[0]?.textContent?.trim() || "";
  }

  // STEP 440H — MOCK REPORT CARD STUDENT SELECTION

  let mockReportStudents = [];

  function updateMockReportInformation() {
    const branchSelect = $("mockBranch");

    const branchName = branchSelect?.selectedOptions[0]?.textContent
      || "Select a branch";

    $("mockReportBranchName").textContent = branchName;

    $("mockReportExamName").textContent =
      state.currentExam?.mock_name || "Select a mock examination";

    $("mockReportAcademicYear").textContent =
      state.currentExam?.academic_year || "—";
  }

  function resetMockReportStudents() {
    mockReportStudents = [];

    clearSelect(
      "mockReportStudent",
      "Load students to select a student"
    );

    $("mockReportPreviewBtn").disabled = true;
    $("mockReportPrintSelectedBtn").disabled = true;

    $("mockReportPreviewArea").hidden = true;
    $("mockReportPreviewArea").replaceChildren();

    updateMockReportInformation();
  }

  async function loadMockReportStudents() {
    if (!state.branchId || !state.currentExam) {
      throw new Error(
        "Select a branch and mock examination first."
      );
    }

    resetMockReportStudents();

    $("mockReportStatus").textContent = "Loading students...";

    const examId = encodeURIComponent(state.currentExam.id);
    const branchId = encodeURIComponent(state.branchId);

    const data = await api(
      `/mock-exams/${examId}/students?branch_id=${branchId}`
    );

    const students = Array.isArray(data.students)
      ? data.students
      : [];

    mockReportStudents = students;

    clearSelect(
      "mockReportStudent",
      students.length
        ? "Select student"
        : "No students found"
    );

    fillSelect(
      "mockReportStudent",
      students,
      student => student.id,
      student => {
        const name = displayStudentName(student);

        const admission =
          student.admission_number ||
          student.student_id ||
          "";

        return admission
          ? `${name} — ${admission}`
          : name;
      }
    );

    $("mockReportStatus").textContent =
      `${students.length} student(s) loaded.`;

    updateMockReportInformation();
  }

  $("mockReportLoadStudentsBtn").addEventListener(
    "click",
    async () => {
      try {
        await loadMockReportStudents();
      } catch (error) {
        $("mockReportStatus").textContent = error.message;
        message(error.message, true);
      }
    }
  );

  $("mockReportStudent").addEventListener("change", () => {
    const studentId = Number($("mockReportStudent").value);

    const selected = mockReportStudents.some(
      student => Number(student.id) === studentId
    );

    $("mockReportPreviewBtn").disabled = !selected;
    $("mockReportPrintSelectedBtn").disabled = !selected;

    $("mockReportPreviewArea").hidden = true;
    $("mockReportPreviewArea").replaceChildren();
  });

  $("mockBranch").addEventListener(
    "change",
    resetMockReportStudents
  );

  $("mockExam").addEventListener(
    "change",
    resetMockReportStudents
  );

  updateMockReportInformation();

  // END STEP 440H


  // STEP 450D — SAVED REPORT REMARKS

  let mockRemarksRequestVersion = 0;
  let mockRemarksLoadedStudentId = null;
  let mockRemarksLoadedExamId = null;
  let mockRemarksPermissions = {
    can_edit_teacher: false,
    can_edit_headteacher: false
  };

  function resetMockRemarksForm() {
    mockRemarksRequestVersion++;

    mockRemarksLoadedStudentId = null;
    mockRemarksLoadedExamId = null;

    mockRemarksPermissions = {
      can_edit_teacher: false,
      can_edit_headteacher: false
    };

    $("mockReportRemarksPanel").hidden = true;

    $("mockClassTeacherRemark").value = "";
    $("mockHeadteacherRemark").value = "";

    $("mockClassTeacherRemark").disabled = true;
    $("mockHeadteacherRemark").disabled = true;

    $("mockSaveTeacherRemarkBtn").disabled = true;
    $("mockSaveHeadteacherRemarkBtn").disabled = true;

    $("mockRemarksSaveStatus").textContent =
      "Select a student to load saved remarks.";
  }

  async function loadMockStudentRemarks() {
    const examId = Number(state.currentExam?.id);
    const studentId = Number($("mockReportStudent").value);

    resetMockRemarksForm();

    if (!examId || !studentId || !state.branchId) {
      return;
    }

    const requestVersion = mockRemarksRequestVersion;

    $("mockReportRemarksPanel").hidden = false;

    $("mockRemarksSaveStatus").textContent =
      "Loading saved remarks...";

    try {
      const data = await api(
        "/mock-exams/" +
        encodeURIComponent(examId) +
        "/students/" +
        encodeURIComponent(studentId) +
        "/remarks?branch_id=" +
        encodeURIComponent(state.branchId)
      );

      if (
        requestVersion !== mockRemarksRequestVersion ||
        Number($("mockReportStudent").value) !== studentId ||
        Number(state.currentExam?.id) !== examId
      ) {
        return;
      }

      const remarks = data.remarks || {};
      const permissions = data.permissions || {};

      mockRemarksLoadedStudentId = studentId;
      mockRemarksLoadedExamId = examId;

      mockRemarksPermissions = {
        can_edit_teacher:
          permissions.can_edit_teacher === true,

        can_edit_headteacher:
          permissions.can_edit_headteacher === true
      };

      $("mockClassTeacherRemark").value =
        remarks.class_teacher_remark || "";

      $("mockHeadteacherRemark").value =
        remarks.headteacher_remark || "";

      $("mockClassTeacherRemark").disabled =
        !mockRemarksPermissions.can_edit_teacher;

      $("mockHeadteacherRemark").disabled =
        !mockRemarksPermissions.can_edit_headteacher;

      $("mockSaveTeacherRemarkBtn").disabled =
        !mockRemarksPermissions.can_edit_teacher;

      $("mockSaveHeadteacherRemarkBtn").disabled =
        !mockRemarksPermissions.can_edit_headteacher;

      $("mockRemarksSaveStatus").textContent =
        "Saved remarks loaded. Edit the permitted fields and save.";

    } catch (error) {
      if (requestVersion !== mockRemarksRequestVersion) {
        return;
      }

      $("mockRemarksSaveStatus").textContent =
        "Unable to load remarks: " + error.message;

      message(error.message, true);
    }
  }

  async function saveMockStudentRemark(field) {
    const examId = Number(state.currentExam?.id);
    const studentId = Number($("mockReportStudent").value);

    if (
      !examId ||
      !studentId ||
      mockRemarksLoadedStudentId !== studentId ||
      mockRemarksLoadedExamId !== examId
    ) {
      throw new Error(
        "Select a student and wait for remarks to load."
      );
    }

    const isTeacher =
      field === "class_teacher_remark";

    const permitted = isTeacher
      ? mockRemarksPermissions.can_edit_teacher
      : mockRemarksPermissions.can_edit_headteacher;

    if (!permitted) {
      throw new Error(
        "You do not have permission to edit these remarks."
      );
    }

    const textarea = isTeacher
      ? $("mockClassTeacherRemark")
      : $("mockHeadteacherRemark");

    const button = isTeacher
      ? $("mockSaveTeacherRemarkBtn")
      : $("mockSaveHeadteacherRemarkBtn");

    const value = textarea.value.trim();

    if (value.length > 2000) {
      throw new Error(
        "Remarks cannot exceed 2000 characters."
      );
    }

    const requestVersion = mockRemarksRequestVersion;

    button.disabled = true;

    $("mockRemarksSaveStatus").textContent =
      "Saving remarks...";

    try {
      await api(
        "/mock-exams/" +
        encodeURIComponent(examId) +
        "/students/" +
        encodeURIComponent(studentId) +
        "/remarks?branch_id=" +
        encodeURIComponent(state.branchId),
        {
          method: "PUT",
          body: JSON.stringify({
            [field]: value
          })
        }
      );

      if (
        requestVersion !== mockRemarksRequestVersion ||
        Number($("mockReportStudent").value) !== studentId
      ) {
        return;
      }

      $("mockRemarksSaveStatus").textContent =
        "Remarks saved successfully.";

      $("mockReportPreviewArea").hidden = true;
      $("mockReportPreviewArea").replaceChildren();

    } finally {
      if (requestVersion === mockRemarksRequestVersion) {
        button.disabled = !permitted;
      }
    }
  }

  $("mockReportStudent").addEventListener(
    "change",
    () => {
      loadMockStudentRemarks();
    }
  );

  $("mockReportLoadStudentsBtn").addEventListener(
    "click",
    resetMockRemarksForm
  );

  $("mockBranch").addEventListener(
    "change",
    resetMockRemarksForm
  );

  $("mockExam").addEventListener(
    "change",
    resetMockRemarksForm
  );

  $("mockSaveTeacherRemarkBtn").addEventListener(
    "click",
    async () => {
      try {
        await saveMockStudentRemark(
          "class_teacher_remark"
        );
      } catch (error) {
        $("mockRemarksSaveStatus").textContent =
          error.message;

        message(error.message, true);
      }
    }
  );

  $("mockSaveHeadteacherRemarkBtn").addEventListener(
    "click",
    async () => {
      try {
        await saveMockStudentRemark(
          "headteacher_remark"
        );
      } catch (error) {
        $("mockRemarksSaveStatus").textContent =
          error.message;

        message(error.message, true);
      }
    }
  );

  // END STEP 450D


  // STEP 450F-D — REPORT REMARKS LOADER

  async function fetchMockReportRemarks(examId, studentId, branchId) {
    const data = await api(
      "/mock-exams/" +
      encodeURIComponent(examId) +
      "/students/" +
      encodeURIComponent(studentId) +
      "/remarks?branch_id=" +
      encodeURIComponent(branchId)
    );

    return {
      class_teacher_remark:
        data.remarks?.class_teacher_remark || "",

      headteacher_remark:
        data.remarks?.headteacher_remark || ""
    };
  }

  // END STEP 450F-D

  // STEP 440I — MOCK REPORT CARD PREVIEW

  async function previewSelectedMockReport() {

    if (!state.branchId || !state.currentExam) {
      throw new Error(
        "Select a branch and mock examination first."
      );
    }

    const studentId = Number($("mockReportStudent").value);

    const student = mockReportStudents.find(
      item => Number(item.id) === studentId
    );

    if (!student) {
      throw new Error("Select a student first.");
    }

    if (
      typeof window.DelightMockReport?.buildReportCard
      !== "function"
    ) {
      throw new Error(
        "Mock report card template is not available."
      );
    }

    const examId = encodeURIComponent(state.currentExam.id);
    const branchId = encodeURIComponent(state.branchId);

    $("mockReportStatus").textContent =
      "Preparing student report preview...";

    const [subjectsData, scoresData, settingsData] =
      await Promise.all([
        api(`/mock-exams/${examId}/subjects?branch_id=${branchId}`),
        api(`/mock-exams/${examId}/scores?branch_id=${branchId}`),
        api("/settings")
      ]);

    const subjects = subjectsData.subjects || [];
    const scores = scoresData.scores || [];
    const settings = settingsData.settings || {};

    if (!subjects.length) {
      throw new Error(
        "No subjects configured for this mock examination."
      );
    }


      const reportRemarks = await fetchMockReportRemarks(
        state.currentExam.id,
        student.id,
        state.branchId
      );

      const reportHtml =
      window.DelightMockReport.buildReportCard({
        student,
        exam: {
          ...state.currentExam,
          branch_name: getMockReportBranchName()
        },
        subjects,
        scores,
        settings,
        reportRemarks,
        pageNumber: 1,
        totalPages: 1
      });

    const previewArea = $("mockReportPreviewArea");

    previewArea.innerHTML = reportHtml;
    previewArea.hidden = false;

    $("mockReportStatus").textContent =
      "Report preview prepared successfully.";

    previewArea.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  $("mockReportPreviewBtn").addEventListener(
    "click",
    async () => {
      try {
        await previewSelectedMockReport();
      } catch (error) {
        $("mockReportStatus").textContent = error.message;
        message(error.message, true);
      }
    }
  );

  // END STEP 440I

  // STEP 440J — MOCK REPORT PRINTING CONTROLS

  async function printSelectedMockReport() {

    if (!state.branchId || !state.currentExam) {
      throw new Error(
        "Select a branch and mock examination first."
      );
    }

    const studentId = Number($("mockReportStudent").value);

    const student = mockReportStudents.find(
      item => Number(item.id) === studentId
    );

    if (!student) {
      throw new Error("Select a student first.");
    }

    if (
      typeof window.DelightMockReport?.buildReportCard
      !== "function"
    ) {
      throw new Error(
        "Mock report card template is not available."
      );
    }

    // Open the window immediately following the button click.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Allow pop-ups for this website to print report cards."
      );
    }

    try {

      printWindow.document.open();
      printWindow.document.write(
        "<!DOCTYPE html><html><head>" +
        "<title>Preparing Mock Report</title>" +
        "</head><body><p>Preparing report...</p></body></html>"
      );
      printWindow.document.close();

      const exam = {
        ...state.currentExam,
        branch_name: getMockReportBranchName()
      };

      const examId = encodeURIComponent(exam.id);
      const branchId = encodeURIComponent(state.branchId);

      const [subjectsData, scoresData, settingsData] =
        await Promise.all([
          api(`/mock-exams/${examId}/subjects?branch_id=${branchId}`),
          api(`/mock-exams/${examId}/scores?branch_id=${branchId}`),
          api("/settings")
        ]);

      const subjects = subjectsData.subjects || [];
      const scores = scoresData.scores || [];
      const settings = settingsData.settings || {};

      if (!subjects.length) {
        throw new Error(
          "No subjects configured for this mock examination."
        );
      }


      const reportRemarks = await fetchMockReportRemarks(
        state.currentExam.id,
        student.id,
        state.branchId
      );

      const reportHtml =
        window.DelightMockReport.buildReportCard({
          student,
          exam,
          subjects,
          scores,
          settings,
          reportRemarks,
        pageNumber: 1,
          totalPages: 1
        });

      const stylesheetUrl = new URL(
        "../css/mock-report-card-modern.css",
        window.location.href
      ).href;

      const safeTitle = String(
        `Basic 9 ${exam.mock_name || "Mock"} Report`
      ).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${safeTitle}</title>
          <style>${window.DelightMockReport.REPORT_STYLES}</style>
          <link rel="stylesheet" href="${stylesheetUrl}">
        </head>
        <body>
          ${reportHtml}
        </body>
        </html>
      `);
      printWindow.document.close();

      // Allow the report stylesheet and images time to load.
      await Promise.race([
        Promise.all([
          ...Array.from(printWindow.document.images).map(img => {
            if (img.complete) return Promise.resolve();

            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }),

          ...Array.from(
            printWindow.document.querySelectorAll(
              'link[rel="stylesheet"]'
            )
          ).map(link => new Promise(resolve => {
            if (link.sheet) {
              resolve();
              return;
            }

            link.onload = resolve;
            link.onerror = resolve;
          }))
        ]),

        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      if (printWindow.closed) {
        throw new Error("The report print window was closed.");
      }

      printWindow.focus();
      printWindow.print();

      $("mockReportStatus").textContent =
        "Selected student report prepared for printing.";

    } catch (error) {

      if (!printWindow.closed) {
        printWindow.close();
      }

      throw error;
    }
  }

  $("mockReportPrintSelectedBtn").addEventListener(
    "click",
    async () => {
      try {
        await printSelectedMockReport();
      } catch (error) {
        $("mockReportStatus").textContent = error.message;
        message(error.message, true);
      }
    }
  );

  $("mockReportPrintAllBtn").addEventListener(
    "click",
    async () => {
      try {
        await printAllMockReports();

        $("mockReportStatus").textContent =
          "All mock examination reports prepared for printing.";

      } catch (error) {
        $("mockReportStatus").textContent = error.message;
        message(error.message, true);
      }
    }
  );

  // END STEP 440J



  // Mock report printing connected.




  initialize();
});
