const db = require("../config/database");

function normalizeAttendanceStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "present" || value === "absent") {
    return value;
  }
  return "";
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

// Get attendance records, optionally by branch
exports.getAttendance = async (req, res) => {
  try {
    const { branch_id } = req.query;
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
        attendance.id,
        attendance.branch_id,
        branches.branch_name,
        attendance.student_id,
        students.admission_number,
        COALESCE(students.full_name, CONCAT(students.first_name, ' ', students.surname)) AS student_name,
        classes.class_name,
        teachers.full_name AS teacher_name,
        attendance.attendance_date,
        attendance.term,
        attendance.academic_year,
        attendance.status,
        attendance.remarks,
        attendance.created_at
      FROM attendance
      LEFT JOIN branches ON attendance.branch_id = branches.id
      LEFT JOIN students ON attendance.student_id = students.id
      LEFT JOIN classes ON attendance.class_id = classes.id
      LEFT JOIN teachers ON attendance.teacher_id = teachers.id`;

    const params = [];

    const conditions = [];

    if (branch_id) {
      conditions.push("attendance.branch_id = ?");
      params.push(branch_id);
    }

    if (isTeacher) {
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM teacher_assignments ta
          WHERE ta.teacher_id = ?
            AND ta.class_id = attendance.class_id
            AND ta.branch_id = attendance.branch_id
            AND ta.status = 'active'
        )`
      );
      params.push(teacher.id);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY attendance.attendance_date DESC, attendance.id DESC";

    const [attendance] = await db.query(sql, params);

    res.json({
      message: "Attendance records retrieved successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve attendance",
      error: error.message
    });
  }
};

// Add attendance record
exports.createAttendance = async (req, res) => {
  try {
    let {
      branch_id,
      student_id,
      teacher_id,
      attendance_date,
      term,
      academic_year,
      status,
      remarks
    } = req.body;

    if (!branch_id || !student_id || !attendance_date || !status) {
      return res.status(400).json({
        message: "Branch, student, attendance date, and status are required"
      });
    }

    const normalizedStatus = normalizeAttendanceStatus(status);

    if (!normalizedStatus) {
      return res.status(400).json({
        message: "Attendance status must be Present or Absent"
      });
    }

    if (req.user && req.user.role === "teacher") {
      const teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      const allowed = await isTeacherAssignedToStudent(teacher.id, student_id);
      if (!allowed) {
        return res.status(403).json({
          message: "You can only mark attendance for students in your assigned class"
        });
      }

      branch_id = teacher.branch_id;
      teacher_id = teacher.id;
    }

    const [students] = await db.query(
      "SELECT class_id FROM students WHERE id = ? LIMIT 1",
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const class_id = students[0].class_id;

    const [result] = await db.query(
      `INSERT INTO attendance
      (branch_id, student_id, class_id, teacher_id, attendance_date, term, academic_year, status, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        student_id,
        class_id,
        teacher_id || null,
        attendance_date,
        term || null,
        academic_year || null,
        normalizedStatus,
        remarks || null
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Attendance Saved",
        "Attendance",
        `Saved attendance for student ID ${student_id} as ${normalizedStatus} on ${attendance_date}.`
      ]
    );

    res.status(201).json({
      message: "Attendance record added successfully",
      attendance_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add attendance record",
      error: error.message
    });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    let {
      branch_id,
      student_id,
      class_id,
      teacher_id,
      attendance_date,
      term,
      academic_year,
      status,
      remarks
    } = req.body;

    const [existingRows] = await db.query(
      "SELECT id, branch_id, student_id, class_id, teacher_id FROM attendance WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    const existing = existingRows[0];

    if (req.user && req.user.role === "teacher") {
      const teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      const targetStudentId = student_id || existing.student_id;
      const allowed = await isTeacherAssignedToStudent(teacher.id, targetStudentId);

      if (!allowed) {
        return res.status(403).json({
          message: "You can only update attendance for students in your assigned class"
        });
      }

      branch_id = teacher.branch_id;
      teacher_id = teacher.id;
      class_id = class_id || existing.class_id;
    }

    const normalizedStatus = normalizeAttendanceStatus(status);

    if (!normalizedStatus) {
      return res.status(400).json({
        message: "Attendance status must be Present or Absent"
      });
    }

    await db.query(
      `UPDATE attendance
       SET branch_id = ?,
           student_id = ?,
           class_id = ?,
           teacher_id = ?,
           attendance_date = ?,
           term = ?,
           academic_year = ?,
             status = ?,
           remarks = ?
       WHERE id = ?`,
      [
        branch_id || null,
        student_id,
        class_id || null,
        teacher_id || null,
        attendance_date,
        term || null,
        academic_year || null,
        normalizedStatus,
        remarks || null,
        id
      ]
    );

    res.json({
      message: "Attendance updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update attendance",
      error: error.message
    });
  }
};

// Bulk save/update attendance records
exports.bulkSaveAttendance = async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: "No attendance records provided"
      });
    }

    let teacher = null;

    if (req.user && req.user.role === "teacher") {
      teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }
    }

    for (const record of records) {
      const normalizedStatus = normalizeAttendanceStatus(record.status);

      if (!normalizedStatus) {
        continue;
      }

      let branchId = record.branch_id || null;
      let teacherId = record.teacher_id || null;

      if (teacher) {
        const allowed = await isTeacherAssignedToStudent(teacher.id, record.student_id);
        if (!allowed) {
          continue;
        }

        branchId = teacher.branch_id;
        teacherId = teacher.id;
      }

      await db.query(
        `INSERT INTO attendance
        (
          branch_id,
          student_id,
          class_id,
          teacher_id,
          attendance_date,
          term,
          academic_year,
          status,
          remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          branch_id = VALUES(branch_id),
          class_id = VALUES(class_id),
          teacher_id = VALUES(teacher_id),
          status = VALUES(status),
          remarks = VALUES(remarks)`,
        [
          branchId,
          record.student_id,
          record.class_id || null,
          teacherId,
          record.attendance_date,
          record.term || null,
          record.academic_year || null,
          normalizedStatus,
          record.remarks || null
        ]
      );
    }

    res.json({
      message: "Bulk attendance saved successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save bulk attendance",
      error: error.message
    });
  }
};
