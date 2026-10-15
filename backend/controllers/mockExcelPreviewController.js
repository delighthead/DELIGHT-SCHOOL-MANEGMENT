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

exports.previewExcel = async (req, res) => {
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
        message: "Please select an Excel file."
      });
    }

    const [exams] = await db.query(
      `SELECT id, branch_id, class_id, academic_year,
              mock_name, status
       FROM mock_examinations
       WHERE id = ?
       LIMIT 1`,
      [mockId]
    );

    if (!exams.length) {
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
      return res.status(403).json({
        message: "Access denied for this branch."
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
        message: "Subject not configured for this examination."
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
      return res.status(400).json({
        message: error.message || "Invalid Excel template."
      });
    }

    const [students] = await db.query(
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
    const preview = [];

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

      const expectedName = studentName(student);

      if (row.admission_number !== expectedAdmission) {
        errors.push(
          "Admission number mismatch for student ID " +
          row.student_id + "."
        );
        continue;
      }

      if (
        row.student_name.replace(/\s+/g, " ").trim().toLowerCase() !==
        expectedName.replace(/\s+/g, " ").trim().toLowerCase()
      ) {
        errors.push(
          "Student name mismatch for student ID " +
          row.student_id + "."
        );
        continue;
      }

      const total = Number(
        (row.objectives_score + row.written_score).toFixed(2)
      );

      const grading = await calculateMockGrade(total);

      preview.push({
        student_id: row.student_id,
        admission_number: expectedAdmission,
        student_name: expectedName,
        objectives_score: row.objectives_score,
        written_score: row.written_score,
        total_score: total,
        grade: grading.grade,
        remarks: grading.remarks
      });
    }

    return res.json({
      message: errors.length
        ? "Excel validation found errors. Nothing has been saved."
        : "Excel preview ready. Nothing has been saved.",
      valid: errors.length === 0 && preview.length > 0,
      examination: exam.mock_name,
      subject: subject.subject,
      student_count: preview.length,
      errors,
      preview
    });

  } catch (error) {
    console.error("Mock Excel preview error:", error);

    return res.status(500).json({
      message: "Failed to preview Excel scores."
    });
  }
};
