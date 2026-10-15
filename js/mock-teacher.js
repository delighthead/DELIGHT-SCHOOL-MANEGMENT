(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    exams: [],
    subjects: [],
    students: [],
    scores: [],
    exam: null,
    subject: null,
    version: 0
  };

  function message(text, error = false) {
    const box = $("mockTeacherMessage");
    box.textContent = text || "";
    box.style.color = error ? "#b42318" : "#175c36";
  }

  function setText(id, value) {
    $(id).textContent = value ?? "—";
  }

  function emptyTable(text) {
    const body = $("mockTeacherScoresBody");
    body.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 8;
    cell.className = "mock-empty-state";
    cell.textContent = text;

    row.appendChild(cell);
    body.appendChild(row);
  }

  function option(value, label) {
    const item = document.createElement("option");
    item.value = String(value);
    item.textContent = label;
    return item;
  }

  async function api(path, options = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Your login session has expired. Please log in.");
    }

    const response = await fetch(`/api/mock-exams${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  }

  function selectedBranch() {
    return state.exam ? Number(state.exam.branch_id) : null;
  }

  function examPath(suffix = "") {
    const id = Number(state.exam.id);
    const branch = selectedBranch();

    return `/${id}${suffix}?branch_id=${encodeURIComponent(branch)}`;
  }

  function resetStudents() {
    state.students = [];
    state.scores = [];

    setText("mockTeacherStudentCount", 0);
    setText("mockTeacherScoreCount", 0);

    $("mockTeacherProgressBar").style.width = "0%";
    setText("mockTeacherProgressText", "No students loaded.");

    emptyTable("Select a mock examination and subject to load students.");
  }

  function updateProgress() {
    const subjectId = Number(state.subject?.id);

    const recorded = state.scores.filter(
      (score) => Number(score.subject_setting_id) === subjectId
    );

    const entered = new Set(recorded.map(
      (score) => Number(score.student_id)
    ));

    const count = state.students.filter(
      (student) => entered.has(Number(student.id))
    ).length;

    const total = state.students.length;
    const percentage = total ? Math.round(count * 100 / total) : 0;

    setText("mockTeacherStudentCount", total);
    setText("mockTeacherScoreCount", count);

    $("mockTeacherProgressBar").style.width = `${percentage}%`;

    setText(
      "mockTeacherProgressText",
      `${count} of ${total} students have recorded scores (${percentage}%).`
    );
  }

  function createCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text ?? "";
    row.appendChild(cell);
    return cell;
  }

  function scoreInput(maximum, value, locked) {
    const input = document.createElement("input");

    input.type = "number";
    input.min = "0";
    input.max = String(maximum);
    input.step = "0.01";
    input.inputMode = "decimal";
    input.disabled = locked;

    if (value !== null && value !== undefined) {
      input.value = String(value);
    }

    return input;
  }

  function renderScores() {
    const body = $("mockTeacherScoresBody");
    body.replaceChildren();

    if (!state.students.length) {
      emptyTable("No active students found for this examination class.");
      updateProgress();
      return;
    }

    const subject = state.subject;
    const locked = state.exam.status !== "active";

    const objectivesMax = Number(subject.objectives_max);
    const writtenMax = Number(subject.written_max);

    setText(
      "mockTeacherObjectivesHeading",
      `Objectives (${objectivesMax})`
    );

    setText(
      "mockTeacherWrittenHeading",
      `Written (${writtenMax})`
    );

    const scoreMap = new Map();

    for (const score of state.scores) {
      if (Number(score.subject_setting_id) === Number(subject.id)) {
        scoreMap.set(Number(score.student_id), score);
      }
    }

    state.students.forEach((student, index) => {
      const saved = scoreMap.get(Number(student.id));
      const row = document.createElement("tr");

      createCell(row, index + 1);
      createCell(row, student.admission_number);

      const name = [
        student.first_name,
        student.other_name,
        student.surname
      ].filter(Boolean).join(" ");

      createCell(row, name);

      const objectiveCell = document.createElement("td");
      const writtenCell = document.createElement("td");

      const objectives = scoreInput(
        objectivesMax,
        saved?.objectives_score,
        locked
      );

      const written = scoreInput(
        writtenMax,
        saved?.written_score,
        locked
      );

      objectiveCell.appendChild(objectives);
      writtenCell.appendChild(written);

      row.appendChild(objectiveCell);
      row.appendChild(writtenCell);

      const totalCell = createCell(row, saved?.total_score ?? "—");
      const gradeCell = createCell(row, saved?.grade ?? "—");

      const actionCell = document.createElement("td");
      const button = document.createElement("button");

      button.type = "button";
      button.className = "mock-primary-button";
      button.textContent = locked ? "Locked" : "Save";
      button.disabled = locked;

      actionCell.appendChild(button);
      row.appendChild(actionCell);

      function updatePreview() {
        if (objectives.value === "" || written.value === "") {
          totalCell.textContent = "—";
          gradeCell.textContent = saved?.grade ?? "—";
          return;
        }

        const total = Number(objectives.value) + Number(written.value);
        totalCell.textContent = Number.isFinite(total)
          ? total.toFixed(2)
          : "—";

        gradeCell.textContent = saved?.grade ?? "Save to grade";
      }

      objectives.addEventListener("input", updatePreview);
      written.addEventListener("input", updatePreview);

      button.addEventListener("click", async () => {
        const objectiveValue = Number(objectives.value);
        const writtenValue = Number(written.value);

        if (
          objectives.value.trim() === "" ||
          written.value.trim() === "" ||
          !Number.isFinite(objectiveValue) ||
          !Number.isFinite(writtenValue) ||
          objectiveValue < 0 ||
          writtenValue < 0 ||
          objectiveValue > objectivesMax ||
          writtenValue > writtenMax
        ) {
          message(
            `Enter Objectives (0–${objectivesMax}) and Written (0–${writtenMax}).`,
            true
          );
          return;
        }

        const version = state.version;
        const examId = state.exam.id;

        button.disabled = true;
        button.textContent = "Saving...";

        try {
          const data = await api(`/${examId}/scores`, {
            method: "POST",
            body: JSON.stringify({
              branch_id: selectedBranch(),
              student_id: student.id,
              subject_setting_id: subject.id,
              objectives_score: objectiveValue,
              written_score: writtenValue
            })
          });

          if (version !== state.version) return;

          state.scores = state.scores.filter(
            (score) => !(
              Number(score.student_id) === Number(student.id) &&
              Number(score.subject_setting_id) === Number(subject.id)
            )
          );

          state.scores.push({
            student_id: student.id,
            subject_setting_id: subject.id,
            objectives_score: objectiveValue,
            written_score: writtenValue,
            total_score: data.total_score,
            grade: data.grade,
            remarks: data.remarks
          });

          totalCell.textContent = String(data.total_score ?? "—");
          gradeCell.textContent = data.grade ?? "—";

          updateProgress();
          message(`Score saved for ${name}.`);
        } catch (error) {
          if (version === state.version) {
            message(error.message, true);
          }
        } finally {
          if (version === state.version) {
            button.disabled = false;
            button.textContent = "Save";
          }
        }
      });

      body.appendChild(row);
    });

    updateProgress();
  }

  async function loadStudents() {
    if (!state.exam || !state.subject) return;

    const version = ++state.version;

    resetStudents();
    message("Loading students and saved scores...");

    try {
      const [studentData, scoreData] = await Promise.all([
        api(examPath("/students")),
        api(examPath("/scores"))
      ]);

      if (version !== state.version) return;

      state.students = studentData.students || [];
      state.scores = scoreData.scores || [];

      renderScores();

      if (state.exam.status !== "active") {
        message("This mock examination is not Active. Scores are read-only.");
      } else {
        message("Students loaded successfully.");
      }
    } catch (error) {
      if (version === state.version) {
        emptyTable("Unable to load students.");
        message(error.message, true);
      }
    }
  }

  async function selectExam() {
    ++state.version;

    const examId = Number($("mockTeacherExamSelect").value);

    state.exam = state.exams.find(
      (exam) => Number(exam.id) === examId
    ) || null;

    state.subject = null;
    state.subjects = [];

    const subjectSelect = $("mockTeacherSubjectSelect");
    subjectSelect.replaceChildren();
    subjectSelect.appendChild(option("", "Select a subject"));
    subjectSelect.disabled = true;

    $("mockTeacherLoadStudents").disabled = true;

    resetStudents();
    message("");

    if (!state.exam) {
      setText("mockTeacherExamName", "—");
      setText("mockTeacherAcademicYear", "—");
      setText("mockTeacherClass", "—");
      setText("mockTeacherExamState", "—");
      setText("mockTeacherStatus", "Select Examination");
      setText("mockTeacherSubjectCount", 0);
      return;
    }

    setText("mockTeacherExamName", state.exam.mock_name);
    setText("mockTeacherAcademicYear", state.exam.academic_year);
    setText("mockTeacherClass", state.exam.class_name);
    setText("mockTeacherExamState", state.exam.status);
    setText("mockTeacherStatus", state.exam.status);

    const version = state.version;

    try {
      const data = await api(examPath("/subjects"));

      if (version !== state.version) return;

      state.subjects = data.subjects || [];

      setText("mockTeacherSubjectCount", state.subjects.length);

      for (const subject of state.subjects) {
        subjectSelect.appendChild(
          option(subject.id, subject.subject)
        );
      }

      subjectSelect.disabled = state.subjects.length === 0;

      if (!state.subjects.length) {
        message("No assigned subjects are configured for this examination.");
      }
    } catch (error) {
      if (version === state.version) {
        message(error.message, true);
      }
    }
  }

  function selectSubject() {
    ++state.version;

    const subjectId = Number($("mockTeacherSubjectSelect").value);

    state.subject = state.subjects.find(
      (subject) => Number(subject.id) === subjectId
    ) || null;

    $("mockTeacherLoadStudents").disabled = !state.subject;

    resetStudents();
    message("");
  }


  // STEP 459H — TEACHER EXCEL INTEGRATION

  let teacherExcelSelection = null;
  let teacherExcelRequest = 0;
  let teacherExcelBusy = false;

  function teacherExcelMessage(text, error = false) {
    const box = $("mockTeacherExcelMessage");
    box.textContent = text;
    box.style.color = error ? "#b42318" : "#175c36";
  }

  function teacherExcelReady() {
    return Boolean(
      state.exam &&
      state.subject &&
      Number(selectedBranch()) > 0
    );
  }

  function teacherExcelContext() {
    if (!teacherExcelReady()) {
      throw new Error("Select a mock examination and assigned subject first.");
    }

    return {
      examId: Number(state.exam.id),
      subjectId: Number(state.subject.id),
      branchId: Number(selectedBranch()),
      subjectName: String(state.subject.subject || "Subject"),
      version: state.version
    };
  }

  function teacherExcelSameContext(context) {
    return Boolean(
      context &&
      Number(state.exam?.id) === context.examId &&
      Number(state.subject?.id) === context.subjectId &&
      Number(selectedBranch()) === context.branchId &&
      state.version === context.version
    );
  }

  function teacherExcelToken() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Your login session has expired. Please log in.");
    }

    return token;
  }

  function teacherExcelUrl(context, operation) {
    const local =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    const origin = local
      ? location.protocol + "//" + location.hostname + ":5000"
      : location.origin;

    return origin + "/api/mock-exams/" +
      encodeURIComponent(context.examId) +
      "/scores/" + operation;
  }

  function teacherExcelForm(context, file) {
    const form = new FormData();

    form.append("file", file);
    form.append("branch_id", String(context.branchId));
    form.append("subject_setting_id", String(context.subjectId));

    return form;
  }

  function teacherExcelReset(text) {
    teacherExcelRequest++;
    teacherExcelSelection = null;

    $("mockTeacherExcelPreview").style.display = "none";
    $("mockTeacherExcelPreviewBody").replaceChildren();
    $("mockTeacherExcelErrors").replaceChildren();
    $("mockTeacherExcelFile").value = "";
    $("mockTeacherConfirmExcel").disabled = true;

    if (text !== undefined) {
      teacherExcelMessage(text);
    }
  }

  function teacherExcelRefreshButtons() {
    const ready = teacherExcelReady();

    $("mockTeacherDownloadExcel").disabled =
      teacherExcelBusy || !ready;

    $("mockTeacherUploadExcel").disabled =
      teacherExcelBusy ||
      !ready ||
      state.exam.status !== "active";

    $("mockTeacherConfirmExcel").disabled =
      teacherExcelBusy ||
      !teacherExcelSelection ||
      !teacherExcelSameContext(teacherExcelSelection.context) ||
      state.exam?.status !== "active";
  }

  function teacherExcelSelectionChanged() {
    // Run after the existing examination/subject change handlers
    // have updated the selected examination and subject.
    queueMicrotask(() => {
      teacherExcelReset(
        teacherExcelReady()
          ? "Download a template or upload completed scores."
          : "Select a mock examination and assigned subject."
      );

      teacherExcelRefreshButtons();
    });
  }

  async function teacherExcelDownload() {
    const button = $("mockTeacherDownloadExcel");
    const originalText = button.textContent;

    try {
      const context = teacherExcelContext();

      teacherExcelBusy = true;
      teacherExcelRefreshButtons();
      button.textContent = "Preparing Excel...";

      const params = new URLSearchParams({
        branch_id: String(context.branchId),
        subject_setting_id: String(context.subjectId)
      });

      const response = await fetch(
        teacherExcelUrl(context, "template") + "?" + params,
        {
          headers: {
            Authorization: "Bearer " + teacherExcelToken()
          }
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Excel download failed.");
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The downloaded Excel file is empty.");
      }

      if (!teacherExcelSameContext(context)) {
        throw new Error("Selection changed. Please download again.");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const subject = context.subjectName
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      link.href = url;
      link.download =
        "Mock_" + context.examId + "_" + subject + "_Scores.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60000);

      teacherExcelMessage("Excel template downloaded successfully.");

    } catch (error) {
      teacherExcelMessage(error.message, true);

    } finally {
      teacherExcelBusy = false;
      button.textContent = originalText;
      teacherExcelRefreshButtons();
    }
  }

  async function teacherExcelPreview(file) {
    const requestId = ++teacherExcelRequest;
    teacherExcelSelection = null;

    $("mockTeacherExcelPreview").style.display = "none";
    $("mockTeacherExcelPreviewBody").replaceChildren();
    $("mockTeacherExcelErrors").replaceChildren();

    try {
      const context = teacherExcelContext();

      if (state.exam.status !== "active") {
        throw new Error("Only Active mock examinations accept scores.");
      }

      if (!/\.xlsx$/i.test(file.name)) {
        throw new Error("Please select an .xlsx Excel file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Excel file must not exceed 5 MB.");
      }

      teacherExcelBusy = true;
      teacherExcelRefreshButtons();

      teacherExcelMessage("Validating uploaded Excel scores...");

      const response = await fetch(
        teacherExcelUrl(context, "preview-excel"),
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + teacherExcelToken()
          },
          body: teacherExcelForm(context, file)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (requestId !== teacherExcelRequest) return;

      if (!response.ok) {
        throw new Error(data.message || "Excel preview failed.");
      }

      if (!teacherExcelSameContext(context)) {
        throw new Error("Selection changed. Please upload again.");
      }

      const rows = Array.isArray(data.preview) ? data.preview : [];
      const errors = Array.isArray(data.errors) ? data.errors : [];

      const body = $("mockTeacherExcelPreviewBody");
      const errorsBox = $("mockTeacherExcelErrors");

      for (const item of rows) {
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

        body.appendChild(tr);
      }

      if (!rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 7;
        td.textContent = "No completed student scores found.";

        tr.appendChild(td);
        body.appendChild(tr);
      }

      if (errors.length) {
        const heading = document.createElement("strong");
        heading.textContent = "Please correct these errors:";
        errorsBox.appendChild(heading);

        const list = document.createElement("ul");

        errors.forEach(error => {
          const item = document.createElement("li");
          item.textContent = String(error);
          list.appendChild(item);
        });

        errorsBox.appendChild(list);
      }

      $("mockTeacherExcelPreview").style.display = "block";

      if (data.valid && rows.length && !errors.length) {
        teacherExcelSelection = {
          context,
          file,
          studentCount: rows.length
        };

        teacherExcelMessage(
          "Preview ready: " + rows.length +
          " student score(s). Nothing has been saved."
        );
      } else {
        teacherExcelMessage(
          "Excel validation found errors. No scores were saved.",
          true
        );
      }

    } catch (error) {
      if (requestId === teacherExcelRequest) {
        teacherExcelMessage(error.message, true);
      }

    } finally {
      teacherExcelBusy = false;
      $("mockTeacherExcelFile").value = "";
      teacherExcelRefreshButtons();
    }
  }

  async function teacherExcelConfirm() {
    const selected = teacherExcelSelection;

    if (!selected || !teacherExcelSameContext(selected.context)) {
      teacherExcelReset("Selection changed. Upload the Excel file again.");
      teacherExcelRefreshButtons();
      return;
    }

    if (state.exam?.status !== "active") {
      teacherExcelMessage(
        "Only Active mock examinations accept scores.",
        true
      );
      return;
    }

    const confirmed = window.confirm(
      "Save " + selected.studentCount +
      " student score(s) from Excel? Existing scores for these " +
      "students and this subject will be updated."
    );

    if (!confirmed) return;

    const button = $("mockTeacherConfirmExcel");
    const originalText = button.textContent;

    try {
      teacherExcelBusy = true;
      teacherExcelRefreshButtons();
      button.textContent = "Saving Scores...";

      const response = await fetch(
        teacherExcelUrl(selected.context, "import-excel"),
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + teacherExcelToken()
          },
          body: teacherExcelForm(selected.context, selected.file)
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

      teacherExcelReset();

      teacherExcelMessage(
        "Successfully saved " +
        (Number(data.saved_count) || 0) +
        " student score(s) from Excel."
      );

      if (teacherExcelSameContext(selected.context)) {
        await loadStudents();

        teacherExcelMessage(
          "Excel scores saved successfully. Student scores refreshed."
        );
      }

    } catch (error) {
      teacherExcelMessage(error.message, true);

    } finally {
      teacherExcelBusy = false;
      button.textContent = originalText;
      teacherExcelRefreshButtons();
    }
  }

  function initializeTeacherExcel() {
    $("mockTeacherDownloadExcel").addEventListener(
      "click", teacherExcelDownload
    );

    $("mockTeacherUploadExcel").addEventListener("click", () => {
      if (!teacherExcelReady() || teacherExcelBusy) return;
      $("mockTeacherExcelFile").click();
    });

    $("mockTeacherExcelFile").addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (file) teacherExcelPreview(file);
    });

    $("mockTeacherConfirmExcel").addEventListener(
      "click", teacherExcelConfirm
    );

    $("mockTeacherCancelExcel").addEventListener("click", () => {
      teacherExcelReset("Excel preview cancelled. No scores saved.");
      teacherExcelRefreshButtons();
    });

    $("mockTeacherExamSelect").addEventListener(
      "change", teacherExcelSelectionChanged
    );

    $("mockTeacherSubjectSelect").addEventListener(
      "change", teacherExcelSelectionChanged
    );

    teacherExcelRefreshButtons();
  }

  async function initialize() {
    try {
      const rawUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!rawUser || !token) {
        window.location.replace("../pages/login.html");
        return;
      }

      const user = JSON.parse(rawUser);

      if (user.role !== "teacher") {
        throw new Error("This dashboard is accessible to teachers only.");
      }

      initializeTeacherExcel();

      $("mockTeacherExamSelect").addEventListener("change", selectExam);

      $("mockTeacherSubjectSelect").addEventListener(
        "change",
        selectSubject
      );

      $("mockTeacherLoadStudents").addEventListener(
        "click",
        loadStudents
      );

      const branchId = Number(user.branch_id);

      if (!Number.isInteger(branchId) || branchId <= 0) {
        throw new Error("Your account has no valid assigned branch.");
      }

      const data = await api(
        `/?branch_id=${encodeURIComponent(branchId)}`
      );

      state.exams = data.exams || [];

      setText("mockTeacherExamCount", state.exams.length);

      const examSelect = $("mockTeacherExamSelect");
      examSelect.replaceChildren();
      examSelect.appendChild(option("", "Select Mock Examination"));

      for (const exam of state.exams) {
        examSelect.appendChild(
          option(
            exam.id,
            `${exam.mock_name} — ${exam.class_name} (${exam.academic_year})`
          )
        );
      }

      setText("mockTeacherStatus", "Ready");

      if (!state.exams.length) {
        message("No assigned mock examinations are currently available.");
      }
    } catch (error) {
      setText("mockTeacherStatus", "Unavailable");
      message(error.message, true);
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
