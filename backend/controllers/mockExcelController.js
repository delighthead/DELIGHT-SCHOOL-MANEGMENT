
"use strict";

const db = require("../config/database");
const { createTemplate } = require("../utils/mockExcel");

function validId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function authorizedBranch(user, requestedBranch) {
  if (["branch_admin", "teacher_admin", "teacher"].includes(user?.role)) {
    return validId(user.branch_id) ? Number(user.branch_id) : null;
  }

  return validId(requestedBranch) ? Number(requestedBranch) : null;
}

exports.downloadTemplate = async (req, res) => {
  try {
    const mockId = Number(req.params.mockId);
    const subjectId = Number(req.query.subject_setting_id);

    if (!validId(mockId) || !validId(subjectId)) {
      return res.status(400).json({
        message: "Valid examination and subject IDs are required"
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

    const branchId = authorizedBranch(
      req.user,
      req.query.branch_id
    );

    if (!branchId || branchId !== Number(exam.branch_id)) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    const [subjects] = await db.query(
      `SELECT id, mock_id, subject, objectives_max, written_max
       FROM mock_subject_settings
       WHERE id = ? AND mock_id = ?
       LIMIT 1`,
      [subjectId, mockId]
    );

    if (!subjects.length) {
      return res.status(404).json({
        message: "Subject not configured for this examination"
      });
    }

    const subject = subjects[0];

    if (req.user.role === "teacher") {
      const [assignments] = await db.query(
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
        return res.status(403).json({
          message: "You are not assigned to this subject"
        });
      }
    }

    const [students] = await db.query(
      `SELECT id, student_id, admission_number,
              full_name, first_name, surname, other_name
       FROM students
       WHERE branch_id = ?
         AND class_id = ?
         AND status = 'active'
       ORDER BY surname, first_name, id`,
      [exam.branch_id, exam.class_id]
    );

    const [scores] = await db.query(
      `SELECT student_id, subject_setting_id,
              objectives_score, written_score,
              total_score, grade, remarks
       FROM mock_scores
       WHERE mock_id = ?
         AND subject_setting_id = ?`,
      [mockId, subjectId]
    );

    const buffer = await createTemplate(
      exam,
      subject,
      students,
      scores
    );

    const safeSubject = subject.subject
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);

    const filename =
      "Mock_" + mockId + "_" + safeSubject + "_Scores.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=\"" + filename + "\""
    );

    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Mock Excel download error:", error);

    return res.status(500).json({
      message: "Failed to generate Excel template"
    });
  }
};
