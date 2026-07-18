const db = require("../config/database");

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateGrade(total) {
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "F";
}

function calculateRemark(total) {
  if (total >= 80) return "Excellent";
  if (total >= 70) return "Very Good";
  if (total >= 60) return "Good";
  if (total >= 50) return "Fair";
  return "Needs Improvement";
}

function buildScoreSummary(assessmentScore, examinationScore, remarksInput) {
  const assessment = toSafeNumber(assessmentScore);
  const examination = toSafeNumber(examinationScore);
  const total = assessment + examination;
  const grade = calculateGrade(total);
  const remarks = String(remarksInput || "").trim() || calculateRemark(total);

  return {
    assessment,
    examination,
    total,
    grade,
    remarks
  };
}

function readExcelCellValue(cellValue) {
  if (cellValue === null || cellValue === undefined) {
    return "";
  }

  if (typeof cellValue === "object") {
    if (cellValue.result !== undefined && cellValue.result !== null) {
      return cellValue.result;
    }

    if (cellValue.text !== undefined && cellValue.text !== null) {
      return cellValue.text;
    }

    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((part) => part.text || "").join("");
    }
  }

  return cellValue;
}

function isExcelCellBlank(cellValue) {
  const value = readExcelCellValue(cellValue);
  return String(value || "").trim() === "";
}

async function getTeacherByUserId(userId) {
  if (!userId) return null;

  const [rows] = await db.query(
    "SELECT id, branch_id FROM teachers WHERE user_id = ? LIMIT 1",
    [userId]
  );

  return rows.length > 0 ? rows[0] : null;
}

async function isTeacherAssignedToStudent(teacherId, studentId) {
  if (!teacherId || !studentId) return false;

  const [rows] = await db.query(
    `SELECT 1
     FROM teacher_assignments ta
     INNER JOIN students s
       ON s.class_id = ta.class_id
      AND s.branch_id = ta.branch_id
     WHERE ta.teacher_id = ?
       AND ta.status = 'active'
       AND s.id = ?
     LIMIT 1`,
    [teacherId, studentId]
  );

  return rows.length > 0;
}

async function isTeacherAssignedToClass(teacherId, classId, branchId) {
  if (!teacherId || !classId) return false;

  const params = [teacherId, classId];
  let sql = `SELECT 1
             FROM teacher_assignments
             WHERE teacher_id = ?
               AND class_id = ?
               AND status = 'active'`;

  if (branchId) {
    sql += " AND branch_id = ?";
    params.push(branchId);
  }

  sql += " LIMIT 1";

  const [rows] = await db.query(sql, params);
  return rows.length > 0;
}

function toOrdinal(positionNumber) {
  const mod100 = positionNumber % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${positionNumber}th`;

  const mod10 = positionNumber % 10;
  if (mod10 === 1) return `${positionNumber}st`;
  if (mod10 === 2) return `${positionNumber}nd`;
  if (mod10 === 3) return `${positionNumber}rd`;
  return `${positionNumber}th`;
}

async function recalculatePositionsForGroup({ branchId, classId, subject, term, academicYear }) {
  if (!classId || !subject) {
    return;
  }

  const conditions = [
    "class_id = ?",
    "UPPER(subject) = UPPER(?)",
    "term <=> ?",
    "academic_year <=> ?"
  ];
  const params = [classId, subject, term || null, academicYear || null];

  if (branchId !== undefined && branchId !== null && branchId !== "") {
    conditions.push("branch_id = ?");
    params.push(branchId);
  }

  const [groupScores] = await db.query(
    `SELECT id, total_score
     FROM scores
     WHERE ${conditions.join(" AND ")}
     ORDER BY total_score DESC, id ASC`,
    params
  );

  let currentRank = 0;
  let index = 0;
  let lastScore = null;

  for (const score of groupScores) {
    index += 1;
    const numericScore = toSafeNumber(score.total_score);

    if (lastScore === null || numericScore !== lastScore) {
      currentRank = index;
      lastScore = numericScore;
    }

    await db.query("UPDATE scores SET position = ? WHERE id = ?", [toOrdinal(currentRank), score.id]);
  }
}

// Get scores, optionally by branch
exports.getScores = async (req, res) => {
  try {
    const { branch_id, class_id, subject, term, academic_year, approval_status } = req.query;
    const isTeacher = req.user && req.user.role === "teacher";
    let teacher = null;

    if (isTeacher) {
      teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }
    }

    let sql = `SELECT
        scores.id,
        scores.branch_id,
        branches.branch_name,
        scores.student_id,
        students.admission_number,
        COALESCE(students.full_name, CONCAT(students.first_name, ' ', students.surname)) AS student_name,
        classes.class_name,
        scores.subject,
        scores.term,
        scores.academic_year,
        scores.assessment_score,
        scores.examination_score,
        scores.total_score,
        scores.grade,
        scores.position,
        scores.entry_method,
        scores.remarks,
        scores.approval_status,
        scores.created_at
      FROM scores
      LEFT JOIN branches ON scores.branch_id = branches.id
      LEFT JOIN students ON scores.student_id = students.id
      LEFT JOIN classes ON scores.class_id = classes.id`;

    const params = [];

    const conditions = [];

    if (branch_id) {
      conditions.push("scores.branch_id = ?");
      params.push(branch_id);
    }

    if (class_id) {
      conditions.push("scores.class_id = ?");
      params.push(class_id);
    }

    if (subject) {
      conditions.push("UPPER(scores.subject) = UPPER(?)");
      params.push(subject);
    }

    if (term) {
      conditions.push("scores.term = ?");
      params.push(term);
    }

    if (academic_year) {
      conditions.push("scores.academic_year = ?");
      params.push(academic_year);
    }

    if (approval_status) {
      conditions.push("scores.approval_status = ?");
      params.push(approval_status);
    }

    if (isTeacher) {
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM teacher_assignments ta
          WHERE ta.teacher_id = ?
            AND ta.class_id = scores.class_id
            AND ta.branch_id = scores.branch_id
            AND ta.status = 'active'
        )`
      );
      params.push(teacher.id);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY scores.created_at DESC, scores.id DESC";

    const [scores] = await db.query(sql, params);

    res.json({
      message: "Scores retrieved successfully",
      scores
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve scores",
      error: error.message
    });
  }
};

// Add score
exports.createScore = async (req, res) => {
  try {
    let {
      branch_id,
      student_id,
      subject,
      term,
      academic_year,
      assessment_score,
      examination_score,
      position,
      remarks,
      approval_status
    } = req.body;

    if (req.user && req.user.role === "branch_admin") {
      branch_id = req.user.branch_id;
    }

    if (req.user && req.user.role === "teacher") {
      const teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      branch_id = teacher.branch_id;

      const allowed = await isTeacherAssignedToStudent(teacher.id, student_id);
      if (!allowed) {
        return res.status(403).json({
          message: "You can only upload scores for students in your assigned class"
        });
      }

      approval_status = "pending";
    }

    if (!branch_id || !student_id || !subject) {
      return res.status(400).json({
        message: "Branch, student, and subject are required"
      });
    }

    const [students] = await db.query(
      "SELECT admission_number, class_id FROM students WHERE id = ? LIMIT 1",
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const scoreSummary = buildScoreSummary(assessment_score, examination_score, remarks);

    const [result] = await db.query(
      `INSERT INTO scores
      (
        branch_id,
        student_id,
        admission_number,
        class_id,
        subject,
        term,
        academic_year,
        assessment_score,
        examination_score,
        total_score,
        grade,
        position,
        remarks,
        approval_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        student_id,
        students[0].admission_number,
        students[0].class_id,
        subject,
        term || null,
        academic_year || null,
        scoreSummary.assessment,
        scoreSummary.examination,
        scoreSummary.total,
        scoreSummary.grade,
        position || null,
        scoreSummary.remarks,
        approval_status || "pending"
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Score Added",
        "Scores",
        `Added ${subject} score for student ID ${student_id}. Total score: ${scoreSummary.total}, Grade: ${scoreSummary.grade}.`
      ]
    );

    await recalculatePositionsForGroup({
      branchId: branch_id,
      classId: students[0].class_id,
      subject,
      term: term || null,
      academicYear: academic_year || null
    });

    res.status(201).json({
      message: "Score added successfully",
      score_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add score",
      error: error.message
    });
  }
};

// Update score and auto-recalculate total, grade, and remarks
exports.updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      branch_id,
      assessment_score,
      examination_score,
      position,
      remarks,
      approval_status
    } = req.body;

    const [scoreRows] = await db.query(
      `SELECT id, branch_id, class_id, subject, term, academic_year, assessment_score, examination_score, position, remarks, approval_status
       FROM scores
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (scoreRows.length === 0) {
      return res.status(404).json({
        message: "Score not found"
      });
    }

    const existing = scoreRows[0];

    if (req.user && req.user.role === "branch_admin") {
      branch_id = req.user.branch_id;
    }

    if (req.user && req.user.role === "teacher") {
      const teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      const [assignmentRows] = await db.query(
        `SELECT 1
         FROM teacher_assignments
         WHERE teacher_id = ?
           AND class_id = ?
           AND branch_id = ?
           AND status = 'active'
         LIMIT 1`,
        [teacher.id, existing.class_id, existing.branch_id]
      );

      if (assignmentRows.length === 0) {
        return res.status(403).json({
          message: "You can only edit scores for your assigned class"
        });
      }

      branch_id = teacher.branch_id;
      approval_status = "pending";
    }

    const finalBranchId = branch_id || existing.branch_id;
    const finalApprovalStatus = approval_status || existing.approval_status || "pending";

    const scoreSummary = buildScoreSummary(
      assessment_score ?? existing.assessment_score,
      examination_score ?? existing.examination_score,
      remarks ?? existing.remarks
    );

    const [result] = await db.query(
      `UPDATE scores
       SET branch_id = ?,
           assessment_score = ?,
           examination_score = ?,
           total_score = ?,
           grade = ?,
           position = ?,
           remarks = ?,
           approval_status = ?
       WHERE id = ?`,
      [
        finalBranchId,
        scoreSummary.assessment,
        scoreSummary.examination,
        scoreSummary.total,
        scoreSummary.grade,
        position ?? existing.position,
        scoreSummary.remarks,
        finalApprovalStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Score not found"
      });
    }

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        finalBranchId,
        req.user ? req.user.id : null,
        "Score Updated",
        "Scores",
        `Updated score ID ${id}. Total score: ${scoreSummary.total}, Grade: ${scoreSummary.grade}.`
      ]
    );

    await recalculatePositionsForGroup({
      branchId: finalBranchId,
      classId: existing.class_id,
      subject: existing.subject,
      term: existing.term,
      academicYear: existing.academic_year
    });

    res.json({
      message: "Score updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update score",
      error: error.message
    });
  }
};

// Update approval status
exports.updateScoreApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status } = req.body;

    const allowed = ["pending", "approved", "rejected"];

    if (!allowed.includes(approval_status)) {
      return res.status(400).json({
        message: "Invalid approval status"
      });
    }

    const [result] = await db.query(
      "UPDATE scores SET approval_status = ? WHERE id = ?",
      [approval_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Score not found"
      });
    }

    const [scoreRows] = await db.query(
      "SELECT branch_id, student_id, subject FROM scores WHERE id = ? LIMIT 1",
      [id]
    );

    if (scoreRows.length > 0) {
      await db.query(
        `INSERT INTO activity_logs
        (branch_id, user_id, action, module, description)
        VALUES (?, ?, ?, ?, ?)`,
        [
          scoreRows[0].branch_id,
          req.user ? req.user.id : null,
          "Score Approval Changed",
          "Scores",
          `Changed ${scoreRows[0].subject} score approval for student ID ${scoreRows[0].student_id} to ${approval_status}.`
        ]
      );
    }

    res.json({
      message: "Score approval status updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update score approval",
      error: error.message
    });
  }
};

// Download Excel score template
exports.downloadScoreTemplate = async (req, res) => {
  try {
    const ExcelJS = require("exceljs");

    let {
      branch_id,
      class_id,
      subject,
      term,
      academic_year
    } = req.query;

    if (req.user && (req.user.role === "branch_admin" || req.user.role === "admin")) {
      branch_id = req.user.branch_id;
    }

    if (req.user && req.user.role === "teacher") {
      const teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      branch_id = teacher.branch_id;

      const allowedClass = await isTeacherAssignedToClass(teacher.id, class_id, branch_id);
      if (!allowedClass) {
        return res.status(403).json({
          message: "You can only download templates for your assigned class"
        });
      }
    }

    if (!branch_id || !class_id || !subject || !term || !academic_year) {
      return res.status(400).json({
        message: "Branch, class, subject, term, and academic year are required"
      });
    }

    const [students] = await db.query(
      `SELECT 
        students.id,
        students.admission_number,
        COALESCE(students.full_name, CONCAT(students.first_name, ' ', students.surname)) AS student_name,
        classes.class_name
       FROM students
       LEFT JOIN classes ON students.class_id = classes.id
       WHERE students.branch_id = ?
         AND students.class_id = ?
         AND students.status = 'active'
       ORDER BY student_name ASC`,
      [branch_id, class_id]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Scores");

    worksheet.columns = [
      { header: "Student ID", key: "student_id", width: 12 },
      { header: "Admission Number", key: "admission_number", width: 20 },
      { header: "Student Name", key: "student_name", width: 30 },
      { header: "Class", key: "class_name", width: 18 },
      { header: "Subject", key: "subject", width: 20 },
      { header: "Term", key: "term", width: 15 },
      { header: "Academic Year", key: "academic_year", width: 18 },
      { header: "Assessment Score", key: "assessment_score", width: 18 },
      { header: "Examination Score", key: "examination_score", width: 18 },
      { header: "Remarks", key: "remarks", width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true };

    students.forEach(student => {
      worksheet.addRow({
        student_id: student.id,
        admission_number: student.admission_number,
        student_name: student.student_name,
        class_name: student.class_name,
        subject,
        term,
        academic_year,
        assessment_score: "",
        examination_score: "",
        remarks: ""
      });
    });

    worksheet.getColumn("student_id").protection = { locked: true };
    worksheet.getColumn("admission_number").protection = { locked: true };
    worksheet.getColumn("student_name").protection = { locked: true };
    worksheet.getColumn("class_name").protection = { locked: true };

    const fileName = `score-template-${subject}-${term}-${academic_year}.xlsx`
      .replaceAll(" ", "-")
      .replaceAll("/", "-");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Download score template error:", error);
    res.status(500).json({
      message: "Failed to download score template",
      error: error.message
    });
  }
};


// Upload Excel scores
exports.uploadScoreExcel = async (req, res) => {
  try {
    const ExcelJS = require("exceljs");

    let {
      branch_id,
      subject,
      term,
      academic_year
    } = req.body;

    if (req.user && req.user.role === "branch_admin") {
      branch_id = req.user.branch_id;
    }

    let teacher = null;

    if (req.user && req.user.role === "teacher") {
      teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      branch_id = teacher.branch_id;
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an Excel file"
      });
    }

    if (!branch_id || !subject || !term || !academic_year) {
      return res.status(400).json({
        message: "Branch, subject, term, and academic year are required"
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet("Scores") || workbook.worksheets[0];

    const [settingsRows] = await db.query(
      "SELECT assessment_max_score, examination_max_score FROM settings WHERE id = 1 LIMIT 1"
    );

    const assessmentMax = settingsRows.length > 0
      ? Number(settingsRows[0].assessment_max_score)
      : NaN;

    const examinationMax = settingsRows.length > 0
      ? Number(settingsRows[0].examination_max_score)
      : NaN;

    let savedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const touchedGroups = new Map();

    const addTouchedGroup = (group) => {
      if (!group || !group.classId || !group.subject) {
        return;
      }

      const key = [
        String(group.branchId ?? ""),
        String(group.classId ?? ""),
        String(group.subject ?? "").toUpperCase(),
        String(group.term ?? ""),
        String(group.academicYear ?? "")
      ].join("|");

      touchedGroups.set(key, group);
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const studentId = readExcelCellValue(row.getCell(1).value);
      const admissionNumber = readExcelCellValue(row.getCell(2).value);
      const assessmentScoreRaw = row.getCell(8).value;
      const examinationScoreRaw = row.getCell(9).value;
      const remarks = readExcelCellValue(row.getCell(10).value);

      if (!studentId && !admissionNumber) {
        skippedCount++;
        continue;
      }

      if (isExcelCellBlank(assessmentScoreRaw) && isExcelCellBlank(examinationScoreRaw)) {
        skippedCount++;
        continue;
      }

      const assessmentScore = toSafeNumber(readExcelCellValue(assessmentScoreRaw));
      const examinationScore = toSafeNumber(readExcelCellValue(examinationScoreRaw));

      if (assessmentScore < 0 || examinationScore < 0) {
        skippedCount++;
        continue;
      }

      if (Number.isFinite(assessmentMax) && assessmentScore > assessmentMax) {
        skippedCount++;
        continue;
      }

      if (Number.isFinite(examinationMax) && examinationScore > examinationMax) {
        skippedCount++;
        continue;
      }

      const [students] = await db.query(
        `SELECT id, admission_number, class_id
         FROM students
         WHERE id = ? OR admission_number = ?
         LIMIT 1`,
        [studentId || 0, admissionNumber || ""]
      );

      if (students.length === 0) {
        skippedCount++;
        continue;
      }

      const student = students[0];

      if (teacher) {
        const allowed = await isTeacherAssignedToStudent(teacher.id, student.id);
        if (!allowed) {
          skippedCount++;
          continue;
        }
      }

      const scoreSummary = buildScoreSummary(assessmentScore, examinationScore, remarks);

      const [existing] = await db.query(
        `SELECT id, branch_id, class_id, subject, term, academic_year
         FROM scores
         WHERE student_id = ?
           AND subject = ?
           AND term = ?
           AND academic_year = ?
         LIMIT 1`,
        [student.id, subject, term, academic_year]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE scores
           SET branch_id = ?,
               admission_number = ?,
               class_id = ?,
               assessment_score = ?,
               examination_score = ?,
               total_score = ?,
               grade = ?,
               remarks = ?,
               entry_method = 'excel_upload',
               approval_status = 'pending'
           WHERE id = ?`,
          [
            branch_id,
            student.admission_number,
            student.class_id,
            scoreSummary.assessment,
            scoreSummary.examination,
            scoreSummary.total,
            scoreSummary.grade,
            scoreSummary.remarks,
            existing[0].id
          ]
        );

        addTouchedGroup({
          branchId: existing[0].branch_id,
          classId: existing[0].class_id,
          subject: existing[0].subject,
          term: existing[0].term,
          academicYear: existing[0].academic_year
        });

        addTouchedGroup({
          branchId: branch_id,
          classId: student.class_id,
          subject,
          term,
          academicYear: academic_year
        });

        updatedCount++;
      } else {
        await db.query(
          `INSERT INTO scores
          (
            branch_id,
            student_id,
            admission_number,
            class_id,
            subject,
            term,
            academic_year,
            assessment_score,
            examination_score,
            total_score,
            grade,
            remarks,
            entry_method,
            approval_status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'excel_upload', 'pending')`,
          [
            branch_id,
            student.id,
            student.admission_number,
            student.class_id,
            subject,
            term,
            academic_year,
            scoreSummary.assessment,
            scoreSummary.examination,
            scoreSummary.total,
            scoreSummary.grade,
            scoreSummary.remarks
          ]
        );

        addTouchedGroup({
          branchId: branch_id,
          classId: student.class_id,
          subject,
          term,
          academicYear: academic_year
        });

        savedCount++;
      }
    }

    for (const group of touchedGroups.values()) {
      await recalculatePositionsForGroup(group);
    }

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Excel Scores Uploaded",
        "Scores",
        `Uploaded Excel scores for ${subject}. Saved: ${savedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}.`
      ]
    );

    res.json({
      message: "Excel scores uploaded successfully",
      saved_count: savedCount,
      updated_count: updatedCount,
      skipped_count: skippedCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload Excel scores",
      error: error.message
    });
  }
};

// Bulk update score approval by branch, class, subject, term, academic year
exports.bulkUpdateScoreApproval = async (req, res) => {
  try {
    const {
      branch_id,
      class_id,
      subject,
      term,
      academic_year,
      approval_status
    } = req.body;

    const allowed = ["pending", "approved", "rejected"];

    if (!allowed.includes(approval_status)) {
      return res.status(400).json({
        message: "Invalid approval status"
      });
    }

    if (!branch_id || !class_id || !subject || !term || !academic_year) {
      return res.status(400).json({
        message: "Branch, class, subject, term, and academic year are required"
      });
    }

    const [result] = await db.query(
      `UPDATE scores
       SET approval_status = ?
       WHERE branch_id = ?
         AND class_id = ?
         AND subject = ?
         AND term = ?
         AND academic_year = ?
         AND approval_status = 'pending'`,
      [
        approval_status,
        branch_id,
        class_id,
        subject,
        term,
        academic_year
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Bulk Score Approval",
        "Scores",
        `Bulk changed ${subject} scores to ${approval_status}. Records affected: ${result.affectedRows}.`
      ]
    );

    res.json({
      message: "Scores approval updated successfully",
      updated_count: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to bulk update score approval",
      error: error.message
    });
  }
};
