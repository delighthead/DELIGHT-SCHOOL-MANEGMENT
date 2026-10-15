const db = require("../config/database");

const {
  calculateNumericalGrade
} = require("../utils/numericalGrading");

async function calculateMockGrade(total) {
  const [rows] = await db.query(
    "SELECT * FROM settings WHERE id = 1 LIMIT 1"
  );

  const settings = rows[0];

  if (settings) {
    const grades = [];

    for (let grade = 1; grade <= 9; grade++) {
      const min = Number(settings[`grade_${grade}_min`]);
      const remark = String(
        settings[`grade_${grade}_remark`] || ""
      ).trim();

      if (!Number.isFinite(min) || !remark) {
        break;
      }

      grades.push({
        grade: String(grade),
        min,
        remark
      });
    }

    if (grades.length === 9) {
      grades.sort((a, b) => b.min - a.min);

      const result = grades.find(
        item => total >= item.min
      );

      if (result) {
        return {
          grade: result.grade,
          remarks: result.remark
        };
      }
    }
  }

  const fallback = calculateNumericalGrade(total);

  return {
    grade: fallback.grade,
    remarks: fallback.remark
  };
}


const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "branch_admin",
  "teacher_admin"
];

function isBranchRestricted(user) {
  return [
    "branch_admin",
    "teacher_admin",
    "teacher"
  ].includes(user?.role);
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function getAuthorizedBranch(user, requestedBranch) {
  if (isBranchRestricted(user)) {
    if (!isPositiveInteger(user.branch_id)) {
      return null;
    }

    return Number(user.branch_id);
  }

  return isPositiveInteger(requestedBranch)
    ? Number(requestedBranch)
    : null;
}

exports.getMockExams = async (req, res) => {
  try {
    const branchId = getAuthorizedBranch(
      req.user,
      req.query.branch_id
    );

    if (!branchId) {
      return res.status(400).json({
        message: "A valid authorized branch is required"
      });
    }

    let teacherRestriction = "";
    const params = [branchId];

    if (req.user.role === "teacher") {
      teacherRestriction = `
        AND EXISTS (
          SELECT 1
          FROM teachers t
          INNER JOIN teacher_assignments ta
            ON ta.teacher_id = t.id
           AND ta.branch_id = t.branch_id
          INNER JOIN mock_subject_settings ms
            ON ms.mock_id = m.id
           AND UPPER(TRIM(ms.subject)) =
               UPPER(TRIM(ta.subject))
          WHERE t.user_id = ?
            AND t.branch_id = m.branch_id
            AND ta.class_id = m.class_id
            AND ta.academic_year = m.academic_year
            AND ta.status = 'active'
            AND UPPER(TRIM(ta.role)) = 'SUBJECT TEACHER'
        )
      `;

      params.push(req.user.id);
    }

    const [exams] = await db.query(
      `SELECT
         m.id,
         m.branch_id,
         m.class_id,
         c.class_name,
         m.mock_name,
         m.academic_year,
         m.examination_date,
         m.status,
         m.created_at
       FROM mock_examinations m
       INNER JOIN classes c
         ON c.id = m.class_id
       WHERE m.branch_id = ?
       ${teacherRestriction}
       ORDER BY m.created_at DESC, m.id DESC`,
      params
    );

    return res.json({
      message: "Mock examinations retrieved successfully",
      exams
    });
  } catch (error) {
    console.error("Get mock examinations error:", error);

    return res.status(500).json({
      message: "Failed to retrieve mock examinations"
    });
  }
};

exports.createMockExam = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({
        message: "Administrator access required"
      });
    }

    const {
      class_id,
      mock_name,
      academic_year,
      examination_date
    } = req.body;

    const branchId = getAuthorizedBranch(
      req.user,
      req.body.branch_id
    );

    const mockName = String(mock_name || "").trim();
    const academicYear = String(academic_year || "").trim();

    if (
      !branchId ||
      !isPositiveInteger(class_id) ||
      !mockName ||
      !academicYear
    ) {
      return res.status(400).json({
        message: "Branch, class, mock name and academic year are required"
      });
    }

    if (mockName.length > 100 || academicYear.length > 20) {
      return res.status(400).json({
        message: "Mock name or academic year is too long"
      });
    }

    const [classes] = await db.query(
      `SELECT id
       FROM classes
       WHERE id = ?
         AND UPPER(TRIM(class_name)) = 'BASIC 9'
       LIMIT 1`,
      [class_id]
    );

    if (!classes.length) {
      return res.status(404).json({
        message: "Class not found in the authorized branch"
      });
    }

    const [result] = await db.query(
      `INSERT INTO mock_examinations
       (
         branch_id,
         class_id,
         mock_name,
         academic_year,
         examination_date,
         created_by
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        branchId,
        Number(class_id),
        mockName,
        academicYear,
        examination_date || null,
        req.user.id
      ]
    );

    return res.status(201).json({
      message: "Mock examination created successfully",
      mock_id: result.insertId
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This mock examination already exists for the class and academic year"
      });
    }

    console.error("Create mock examination error:", error);

    return res.status(500).json({
      message: "Failed to create mock examination"
    });
  }
};

// Remaining functions will be implemented in the next steps.
exports.updateMockStatus = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        message: "Administrator access required"
      });
    }

    const mockId = Number(req.params.mockId);
    const requestedStatus = String(req.body.status || "").trim().toLowerCase();

    if (!isPositiveInteger(mockId)) {
      return res.status(400).json({
        message: "Invalid mock examination ID"
      });
    }

    if (!["active", "completed"].includes(requestedStatus)) {
      return res.status(400).json({
        message: "Status must be active or completed"
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, class_id, status
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
      return res.status(404).json({
        message: "Mock examination not found"
      });
    }

    const exam = exams[0];
    const authorizedBranch = getAuthorizedBranch(
      req.user,
      req.body.branch_id
    );

    if (!authorizedBranch || Number(exam.branch_id) !== Number(authorizedBranch)) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    const allowed =
      (exam.status === "draft" && requestedStatus === "active") ||
      (exam.status === "active" && requestedStatus === "completed");

    if (!allowed) {
      return res.status(409).json({
        message: "Invalid mock examination status transition"
      });
    }

    if (requestedStatus === "active") {
      const [subjects] = await db.query(
        `SELECT COUNT(*) AS subject_count
         FROM mock_subject_settings
         WHERE mock_id = ?`,
        [mockId]
      );

      if (Number(subjects[0].subject_count) === 0) {
        return res.status(409).json({
          message: "Configure at least one subject before activation"
        });
      }
    }

    const [result] = await db.query(
      `UPDATE mock_examinations
       SET status = ?
       WHERE id = ?
         AND branch_id = ?
         AND status = ?`,
      [requestedStatus, mockId, exam.branch_id, exam.status]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        message: "Examination status changed; please refresh"
      });
    }

    return res.json({
      message: "Mock examination status updated successfully",
      mock_id: mockId,
      status: requestedStatus
    });
  } catch (error) {
    console.error("Update mock status error:", error);

    return res.status(500).json({
      message: "Failed to update mock examination status"
    });
  }
};

function notImplemented(req, res) {
  return res.status(501).json({
    message: "This Mock Examination feature is still being developed"
  });
}


exports.configureSubject = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res.status(403).json({
        message: "Administrator access required"
      });
    }

    const mockId = Number(req.params.mockId);
    const subject = String(req.body.subject || "").trim();
    const objectivesMax = Number(req.body.objectives_max);
    const writtenMax = Number(req.body.written_max);

    if (
      !isPositiveInteger(mockId) ||
      !subject ||
      subject.length > 100 ||
      !(
        (objectivesMax === 40 && writtenMax === 60) ||
        (objectivesMax === 30 && writtenMax === 70)
      )
    ) {
      return res.status(400).json({
        message: "Valid subject and 40/60 or 30/70 marking format required"
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, status
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
      return res.status(404).json({
        message: "Mock examination not found"
      });
    }

    const authorizedBranch = getAuthorizedBranch(
      req.user,
      req.body.branch_id
    );

    if (
      !authorizedBranch ||
      Number(exams[0].branch_id) !== authorizedBranch
    ) {
      return res.status(403).json({
        message: "You cannot configure subjects for this branch"
      });
    }

    // Administrators may add subjects to Draft or Active examinations.
    // Completed examinations remain locked.
    if (!["draft", "active"].includes(exams[0].status)) {
      return res.status(409).json({
        message: "Subjects can only be added to Draft or Active examinations"
      });
    }

    const [existing] = await db.query(
      `SELECT id
       FROM mock_subject_settings
       WHERE mock_id = ?
         AND UPPER(TRIM(subject)) = UPPER(TRIM(?))
       LIMIT 1`,
      [mockId, subject]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "This subject is already configured for the mock examination"
      });
    }

    const [result] = await db.query(
      `INSERT INTO mock_subject_settings
       (mock_id, subject, objectives_max, written_max)
       VALUES (?, ?, ?, ?)`,
      [mockId, subject, objectivesMax, writtenMax]
    );

    return res.status(201).json({
      message: "Mock examination subject configured successfully",
      subject_setting_id: result.insertId,
      subject,
      objectives_max: objectivesMax,
      written_max: writtenMax
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This subject is already configured"
      });
    }

    console.error("Configure mock subject error:", error);

    return res.status(500).json({
      message: "Failed to configure mock examination subject"
    });
  }
};


exports.getMockSubjects = async (req, res) => {
  try {
    const mockId = Number(req.params.mockId);

    if (!isPositiveInteger(mockId)) {
      return res.status(400).json({
        message: "Valid mock examination ID required"
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, class_id, academic_year, mock_name, status
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
      return res.status(404).json({
        message: "Mock examination not found"
      });
    }

    const exam = exams[0];

    const authorizedBranch = getAuthorizedBranch(
      req.user,
      req.query.branch_id
    );

    if (
      !authorizedBranch ||
      Number(exam.branch_id) !== Number(authorizedBranch)
    ) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    let teacherRestriction = "";
    const params = [mockId];

    if (req.user.role === "teacher") {
      teacherRestriction = `
        AND EXISTS (
          SELECT 1
          FROM teachers t
          INNER JOIN teacher_assignments ta
            ON ta.teacher_id = t.id
           AND ta.branch_id = t.branch_id
          WHERE t.user_id = ?
            AND t.branch_id = ?
            AND ta.class_id = ?
            AND ta.academic_year = ?
            AND ta.status = 'active'
            AND UPPER(TRIM(ta.role)) = 'SUBJECT TEACHER'
            AND UPPER(TRIM(ta.subject)) =
                UPPER(TRIM(ms.subject))
        )
      `;

      params.push(
        req.user.id,
        exam.branch_id,
        exam.class_id,
        exam.academic_year
      );
    }

    const [subjects] = await db.query(
      `SELECT
         ms.id,
         ms.mock_id,
         ms.subject,
         ms.objectives_max,
         ms.written_max
       FROM mock_subject_settings ms
       WHERE ms.mock_id = ?
       ${teacherRestriction}
       ORDER BY ms.subject`,
      params
    );

    return res.json({
      message: "Mock examination subjects retrieved successfully",
      mock_id: mockId,
      mock_name: exam.mock_name,
      status: exam.status,
      subjects
    });
  } catch (error) {
    console.error("Get mock subjects error:", error);

    return res.status(500).json({
      message: "Failed to retrieve mock examination subjects"
    });
  }
};

exports.getMockStudents = async (req, res) => {
  try {
    const mockId = Number(req.params.mockId);

    if (!isPositiveInteger(mockId)) {
      return res.status(400).json({
        message: "Valid mock examination ID required"
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, class_id, academic_year, mock_name
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
      return res.status(404).json({
        message: "Mock examination not found"
      });
    }

    const exam = exams[0];

    const authorizedBranch = getAuthorizedBranch(
      req.user,
      req.query.branch_id
    );

    if (
      !authorizedBranch ||
      Number(exam.branch_id) !== Number(authorizedBranch)
    ) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    if (req.user.role === "teacher") {
      const [assignments] = await db.query(
        `SELECT ta.id
         FROM teachers t
         INNER JOIN teacher_assignments ta
           ON ta.teacher_id = t.id
          AND ta.branch_id = t.branch_id
         INNER JOIN mock_subject_settings ms
           ON ms.mock_id = ?
          AND UPPER(TRIM(ms.subject)) =
              UPPER(TRIM(ta.subject))
         WHERE t.user_id = ?
           AND t.branch_id = ?
           AND ta.class_id = ?
           AND ta.academic_year = ?
           AND ta.status = 'active'
           AND UPPER(TRIM(ta.role)) = 'SUBJECT TEACHER'
         LIMIT 1`,
        [
          mockId,
          req.user.id,
          exam.branch_id,
          exam.class_id,
          exam.academic_year
        ]
      );

      if (!assignments.length) {
        return res.status(403).json({
          message: "No active subject assignment for this examination"
        });
      }
    }

    const [students] = await db.query(
      `SELECT
         id,
         student_id,
         admission_number,
         full_name,
         first_name,
         surname,
         other_name,
         profile_picture,
         class_id
       FROM students
       WHERE branch_id = ?
         AND class_id = ?
         AND status = 'active'
       ORDER BY surname, first_name, id`,
      [exam.branch_id, exam.class_id]
    );

    return res.json({
      message: "Mock examination students retrieved successfully",
      mock_id: mockId,
      mock_name: exam.mock_name,
      class_id: exam.class_id,
      students
    });
  } catch (error) {
    console.error("Get mock students error:", error);

    return res.status(500).json({
      message: "Failed to retrieve mock examination students"
    });
  }
};

exports.getMockScores = async (req, res) => {
  try {
    const mockId = Number(req.params.mockId);

    if (!isPositiveInteger(mockId)) {
      return res.status(400).json({
        message: "Valid mock examination ID required"
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, class_id, academic_year
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
      return res.status(404).json({
        message: "Mock examination not found"
      });
    }

    const exam = exams[0];

    const authorizedBranch = getAuthorizedBranch(
      req.user,
      req.query.branch_id
    );

    if (
      !authorizedBranch ||
      Number(exam.branch_id) !== authorizedBranch
    ) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    let teacherId = null;

    if (req.user.role === "teacher") {
      const [teachers] = await db.query(
        `SELECT id
         FROM teachers
         WHERE user_id = ?
           AND branch_id = ?
         LIMIT 1`,
        [req.user.id, exam.branch_id]
      );

      if (!teachers.length) {
        return res.status(403).json({
          message: "Teacher profile not found"
        });
      }

      teacherId = teachers[0].id;
    }

    const parameters = [mockId, exam.branch_id, exam.class_id];

    let teacherRestriction = "";

    if (teacherId) {
      teacherRestriction = `
        AND EXISTS (
          SELECT 1
          FROM teacher_assignments ta
          WHERE ta.teacher_id = ?
            AND ta.branch_id = ?
            AND ta.class_id = ?
            AND ta.academic_year = ?
            AND ta.status = 'active'
            AND UPPER(TRIM(ta.role)) = 'SUBJECT TEACHER'
            AND UPPER(TRIM(ta.subject)) =
                UPPER(TRIM(ms.subject))
        )
      `;

      parameters.push(
        teacherId,
        exam.branch_id,
        exam.class_id,
        exam.academic_year
      );
    }

    const [scores] = await db.query(
      `SELECT
         m.id,
         m.student_id,
         m.subject_setting_id,
         s.admission_number,
         s.first_name,
         s.surname,
         s.other_name,
         ms.subject,
         ms.objectives_max,
         ms.written_max,
         m.objectives_score,
         m.written_score,
         m.total_score,
         m.grade,
         m.remarks
       FROM mock_scores m
       INNER JOIN students s
         ON s.id = m.student_id
        AND s.branch_id = ?
        AND s.class_id = ?
       INNER JOIN mock_subject_settings ms
         ON ms.id = m.subject_setting_id
        AND ms.mock_id = m.mock_id
       WHERE m.mock_id = ?
       ${teacherRestriction}
       ORDER BY s.surname, s.first_name, ms.subject`,
      [
        exam.branch_id,
        exam.class_id,
        mockId,
        ...parameters.slice(3)
      ]
    );

    return res.json({
      message: "Mock examination scores retrieved successfully",
      mock_id: mockId,
      scores
    });
  } catch (error) {
    console.error("Get mock scores error:", error);

    return res.status(500).json({
      message: "Failed to retrieve mock examination scores"
    });
  }
};


exports.saveMockScore = async (req, res) => {
  try {
    const mockId = Number(req.params.mockId);
    const studentId = Number(req.body.student_id);
    const subjectSettingId = Number(req.body.subject_setting_id);

    const objectives = Number(req.body.objectives_score);
    const written = Number(req.body.written_score);

    if (
      !isPositiveInteger(mockId) ||
      !isPositiveInteger(studentId) ||
      !isPositiveInteger(subjectSettingId) ||
      req.body.objectives_score === null ||
      req.body.objectives_score === undefined ||
      req.body.objectives_score === "" ||
      req.body.written_score === null ||
      req.body.written_score === undefined ||
      req.body.written_score === "" ||
      !Number.isFinite(objectives) ||
      !Number.isFinite(written)
    ) {
      return res.status(400).json({
        message: "Valid student, subject and both scores are required"
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, class_id, academic_year, status
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
      return res.status(404).json({
        message: "Mock examination not found"
      });
    }

    const exam = exams[0];

    const authorizedBranch = getAuthorizedBranch(
      req.user,
      req.body.branch_id
    );

    if (
      !authorizedBranch ||
      Number(exam.branch_id) !== authorizedBranch
    ) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    if (exam.status !== "active") {
      return res.status(409).json({
        message: "Only active mock examinations accept scores"
      });
    }

    const [students] = await db.query(
      `SELECT id
       FROM students
       WHERE id = ?
         AND branch_id = ?
         AND class_id = ?
         AND status = 'active'
       LIMIT 1`,
      [studentId, exam.branch_id, exam.class_id]
    );

    if (!students.length) {
      return res.status(403).json({
        message: "Student is not active in this examination class"
      });
    }

    const [subjects] = await db.query(
      `SELECT id, subject, objectives_max, written_max
       FROM mock_subject_settings
       WHERE id = ?
         AND mock_id = ?
       LIMIT 1`,
      [subjectSettingId, mockId]
    );

    if (!subjects.length) {
      return res.status(404).json({
        message: "Subject is not configured for this mock examination"
      });
    }

    const subject = subjects[0];

    if (
      objectives < 0 ||
      written < 0 ||
      objectives > Number(subject.objectives_max) ||
      written > Number(subject.written_max)
    ) {
      return res.status(400).json({
        message: "Scores must be within the configured subject limits"
      });
    }

    if (req.user.role === "teacher") {
      const [teachers] = await db.query(
        `SELECT id
         FROM teachers
         WHERE user_id = ?
           AND branch_id = ?
         LIMIT 1`,
        [req.user.id, exam.branch_id]
      );

      if (!teachers.length) {
        return res.status(403).json({
          message: "Teacher profile not found"
        });
      }

      const [assignments] = await db.query(
        `SELECT 1
         FROM teacher_assignments
         WHERE teacher_id = ?
           AND branch_id = ?
           AND class_id = ?
           AND academic_year = ?
           AND status = 'active'
           AND UPPER(TRIM(role)) = 'SUBJECT TEACHER'
           AND UPPER(TRIM(subject)) = UPPER(TRIM(?))
         LIMIT 1`,
        [
          teachers[0].id,
          exam.branch_id,
          exam.class_id,
          exam.academic_year,
          subject.subject
        ]
      );

      if (!assignments.length) {
        return res.status(403).json({
          message: "You are not assigned to this class and subject"
        });
      }
    }

    const total = objectives + written;
    const grading = await calculateMockGrade(total);

    await db.query(
      `INSERT INTO mock_scores
       (
         mock_id,
         student_id,
         subject_setting_id,
         objectives_score,
         written_score,
         grade,
         remarks,
         entered_by
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         objectives_score = VALUES(objectives_score),
         written_score = VALUES(written_score),
         grade = VALUES(grade),
         remarks = VALUES(remarks)`,
      [
        mockId,
        studentId,
        subjectSettingId,
        objectives,
        written,
        grading.grade,
        grading.remarks,
        req.user.id
      ]
    );

    return res.json({
      message: "Mock examination score saved successfully",
      student_id: studentId,
      subject: subject.subject,
      objectives_score: objectives,
      written_score: written,
      total_score: total,
      grade: grading.grade,
      remarks: grading.remarks
    });
  } catch (error) {
    console.error("Save mock score error:", error);

    return res.status(500).json({
      message: "Failed to save mock examination score"
    });
  }
};



// Read-only subject catalogue for mock examination setup.
exports.getAvailableSubjects = async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");

    const branchId = Number(req.query.branch_id);

    if (!Number.isInteger(branchId) || branchId <= 0) {
      return res.status(400).json({
        message: "Valid branch_id is required"
      });
    }

    if (
      isBranchRestricted(req.user) &&
      Number(req.user.branch_id) !== branchId
    ) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    const sourcePath = path.resolve(
      "/var/www/delight-frontend/dist/js/subjects-dropdown.js"
    );

    const source = fs.readFileSync(sourcePath, "utf8");

    const match = source.match(
      /const subjects\s*=\s*\[([\s\S]*?)\];/
    );

    if (!match) {
      return res.status(500).json({
        message: "School subject list not found"
      });
    }

    const subjects = Array.from(
      match[1].matchAll(/["']([^"']+)["']/g),
      item => item[1]
    );

    return res.json({ subjects });

  } catch (error) {
    console.error("Available subjects error:", error);

    return res.status(500).json({
      message: "Unable to load school subjects"
    });
  }
};
