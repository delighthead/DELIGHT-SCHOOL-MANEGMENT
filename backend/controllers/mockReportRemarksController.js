
"use strict";

const db = require("../config/database");

const ADMIN_ROLES = new Set([
  "super_admin",
  "admin",
  "branch_admin",
  "teacher_admin"
]);

function validId(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0;
}

function branchAllowed(user, branchId) {
  if (!user) return false;

  if (
    ["teacher", "teacher_admin", "branch_admin"]
      .includes(user.role)
  ) {
    return validId(user.branch_id) &&
      Number(user.branch_id) === Number(branchId);
  }

  return ["super_admin", "admin"].includes(user.role);
}

async function loadContext(mockId, studentId) {
  const [rows] = await db.query(
    `SELECT
       m.id AS mock_id,
       m.branch_id,
       m.class_id,
       m.academic_year,
       s.id AS student_id
     FROM mock_examinations m
     INNER JOIN students s
       ON s.id = ?
      AND s.branch_id = m.branch_id
      AND s.class_id = m.class_id
     WHERE m.id = ?
     LIMIT 1`,
    [studentId, mockId]
  );

  return rows[0] || null;
}

async function isAssignedClassTeacher(user, context) {
  if (!user || user.role !== "teacher") return false;

  const [rows] = await db.query(
    `SELECT 1
     FROM teachers t
     INNER JOIN teacher_assignments ta
       ON ta.teacher_id = t.id
      AND ta.branch_id = t.branch_id
     WHERE t.user_id = ?
       AND t.branch_id = ?
       AND t.status = 'active'
       AND ta.branch_id = ?
       AND ta.class_id = ?
       AND ta.academic_year = ?
       AND ta.status = 'active'
       AND UPPER(TRIM(ta.role)) = 'CLASS TEACHER'
     LIMIT 1`,
    [
      user.id,
      context.branch_id,
      context.branch_id,
      context.class_id,
      context.academic_year
    ]
  );

  return rows.length > 0;
}

async function permissions(user, context) {
  const admin = ADMIN_ROLES.has(user.role);

  return {
    can_edit_teacher:
      admin || await isAssignedClassTeacher(user, context),

    can_edit_headteacher: admin
  };
}

async function resolveRequest(req, res) {
  const mockId = Number(req.params.mockId);
  const studentId = Number(req.params.studentId);

  if (!validId(mockId) || !validId(studentId)) {
    res.status(400).json({
      message: "Valid mock and student IDs are required"
    });
    return null;
  }

  const context = await loadContext(mockId, studentId);

  if (!context) {
    res.status(404).json({
      message: "Student not found in this mock examination class"
    });
    return null;
  }

  if (!branchAllowed(req.user, context.branch_id)) {
    res.status(403).json({
      message: "Access denied for this branch"
    });
    return null;
  }

  const access = await permissions(req.user, context);

  if (
    !ADMIN_ROLES.has(req.user.role) &&
    !access.can_edit_teacher
  ) {
    res.status(403).json({
      message: "No active Class Teacher assignment for this examination"
    });
    return null;
  }

  return { context, access };
}

exports.getRemarks = async (req, res) => {
  try {
    const resolved = await resolveRequest(req, res);
    if (!resolved) return;

    const { context, access } = resolved;

    const [rows] = await db.query(
      `SELECT
         class_teacher_remark,
         headteacher_remark,
         teacher_updated_by,
         headteacher_updated_by,
         updated_at
       FROM mock_report_remarks
       WHERE mock_id = ?
         AND student_id = ?
       LIMIT 1`,
      [context.mock_id, context.student_id]
    );

    return res.json({
      mock_id: context.mock_id,
      student_id: context.student_id,
      remarks: rows[0] || {
        class_teacher_remark: "",
        headteacher_remark: ""
      },
      permissions: access
    });

  } catch (error) {
    console.error("Get mock report remarks error:", error);
    return res.status(500).json({
      message: "Failed to retrieve report remarks"
    });
  }
};

exports.saveRemarks = async (req, res) => {
  try {
    const resolved = await resolveRequest(req, res);
    if (!resolved) return;

    const { context, access } = resolved;

    const allowedFields = [
      "class_teacher_remark",
      "headteacher_remark"
    ];

    const submitted = Object.keys(req.body || {})
      .filter(key => allowedFields.includes(key));

    if (submitted.length !== 1) {
      return res.status(400).json({
        message: "Submit exactly one remarks field at a time"
      });
    }

    const field = submitted[0];

    if (
      field === "class_teacher_remark" &&
      !access.can_edit_teacher
    ) {
      return res.status(403).json({
        message: "Not authorized to edit Class Teacher's Remarks"
      });
    }

    if (
      field === "headteacher_remark" &&
      !access.can_edit_headteacher
    ) {
      return res.status(403).json({
        message: "Not authorized to edit Headteacher's Remarks"
      });
    }

    if (typeof req.body[field] !== "string") {
      return res.status(400).json({
        message: "Remarks must be text"
      });
    }

    const value = req.body[field].trim();

    if (value.length > 2000) {
      return res.status(400).json({
        message: "Remarks cannot exceed 2000 characters"
      });
    }

    const editorField =
      field === "class_teacher_remark"
        ? "teacher_updated_by"
        : "headteacher_updated_by";

    await db.query(
      `INSERT INTO mock_report_remarks
         (mock_id, student_id, ${field}, ${editorField})
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ${field} = VALUES(${field}),
         ${editorField} = VALUES(${editorField})`,
      [
        context.mock_id,
        context.student_id,
        value,
        req.user.id
      ]
    );

    return res.json({
      message: "Report remarks saved successfully",
      mock_id: context.mock_id,
      student_id: context.student_id,
      field,
      value
    });

  } catch (error) {
    console.error("Save mock report remarks error:", error);
    return res.status(500).json({
      message: "Failed to save report remarks"
    });
  }
};
