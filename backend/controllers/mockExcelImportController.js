
"use strict";

const db = require("../config/database");
const { parseWorkbook } = require("../utils/mockExcel");
const { calculateMockGrade } = require("../utils/mockGrading");

function validId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function authorizedBranch(user, requestedBranch) {
  if (["branch_admin", "teacher_admin", "teacher"].includes(user?.role)) {
    return validId(user.branch_id) ? Number(user.branch_id) : null;
  }

  return validId(requestedBranch) ? Number(requestedBranch) : null;
}

function studentName(student) {
  return (
    student.full_name ||
    [
      student.first_name,
      student.other_name,
      student.surname
    ].filter(Boolean).join(" ")
  ).trim();
}

function normalizeName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

exports.importExcel = async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    const mockId = Number(req.params.mockId);
    const subjectId = Number(req.body.subject_setting_id);

    if (!validId(mockId) || !validId(subjectId)) {
      return res.status(400).json({
        message: "Valid examination and subject IDs are required."
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "Please upload the completed Excel file."
      });
    }

    if (!validId(req.user?.id)) {
      return res.status(403).json({
        message: "Invalid user session."
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // Lock examination while validating and saving.
    const [exams] = await connection.query(
      `SELECT id, branch_id, class_id, academic_year,
              mock_name, status
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [mockId]
    );

    if (!exams.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: "Mock examination not found."
      });
    }

    const exam = exams[0];

    const branchId = authorizedBranch(
      req.user,
      req.body.branch_id
    );

    if (!branchId || branchId !== Number(exam.branch_id)) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: "Access denied for this branch."
      });
    }

    if (exam.status !== "active") {
      await connection.rollback();
      transactionStarted = false;

      return res.status(409).json({
        message: "Only active mock examinations accept scores."
      });
    }

    const [subjects] = await connection.query(
      `SELECT id, mock_id, subject,
              objectives_max, written_max
       FROM mock_subject_settings
       WHERE id = ? AND mock_id = ?
       LIMIT 1`,
      [subjectId, mockId]
    );

    if (!subjects.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: "Subject is not configured for this examination."
      });
    }

    const subject = subjects[0];

    if (req.user.role === "teacher") {
      const [assignments] = await connection.query(
        `SELECT 1
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
           AND UPPER(TRIM(ta.subject)) = UPPER(TRIM(?))
         LIMIT 1`,
        [
          req.user.id,
          exam.branch_id,
          exam.class_id,
          exam.academic_year,
          subject.subject
        ]
      );

      if (!assignments.length) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(403).json({
          message: "You are not assigned to this subject."
        });
      }
    }

    let parsed;

    try {
      parsed = await parseWorkbook(
        req.file.buffer,
        subject,
        exam
      );
    } catch (error) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: error.message || "Invalid Excel template."
      });
    }

    const [students] = await connection.query(
      `SELECT id, student_id, admission_number,
              full_name, first_name, surname, other_name
       FROM students
       WHERE branch_id = ?
         AND class_id = ?
         AND status = 'active'`,
      [exam.branch_id, exam.class_id]
    );

    const studentMap = new Map(
      students.map(student => [Number(student.id), student])
    );

    const errors = [...parsed.errors];
    const prepared = [];

    for (const row of parsed.rows) {
      const student = studentMap.get(Number(row.student_id));

      if (!student) {
        errors.push(
          "Student ID " + row.student_id +
          " does not belong to this examination class."
        );
        continue;
      }

      const expectedAdmission = String(
        student.admission_number || student.student_id || ""
      ).trim();

      if (row.admission_number !== expectedAdmission) {
        errors.push(
          "Admission number mismatch for student ID " +
          row.student_id + "."
        );
        continue;
      }

      if (
        normalizeName(row.student_name) !==
        normalizeName(studentName(student))
      ) {
        errors.push(
          "Student name mismatch for student ID " +
          row.student_id + "."
        );
        continue;
      }

      const objectives = Number(row.objectives_score);
      const written = Number(row.written_score);

      if (
        !Number.isFinite(objectives) ||
        !Number.isFinite(written) ||
        objectives < 0 ||
        written < 0 ||
        objectives > Number(subject.objectives_max) ||
        written > Number(subject.written_max)
      ) {
        errors.push(
          "Invalid marks for student ID " + row.student_id + "."
        );
        continue;
      }

      const total = Number(
        (objectives + written).toFixed(2)
      );

      const grading = await calculateMockGrade(total);

      prepared.push({
        studentId: Number(student.id),
        objectives,
        written,
        grade: grading.grade,
        remarks: grading.remarks
      });
    }

    if (errors.length || !prepared.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Excel validation failed. No scores were saved.",
        errors
      });
    }

    for (const score of prepared) {
      await connection.query(
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
          score.studentId,
          subjectId,
          score.objectives,
          score.written,
          score.grade,
          score.remarks,
          req.user.id
        ]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return res.json({
      message: "Excel scores imported successfully.",
      examination: exam.mock_name,
      subject: subject.subject,
      saved_count: prepared.length
    });

  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Mock Excel rollback error:", rollbackError);
      }
    }

    console.error("Mock Excel import error:", error);

    return res.status(500).json({
      message: "Failed to import Excel scores. No partial import was committed."
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
