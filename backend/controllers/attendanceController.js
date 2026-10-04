const db = require("../config/database");

function isBranchScopedAdmin(user) {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "branch_admin" || role === "teacher_admin";
}

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

async function isTeacherAssignedToStudent(
  teacherId,
  studentId,
  academicYear
) {
  if (!teacherId || !studentId || !academicYear) return false;

  const [rows] = await db.query(
    `SELECT 1
     FROM teacher_assignments ta
     INNER JOIN students s
       ON s.class_id = ta.class_id
      AND s.branch_id = ta.branch_id
     WHERE ta.teacher_id = ?
       AND ta.status = 'active'
       AND UPPER(TRIM(ta.role)) = 'CLASS TEACHER'
       AND ta.academic_year = ?
       AND s.id = ?
     LIMIT 1`,
    [teacherId, academicYear, studentId]
  );

  return rows.length > 0;
}

// Get students assigned to the logged-in teacher as Class Teacher
exports.getTeacherAttendanceStudents = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Only teachers can load Class Teacher attendance students"
      });
    }

    const teacher = await getTeacherByUserId(req.user.id);

    if (!teacher) {
      return res.status(403).json({
        message: "Teacher profile not found for this account"
      });
    }

    const [settingsRows] = await db.query(
      "SELECT academic_year FROM settings WHERE id = 1 LIMIT 1"
    );

    const currentAcademicYear =
      String(settingsRows[0]?.academic_year || "").trim();

    if (!currentAcademicYear) {
      return res.status(400).json({
        message: "Current academic year is not configured in school settings"
      });
    }

    const [students] = await db.query(
      `SELECT DISTINCT
         s.id,
         s.student_id,
         s.admission_number,
         s.first_name,
         s.surname,
         s.other_name,
         s.full_name,
         s.sex,
         s.class_id,
         c.class_name,
         s.status
       FROM teacher_assignments ta
       INNER JOIN students s
         ON s.class_id = ta.class_id
        AND s.branch_id = ta.branch_id
       LEFT JOIN classes c
         ON c.id = s.class_id
       WHERE ta.teacher_id = ?
         AND ta.branch_id = ?
         AND ta.status = 'active'
         AND s.status = 'active'
         AND UPPER(TRIM(ta.role)) = 'CLASS TEACHER'
         AND ta.academic_year = ?
       ORDER BY c.class_name ASC,
                COALESCE(
                  s.full_name,
                  CONCAT(s.first_name, ' ', s.surname)
                ) ASC`,
      [teacher.id, teacher.branch_id, currentAcademicYear]
    );

    return res.json({
      message: "Class Teacher attendance students retrieved successfully",
      students
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve Class Teacher attendance students",
      error: error.message
    });
  }
};

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
      LEFT JOIN classes ON students.class_id = classes.id
      LEFT JOIN teachers ON attendance.teacher_id = teachers.id`;

    const params = [];

    const conditions = [];

    if (isBranchScopedAdmin(req.user)) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this account"
        });
      }

      conditions.push("attendance.branch_id = ?");
      params.push(req.user.branch_id);
    } else if (branch_id) {
      conditions.push("attendance.branch_id = ?");
      params.push(branch_id);
    }

    if (isTeacher) {
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM teacher_assignments ta
          WHERE ta.teacher_id = ?
            AND ta.class_id = students.class_id
            AND ta.branch_id = students.branch_id
            AND ta.status = 'active'
            AND UPPER(TRIM(ta.role)) = 'CLASS TEACHER'
            AND ta.academic_year = attendance.academic_year
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

    if (isBranchScopedAdmin(req.user)) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this account"
        });
      }

      branch_id = req.user.branch_id;
    }

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

      const allowed = await isTeacherAssignedToStudent(
        teacher.id,
        student_id,
        academic_year
      );
      if (!allowed) {
        return res.status(403).json({
          message: "Only the assigned Class Teacher can mark attendance for this student"
        });
      }

      branch_id = teacher.branch_id;
      teacher_id = teacher.id;
    }

    const [students] = await db.query(
      "SELECT class_id, branch_id FROM students WHERE id = ? LIMIT 1",
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const class_id = students[0].class_id;

    if (isBranchScopedAdmin(req.user) && Number(students[0].branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only mark attendance for students in your own branch"
      });
    }

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
      "SELECT id, branch_id, student_id, class_id, teacher_id, academic_year FROM attendance WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    const existing = existingRows[0];

    if (isBranchScopedAdmin(req.user)) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this account"
        });
      }

      if (Number(existing.branch_id) !== Number(req.user.branch_id)) {
        return res.status(403).json({
          message: "You can only update attendance in your own branch"
        });
      }

      branch_id = req.user.branch_id;
    }

    if (req.user && req.user.role === "teacher") {
      const teacher = await getTeacherByUserId(req.user.id);

      if (!teacher) {
        return res.status(403).json({
          message: "Teacher profile not found for this account"
        });
      }

      const targetStudentId = student_id || existing.student_id;
      const targetAcademicYear =
        String(academic_year || existing.academic_year || "").trim();

      const allowed = await isTeacherAssignedToStudent(
        teacher.id,
        targetStudentId,
        targetAcademicYear
      );

      if (!allowed) {
        return res.status(403).json({
          message: "Only the assigned Class Teacher can update attendance for this student"
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

    const targetStudentId = student_id || existing.student_id;
    const [studentRows] = await db.query(
      "SELECT branch_id FROM students WHERE id = ? LIMIT 1",
      [targetStudentId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    if (isBranchScopedAdmin(req.user) && Number(studentRows[0].branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only update attendance for students in your own branch"
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

    // Branch-scoped admins must always have an authenticated branch.
    if (isBranchScopedAdmin(req.user) && !req.user.branch_id) {
      return res.status(403).json({
        message: "No branch is assigned to this account"
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

      const [studentRows] = await db.query(
        `SELECT id, branch_id, class_id
         FROM students
         WHERE id = ?
         LIMIT 1`,
        [record.student_id]
      );

      if (studentRows.length === 0) {
        continue;
      }

      const student = studentRows[0];

      let branchId = student.branch_id;
      let classId = student.class_id;
      let teacherId = record.teacher_id || null;

      if (teacher) {
        const allowed = await isTeacherAssignedToStudent(
          teacher.id,
          record.student_id,
          record.academic_year
        );

        if (!allowed) {
          continue;
        }

        if (
          Number(student.branch_id) !==
          Number(teacher.branch_id)
        ) {
          continue;
        }

        branchId = student.branch_id;
        classId = student.class_id;
        teacherId = teacher.id;
      } else if (
        isBranchScopedAdmin(req.user) &&
        Number(student.branch_id) !==
        Number(req.user.branch_id)
      ) {
        continue;
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
          classId,
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
