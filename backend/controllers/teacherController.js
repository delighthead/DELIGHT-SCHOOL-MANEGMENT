const bcrypt = require("bcryptjs");
const db = require("../config/database");

function isBranchScopedAdmin(user) {
  if (!user) return false;
  return user.role === "branch_admin" || user.role === "teacher_admin";
}

async function getTeacherById(teacherId) {
  if (!teacherId) return null;

  const [rows] = await db.query(
    "SELECT id, user_id, branch_id, full_name, ghana_card_number FROM teachers WHERE id = ? LIMIT 1",
    [teacherId]
  );

  return rows.length > 0 ? rows[0] : null;
}

async function getOrCreateClass(className, branchId = 4) {
  if (!className) return null;

  const academicYear = "2025/2026";

  // classes.class_name is UNIQUE in your database,
  // so search by class_name only to avoid duplicate class errors.
  const [existing] = await db.query(
    "SELECT id FROM classes WHERE class_name = ? LIMIT 1",
    [className]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [result] = await db.query(
    "INSERT INTO classes (branch_id, class_name, academic_year, status) VALUES (?, ?, ?, 'active')",
    [branchId || null, className, academicYear]
  );

  return result.insertId;
}

async function getTeacherByUserId(userId) {
  if (!userId) return null;

  const [rows] = await db.query(
    "SELECT id, user_id, branch_id FROM teachers WHERE user_id = ? LIMIT 1",
    [userId]
  );

  return rows.length > 0 ? rows[0] : null;
}

exports.createTeacher = async (req, res) => {
  let conn;
  try {
    const {
      teacher_id,
      full_name,
      gender,
      date_of_birth,
      ghana_card_number,
      phone,
      email,
      address,
      date_employed,
      qualification,
      profile_picture,
      branch_id,
      status
    } = req.body;

    const effectiveBranchId = isBranchScopedAdmin(req.user)
      ? req.user.branch_id
      : branch_id;

    if (!teacher_id || !full_name || !ghana_card_number || !phone) {
      return res.status(400).json({
        message: "Teacher ID, full name, Ghana Card number, and phone are required"
      });
    }

    if (!effectiveBranchId) {
      return res.status(400).json({
        message: "Branch is required"
      });
    }

    const hashedPassword = await bcrypt.hash(phone, 10);

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [userResult] = await conn.query(
      `INSERT INTO users (branch_id, full_name, username, password, role, phone, email, status)
       VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?)`,
      [
        effectiveBranchId,
        full_name,
        ghana_card_number,
        hashedPassword,
        phone,
        email || null,
        status || "active"
      ]
    );

    const [teacherResult] = await conn.query(
      `INSERT INTO teachers
      (branch_id, user_id, teacher_id, full_name, gender, date_of_birth,
       ghana_card_number, phone, email, address, date_employed, qualification,
       profile_picture, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        effectiveBranchId,
        userResult.insertId,
        teacher_id,
        full_name,
        gender || null,
        date_of_birth || null,
        ghana_card_number,
        phone,
        email || null,
        address || null,
        date_employed || null,
        qualification || null,
        profile_picture || null,
        status || "active"
      ]
    );

    await conn.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        effectiveBranchId,
        req.user ? req.user.id : null,
        "Teacher Added",
        "Teachers",
        `Added teacher ${full_name} with teacher ID ${teacher_id}.`
      ]
    );

    await conn.commit();

    res.status(201).json({
      message: "Teacher added successfully",
      teacher_database_id: teacherResult.insertId,
      login_username: ghana_card_number,
      login_password: phone
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error("Failed to rollback teacher create transaction:", rollbackError.message);
      }
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Teacher ID, Ghana Card, or username already exists"
      });
    }

    res.status(500).json({
      message: "Failed to add teacher",
      error: error.message
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

exports.getTeachers = async (req, res) => {
  try {
    let { branch_id } = req.query;

    // Branch admin must only see teachers in their own branch
    if (req.user && (req.user.role === "branch_admin" || req.user.role === "teacher_admin")) {
      branch_id = req.user.branch_id;
    }

    let sql = `SELECT 
        teachers.id,
        teachers.branch_id,
        branches.branch_name,
        teachers.teacher_id,
        teachers.full_name,
        teachers.gender,
        teachers.date_of_birth,
        teachers.ghana_card_number,
        teachers.phone,
        teachers.email,
        teachers.address,
        teachers.date_employed,
        teachers.qualification,
        teachers.status,
        teachers.created_at,
        GROUP_CONCAT(DISTINCT classes.class_name ORDER BY classes.class_name SEPARATOR ', ') AS assigned_classes,
        GROUP_CONCAT(
          DISTINCT CASE
            WHEN UPPER(TRIM(teacher_assignments.role)) = 'SUBJECT TEACHER'
            THEN teacher_assignments.subject
            ELSE NULL
          END
          ORDER BY teacher_assignments.subject
          SEPARATOR ', '
        ) AS assigned_subjects
      FROM teachers
      LEFT JOIN branches ON teachers.branch_id = branches.id
      LEFT JOIN teacher_assignments 
        ON teacher_assignments.teacher_id = teachers.id
        AND teacher_assignments.status = 'active'
      LEFT JOIN classes ON teacher_assignments.class_id = classes.id`;

    const params = [];

    if (branch_id) {
      sql += " WHERE teachers.branch_id = ?";
      params.push(branch_id);
    }

    sql += " GROUP BY teachers.id ORDER BY teachers.id DESC";

    const [teachers] = await db.query(sql, params);

    res.json({
      message: "Teachers retrieved successfully",
      teachers
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve teachers",
      error: error.message
    });
  }
};

exports.assignTeacher = async (req, res) => {
  try {
    const {
      teacher_database_id,
      branch_id,
      class_name,
      subject,
      role,
      academic_year
    } = req.body;

    if (!teacher_database_id || !class_name) {
      return res.status(400).json({
        message: "Teacher and class are required"
      });
    }

    const allowedAssignmentRoles = [
      "Admin",
      "Class Teacher",
      "Subject Teacher"
    ];

    const branchScopedRoles = [
      "Class Teacher",
      "Subject Teacher"
    ];

    const normalizedRole =
      String(role || "Subject Teacher").trim();

    if (!allowedAssignmentRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid assignment role"
      });
    }

    /*
     * Class Teacher and Subject Teacher are separate assignments.
     *
     * The existing database requires teacher_assignments.subject
     * to be NOT NULL, so Class Teacher records use the reserved
     * internal value "CLASS TEACHER".
     */
    let finalSubject;

    if (normalizedRole === "Class Teacher") {
      finalSubject = "CLASS TEACHER";
    } else {
      finalSubject = String(subject || "").trim();

      if (!finalSubject) {
        return res.status(400).json({
          message: "Subject is required for a Subject Teacher assignment"
        });
      }
    }

    const teacher =
      await getTeacherById(teacher_database_id);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    if (
      isBranchScopedAdmin(req.user) &&
      Number(teacher.branch_id) !==
        Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message:
          "You can only assign teachers in your own branch"
      });
    }

    if (
      isBranchScopedAdmin(req.user) &&
      !branchScopedRoles.includes(normalizedRole)
    ) {
      return res.status(403).json({
        message:
          "Branch admin can only assign Class Teacher or Subject Teacher roles"
      });
    }

    const effectiveBranchId =
      isBranchScopedAdmin(req.user)
        ? req.user.branch_id
        : (branch_id || teacher.branch_id || 4);

    const class_id =
      await getOrCreateClass(
        class_name,
        effectiveBranchId
      );

    const finalAcademicYear =
      academic_year || "2025/2026";

    /*
     * Duplicate protection is role-aware.
     *
     * Class Teacher:
     * teacher + branch + class + role + academic year
     *
     * Subject Teacher:
     * teacher + branch + class + subject + role + academic year
     */
    let duplicateSql;
    let duplicateParams;

    if (normalizedRole === "Class Teacher") {
      duplicateSql = `
        SELECT id
        FROM teacher_assignments
        WHERE teacher_id = ?
          AND branch_id = ?
          AND class_id = ?
          AND UPPER(TRIM(role)) = 'CLASS TEACHER'
          AND academic_year = ?
          AND status = 'active'
        LIMIT 1
      `;

      duplicateParams = [
        teacher_database_id,
        effectiveBranchId,
        class_id,
        finalAcademicYear
      ];
    } else {
      duplicateSql = `
        SELECT id
        FROM teacher_assignments
        WHERE teacher_id = ?
          AND branch_id = ?
          AND class_id = ?
          AND UPPER(TRIM(subject)) =
              UPPER(TRIM(?))
          AND UPPER(TRIM(role)) =
              UPPER(TRIM(?))
          AND academic_year = ?
          AND status = 'active'
        LIMIT 1
      `;

      duplicateParams = [
        teacher_database_id,
        effectiveBranchId,
        class_id,
        finalSubject,
        normalizedRole,
        finalAcademicYear
      ];
    }

    const [existingAssignments] =
      await db.query(
        duplicateSql,
        duplicateParams
      );

    if (existingAssignments.length > 0) {
      return res.status(200).json({
        message:
          normalizedRole === "Class Teacher"
            ? "Class Teacher assignment already exists"
            : "Subject Teacher assignment already exists",
        duplicate: true,
        assignment_id: existingAssignments[0].id
      });
    }

    const [result] = await db.query(
      `INSERT INTO teacher_assignments
       (
         branch_id,
         teacher_id,
         class_id,
         subject,
         role,
         academic_year,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        effectiveBranchId,
        teacher_database_id,
        class_id,
        finalSubject,
        normalizedRole,
        finalAcademicYear
      ]
    );

    return res.status(201).json({
      message:
        normalizedRole === "Class Teacher"
          ? "Class Teacher assigned successfully"
          : "Subject Teacher assigned successfully",
      duplicate: false,
      assignment_id: result.insertId
    });

  } catch (error) {
    console.error(
      "Assign teacher error:",
      error
    );

    return res.status(500).json({
      message: "Failed to assign teacher",
      error: error.message
    });
  }
};


// Get students for teacher's assigned classes
exports.getTeacherStudents = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const requestedTeacher = await getTeacherById(teacherId);

    if (!requestedTeacher) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    if (req.user && req.user.role === "teacher") {
      const ownTeacher = await getTeacherByUserId(req.user.id);

      if (!ownTeacher || Number(ownTeacher.id) !== Number(teacherId)) {
        return res.status(403).json({
          message: "You can only view students assigned to your own account"
        });
      }
    }

    if (isBranchScopedAdmin(req.user) && Number(requestedTeacher.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only view teacher students in your own branch"
      });
    }

    const [students] = await db.query(
      `SELECT DISTINCT
        students.id,
        students.student_id,
        students.admission_number,
        students.first_name,
        students.surname,
        students.other_name,
        students.sex,
        classes.class_name,
        students.parent_ghana_card_number,
        students.status
      FROM teacher_assignments
      INNER JOIN classes ON teacher_assignments.class_id = classes.id
      INNER JOIN students ON students.class_id = classes.id
      AND students.branch_id = teacher_assignments.branch_id
      WHERE teacher_assignments.teacher_id = ?
      AND teacher_assignments.status = 'active'
      ORDER BY classes.class_name, students.surname, students.first_name`,
      [teacherId]
    );

    res.json({
      message: "Teacher students retrieved successfully",
      students
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve teacher students",
      error: error.message
    });
  }
};

// Get teacher record by user login ID
exports.getTeacherByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user && req.user.role === "teacher" && Number(req.user.id) !== Number(userId)) {
      return res.status(403).json({
        message: "You can only view your own teacher profile"
      });
    }

    const [rows] = await db.query(
      `SELECT 
          t.*,
          b.branch_name
       FROM teachers t
       LEFT JOIN branches b ON t.branch_id = b.id
       WHERE t.user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    if (isBranchScopedAdmin(req.user) && Number(rows[0].branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only view teachers in your own branch"
      });
    }

    res.json({
      message: "Teacher retrieved successfully",
      teacher: rows[0]
    });
  } catch (error) {
    console.error("Get teacher by user ID error:", error);
    res.status(500).json({
      message: "Failed to retrieve teacher",
      error: error.message
    });
  }
};

// Update teacher own profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const requestedTeacher = await getTeacherById(teacherId);

    if (!requestedTeacher) {
      return res.status(404).json({
        message: "Teacher profile not found"
      });
    }

    if (req.user && req.user.role === "teacher") {
      const ownTeacher = await getTeacherByUserId(req.user.id);

      if (!ownTeacher || Number(ownTeacher.id) !== Number(teacherId)) {
        return res.status(403).json({
          message: "You can only update your own profile"
        });
      }
    }

    if (isBranchScopedAdmin(req.user) && Number(requestedTeacher.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only update teacher profiles in your own branch"
      });
    }

    const phone = req.body.phone || null;
    const email = req.body.email || null;
    const address = req.body.address || req.body.residential_address || null;

    let profilePicture = null;

    if (req.file) {
      profilePicture = "/uploads/teachers/" + req.file.filename;
    }

    const fields = [];
    const values = [];

    if (phone !== null) {
      fields.push("phone = ?");
      values.push(phone);
    }

    if (email !== null) {
      fields.push("email = ?");
      values.push(email);
    }

    if (address !== null) {
      fields.push("address = ?");
      values.push(address);
    }

    if (profilePicture !== null) {
      fields.push("profile_picture = ?");
      values.push(profilePicture);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: "No profile fields provided"
      });
    }

    values.push(teacherId);

    const [result] = await db.query(
      `UPDATE teachers SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Teacher profile not found"
      });
    }

    // If teacher changes phone number, update login password to the new phone number
    if (phone !== null && String(phone).trim() !== "") {
      const [teacherUserRows] = await db.query(
        "SELECT user_id FROM teachers WHERE id = ? LIMIT 1",
        [teacherId]
      );

      if (teacherUserRows.length > 0 && teacherUserRows[0].user_id) {
        const hashedPassword = await bcrypt.hash(String(phone).trim(), 10);

        await db.query(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashedPassword, teacherUserRows[0].user_id]
        );
      }
    }

    const [rows] = await db.query(
      `SELECT id, teacher_id, full_name, phone, email, address,
      profile_picture, profile_picture
       FROM teachers
       WHERE id = ?`,
      [teacherId]
    );

    res.json({
      message: "Teacher profile updated successfully",
      teacher: rows[0],
      profile_picture: profilePicture
    });
  } catch (error) {
    console.error("Update teacher profile error:", error);
    res.status(500).json({
      message: "Failed to update teacher profile",
      error: error.message
    });
  }
};

// Update teacher from admin panel
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branch_id,
      teacher_id,
      full_name,
      gender,
      date_of_birth,
      ghana_card_number,
      phone,
      email,
      address,
      date_employed,
      qualification,
      profile_picture,
      status
    } = req.body;

    const normalizedPhone = String(phone || "").trim();
    const hashedPassword = normalizedPhone
      ? await bcrypt.hash(normalizedPhone, 10)
      : null;

    if (!branch_id || !teacher_id || !full_name || !ghana_card_number || !phone) {
      return res.status(400).json({
        message: "Branch, Teacher ID, full name, Ghana Card, and phone are required"
      });
    }

    const [teachers] = await db.query(
      "SELECT id, branch_id, user_id, ghana_card_number FROM teachers WHERE id = ? LIMIT 1",
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const teacher = teachers[0];

    if (
      (req.user.role === "branch_admin" || req.user.role === "teacher_admin") &&
      Number(teacher.branch_id) !== Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message: "You can only edit teachers in your own branch"
      });
    }

    await db.query(
      `UPDATE teachers
       SET branch_id = ?,
           teacher_id = ?,
           full_name = ?,
           gender = ?,
           date_of_birth = ?,
           ghana_card_number = ?,
           phone = ?,
           email = ?,
           address = ?,
           date_employed = ?,
           qualification = ?,
           status = ?
       WHERE id = ?`,
      [
        branch_id,
        teacher_id,
        full_name,
        gender || null,
        date_of_birth || null,
        ghana_card_number,
        phone,
        email || null,
        address || null,
        date_employed || null,
        qualification || null,
        status || "active",
        id
      ]
    );

    if (teacher.user_id) {
      await db.query(
        `UPDATE users
         SET branch_id = ?,
             full_name = ?,
             username = ?,
             phone = ?,
             email = ?,
             status = ?,
             password = COALESCE(?, password)
         WHERE id = ?`,
        [
          branch_id,
          full_name,
          ghana_card_number,
          phone,
          email || null,
          status || "active",
          hashedPassword,
          teacher.user_id
        ]
      );
    } else {
      await db.query(
        `UPDATE users
         SET branch_id = ?,
             full_name = ?,
             username = ?,
             phone = ?,
             email = ?,
             status = ?,
             password = COALESCE(?, password)
         WHERE username = ?`,
        [
          branch_id,
          full_name,
          ghana_card_number,
          phone,
          email || null,
          status || "active",
          hashedPassword,
          teacher.ghana_card_number
        ]
      );
    }

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Teacher Updated",
        "Teachers",
        `Updated teacher ${full_name}.`
      ]
    );

    res.json({
      message: "Teacher updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update teacher",
      error: error.message
    });
  }
};


// ==============================
// Make Teacher Also Admin
// Super Admin only
// ==============================
exports.makeTeacherAdmin = async (req, res) => {
  try {
    const loggedRole = req.user && req.user.role;

    if (loggedRole !== "super_admin") {
      return res.status(403).json({
        message: "Only Super Admin can make a teacher an admin."
      });
    }

    const { id } = req.params;
    const requestedRole = String(req.body && req.body.role ? req.body.role : "teacher_admin").trim();
    const allowedRoles = ["teacher_admin"];

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        message: "Role must be teacher_admin"
      });
    }

    const [teacherRows] = await db.query(
      `SELECT id, user_id, full_name, branch_id
       FROM teachers
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (teacherRows.length === 0) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const teacher = teacherRows[0];

    if (!teacher.user_id) {
      return res.status(400).json({
        message: "This teacher has no login account yet."
      });
    }

    await db.query(
      `UPDATE users
       SET role = ?,
           branch_id = ?,
           status = 'active'
       WHERE id = ?`,
      [requestedRole, teacher.branch_id, teacher.user_id]
    );

    res.json({
      message: `${teacher.full_name} is now assigned as Teacher Admin.`,
      role: requestedRole
    });
  } catch (error) {
    console.error("Make teacher admin error:", error);

    if (
      error &&
      (error.code === "WARN_DATA_TRUNCATED" ||
        error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD")
    ) {
      return res.status(500).json({
        message: "Database role configuration is outdated. Please restart the backend so role compatibility migration can run, then try again.",
        error: error.message
      });
    }

    res.status(500).json({
      message: "Failed to make teacher admin",
      error: error.message
    });
  }
};


// Disable / lock teacher account without deleting record
exports.disableTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const [teacherRows] = await db.query(
      "SELECT id, user_id, full_name, branch_id FROM teachers WHERE id = ? LIMIT 1",
      [id]
    );

    if (teacherRows.length === 0) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const teacher = teacherRows[0];

    if (isBranchScopedAdmin(req.user) && Number(teacher.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only disable teachers in your own branch"
      });
    }

    await db.query(
      "UPDATE teachers SET status = 'disabled' WHERE id = ?",
      [id]
    );

    if (teacher.user_id) {
      await db.query(
        "UPDATE users SET status = 'disabled' WHERE id = ?",
        [teacher.user_id]
      );
    }

    res.json({
      message: `${teacher.full_name || "Teacher"} has been disabled successfully.`
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to disable teacher",
      error: error.message
    });
  }
};


// Get logged-in teacher's active class/subject assignments
exports.getMyAssignments = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Teacher access required"
      });
    }

    const teacher = await getTeacherByUserId(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher record not found"
      });
    }

    const [assignments] = await db.query(
      `SELECT DISTINCT
         ta.class_id,
         c.class_name,
         ta.subject,
         ta.role,
         ta.academic_year
       FROM teacher_assignments ta
       INNER JOIN classes c ON c.id = ta.class_id
       WHERE ta.teacher_id = ?
         AND ta.status = 'active'
       ORDER BY c.class_name, ta.subject`,
      [teacher.id]
    );

    res.json({
      message: "Teacher assignments loaded successfully",
      teacher_id: teacher.id,
      assignments
    });
  } catch (error) {
    console.error("Get my assignments error:", error);

    res.status(500).json({
      message: "Failed to load teacher assignments",
      error: error.message
    });
  }
};


// Admin: Get all teacher assignments
exports.getTeacherAssignments = async (req, res) => {
  try {
    let { branch_id } = req.query;

    if (req.user && (req.user.role === "branch_admin" || req.user.role === "teacher_admin")) {
      branch_id = req.user.branch_id;
    }

    let sql = `
      SELECT
        ta.id,
        ta.branch_id,
        b.branch_name,
        ta.teacher_id,
        t.full_name AS teacher_name,
        t.teacher_id AS teacher_code,
        ta.class_id,
        c.class_name,
        ta.subject,
        ta.role,
        ta.academic_year,
        ta.status
      FROM teacher_assignments ta
      LEFT JOIN teachers t ON t.id = ta.teacher_id
      LEFT JOIN classes c ON c.id = ta.class_id
      LEFT JOIN branches b ON b.id = ta.branch_id
      WHERE ta.status = 'active'
    `;

    const params = [];

    if (branch_id) {
      sql += " AND ta.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY ta.id DESC";

    const [assignments] = await db.query(sql, params);

    res.json({
      message: "Teacher assignments loaded successfully",
      assignments
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load teacher assignments",
      error: error.message
    });
  }
};



// Admin: Safely set the active CLASS TEACHER assignment for one teacher.
// Subject Teacher assignments are intentionally NOT touched.
exports.updateClassTeacherAssignment = async (req, res) => {
  let conn;

  try {
    const {
      teacher_id,
      branch_id,
      class_id,
      academic_year
    } = req.body;

    const teacherId = Number(teacher_id);
    const classId = Number(class_id);

    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      return res.status(400).json({
        message: "Please select a valid teacher"
      });
    }

    if (
      !Number.isInteger(classId) ||
      classId <= 0
    ) {
      return res.status(400).json({
        message: "Please select a valid class"
      });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [teacherRows] = await conn.query(
      `SELECT id, branch_id
       FROM teachers
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [teacherId]
    );

    if (!teacherRows.length) {
      await conn.rollback();

      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const teacher = teacherRows[0];

    if (isBranchScopedAdmin(req.user)) {
      if (!req.user.branch_id) {
        await conn.rollback();

        return res.status(403).json({
          message:
            "No branch is assigned to this administrator"
        });
      }

      if (
        Number(teacher.branch_id) !==
        Number(req.user.branch_id)
      ) {
        await conn.rollback();

        return res.status(403).json({
          message:
            "You can only edit teacher assignments in your own branch"
        });
      }
    }

    const effectiveBranchId =
      isBranchScopedAdmin(req.user)
        ? Number(req.user.branch_id)
        : Number(branch_id || teacher.branch_id);

    if (
      !Number.isInteger(effectiveBranchId) ||
      effectiveBranchId <= 0 ||
      Number(teacher.branch_id) !== effectiveBranchId
    ) {
      await conn.rollback();

      return res.status(400).json({
        message:
          "The selected branch does not match this teacher"
      });
    }

    /*
     * Verify class exists.
     * Existing system uses shared class definitions while
     * branch ownership lives on teacher_assignments.
     */
    const [classRows] = await conn.query(
      `SELECT id, class_name
       FROM classes
       WHERE id = ?
       LIMIT 1`,
      [classId]
    );

    if (!classRows.length) {
      await conn.rollback();

      return res.status(404).json({
        message: "Selected class was not found"
      });
    }

    const finalAcademicYear =
      String(
        academic_year || "2026/2027"
      ).trim();

    /*
     * One active Class Teacher per class / branch / academic year.
     * Do not overwrite another teacher's assignment automatically.
     */
    const [classOwnerRows] = await conn.query(
      `SELECT
         ta.id,
         ta.teacher_id,
         t.full_name AS teacher_name
       FROM teacher_assignments ta
       LEFT JOIN teachers t
         ON t.id = ta.teacher_id
       WHERE ta.branch_id = ?
         AND ta.class_id = ?
         AND ta.academic_year = ?
         AND ta.status = 'active'
         AND UPPER(TRIM(ta.role)) = 'CLASS TEACHER'
         AND ta.teacher_id <> ?
       LIMIT 1
       FOR UPDATE`,
      [
        effectiveBranchId,
        classId,
        finalAcademicYear,
        teacherId
      ]
    );

    if (classOwnerRows.length) {
      await conn.rollback();

      const ownerName =
        classOwnerRows[0].teacher_name ||
        "another teacher";

      return res.status(409).json({
        message:
          `This class already has ${ownerName} assigned as Class Teacher for ${finalAcademicYear}.`
      });
    }

    /*
     * Lock only this teacher's active Class Teacher rows.
     * Subject Teacher rows are never selected here.
     */
    const [existingRows] = await conn.query(
      `SELECT id, class_id
       FROM teacher_assignments
       WHERE teacher_id = ?
         AND branch_id = ?
         AND academic_year = ?
         AND status = 'active'
         AND UPPER(TRIM(role)) = 'CLASS TEACHER'
       FOR UPDATE`,
      [
        teacherId,
        effectiveBranchId,
        finalAcademicYear
      ]
    );

    /*
     * If there is already a Class Teacher record, reuse the
     * first row and deactivate any accidental extra rows.
     */
    if (existingRows.length) {
      const keepId =
        existingRows[0].id;

      await conn.query(
        `UPDATE teacher_assignments
         SET class_id = ?,
             subject = 'CLASS TEACHER',
             role = 'Class Teacher',
             academic_year = ?,
             status = 'active'
         WHERE id = ?`,
        [
          classId,
          finalAcademicYear,
          keepId
        ]
      );

      const extraIds =
        existingRows
          .slice(1)
          .map(row => row.id);

      if (extraIds.length) {
        const placeholders =
          extraIds.map(() => "?").join(",");

        await conn.query(
          `UPDATE teacher_assignments
           SET status = 'inactive'
           WHERE id IN (${placeholders})`,
          extraIds
        );
      }

      await conn.commit();

      return res.json({
        message:
          "Class Teacher assignment updated successfully",
        assignment_id: keepId,
        updated: true
      });
    }

    /*
     * No existing Class Teacher row:
     * create one without affecting subject assignments.
     */
    const [result] = await conn.query(
      `INSERT INTO teacher_assignments
       (
         branch_id,
         teacher_id,
         class_id,
         subject,
         role,
         academic_year,
         status
       )
       VALUES (?, ?, ?, 'CLASS TEACHER', 'Class Teacher', ?, 'active')`,
      [
        effectiveBranchId,
        teacherId,
        classId,
        finalAcademicYear
      ]
    );

    await conn.commit();

    return res.status(201).json({
      message:
        "Class Teacher assigned successfully",
      assignment_id: result.insertId,
      updated: false
    });

  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }

    console.error(
      "Class Teacher assignment update error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update Class Teacher assignment",
      error: error.message
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
};


// Admin: Safely replace active SUBJECT TEACHER assignments for one teacher.
// Class Teacher assignments are intentionally NOT touched by this function.
exports.updateTeacherAssignmentsFull = async (req, res) => {
  let conn;

  try {
    const {
      teacher_id,
      branch_id,
      class_ids,
      subjects,
      academic_year
    } = req.body;

    const teacherId = Number(teacher_id);

    const cleanClassIds = Array.isArray(class_ids)
      ? [...new Set(
          class_ids
            .map(id => Number(id))
            .filter(id =>
              Number.isInteger(id) && id > 0
            )
        )]
      : [];

    const cleanSubjects = Array.isArray(subjects)
      ? [...new Set(
          subjects
            .map(subject =>
              String(subject || "").trim()
            )
            .filter(Boolean)
        )]
      : [];

    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      return res.status(400).json({
        message: "Please select a valid teacher"
      });
    }

    if (!cleanClassIds.length) {
      return res.status(400).json({
        message: "Please select at least one class"
      });
    }

    if (!cleanSubjects.length) {
      return res.status(400).json({
        message: "Please select at least one subject"
      });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    /*
     * Lock and verify teacher.
     */
    const [teacherRows] = await conn.query(
      `SELECT id, branch_id
       FROM teachers
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [teacherId]
    );

    if (!teacherRows.length) {
      await conn.rollback();

      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const teacher = teacherRows[0];

    /*
     * Branch security.
     */
    if (isBranchScopedAdmin(req.user)) {
      if (!req.user.branch_id) {
        await conn.rollback();

        return res.status(403).json({
          message:
            "No branch is assigned to this administrator"
        });
      }

      if (
        Number(teacher.branch_id) !==
        Number(req.user.branch_id)
      ) {
        await conn.rollback();

        return res.status(403).json({
          message:
            "You can only edit teacher assignments in your own branch"
        });
      }
    }

    const effectiveBranchId =
      isBranchScopedAdmin(req.user)
        ? Number(req.user.branch_id)
        : Number(branch_id || teacher.branch_id);

    if (
      !Number.isInteger(effectiveBranchId) ||
      effectiveBranchId <= 0 ||
      Number(teacher.branch_id) !==
        effectiveBranchId
    ) {
      await conn.rollback();

      return res.status(400).json({
        message:
          "The selected branch does not match this teacher"
      });
    }

    /*
     * Verify selected class IDs exist.
     */
    const classPlaceholders =
      cleanClassIds.map(() => "?").join(",");

    const [classRows] = await conn.query(
      `SELECT id
       FROM classes
       WHERE id IN (${classPlaceholders})`,
      cleanClassIds
    );

    if (
      classRows.length !==
      cleanClassIds.length
    ) {
      await conn.rollback();

      return res.status(400).json({
        message:
          "One or more selected classes were not found"
      });
    }

    const finalAcademicYear =
      String(
        academic_year || "2026/2027"
      ).trim();

    /*
     * Build desired Subject Teacher Class x Subject rows.
     */
    const desired = [];

    for (const classId of cleanClassIds) {
      for (const subject of cleanSubjects) {
        desired.push({
          class_id: classId,
          subject
        });
      }
    }

    /*
     * CRITICAL:
     * Only lock SUBJECT TEACHER assignments.
     *
     * Class Teacher assignments are separate and must survive
     * any changes made through the Subject Teaching editor.
     */
    const [existingRows] = await conn.query(
      `SELECT
         id,
         class_id,
         subject,
         role,
         academic_year
       FROM teacher_assignments
       WHERE teacher_id = ?
         AND branch_id = ?
         AND academic_year = ?
         AND status = 'active'
         AND UPPER(TRIM(role)) = 'SUBJECT TEACHER'
       FOR UPDATE`,
      [
        teacherId,
        effectiveBranchId,
        finalAcademicYear
      ]
    );

    const makeKey = (
      classId,
      subject
    ) =>
      `${Number(classId)}|${String(
        subject || ""
      ).trim().toUpperCase()}`;

    const existingByKey = new Map();

    for (const row of existingRows) {
      existingByKey.set(
        makeKey(
          row.class_id,
          row.subject
        ),
        row
      );
    }

    const desiredKeys = new Set();

    let kept = 0;
    let created = 0;
    let removed = 0;

    /*
     * Keep/create Subject Teacher rows only.
     */
    for (const item of desired) {
      const key =
        makeKey(
          item.class_id,
          item.subject
        );

      desiredKeys.add(key);

      const existing =
        existingByKey.get(key);

      if (existing) {
        await conn.query(
          `UPDATE teacher_assignments
           SET role = 'Subject Teacher',
               academic_year = ?,
               status = 'active'
           WHERE id = ?`,
          [
            finalAcademicYear,
            existing.id
          ]
        );

        kept++;
      } else {
        await conn.query(
          `INSERT INTO teacher_assignments
           (
             branch_id,
             teacher_id,
             class_id,
             subject,
             role,
             academic_year,
             status
           )
           VALUES (?, ?, ?, ?, 'Subject Teacher', ?, 'active')`,
          [
            effectiveBranchId,
            teacherId,
            item.class_id,
            item.subject,
            finalAcademicYear
          ]
        );

        created++;
      }
    }

    /*
     * Deactivate only Subject Teacher rows that were removed
     * from the new Subject Teaching selection.
     *
     * Class Teacher rows cannot enter removeIds because they
     * were deliberately excluded from existingRows.
     */
    const removeIds =
      existingRows
        .filter(row =>
          !desiredKeys.has(
            makeKey(
              row.class_id,
              row.subject
            )
          )
        )
        .map(row => row.id);

    if (removeIds.length) {
      const removePlaceholders =
        removeIds.map(() => "?").join(",");

      await conn.query(
        `UPDATE teacher_assignments
         SET status = 'inactive'
         WHERE id IN (${removePlaceholders})`,
        removeIds
      );

      removed =
        removeIds.length;
    }

    await conn.commit();

    return res.json({
      message:
        "Subject teaching assignments updated successfully",
      kept,
      created,
      removed,
      total_active:
        desired.length
    });

  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }

    console.error(
      "Subject teacher assignment update error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update subject teaching assignments",
      error: error.message
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
};


// Admin: Safely update a grouped teacher assignment
exports.updateTeacherAssignmentGroup = async (req, res) => {
  let conn;

  try {
    const {
      assignment_ids,
      class_id,
      subjects,
      role,
      academic_year
    } = req.body;

    const ids = Array.isArray(assignment_ids)
      ? [...new Set(
          assignment_ids
            .map(id => Number(id))
            .filter(id => Number.isInteger(id) && id > 0)
        )]
      : [];

    const cleanSubjects = Array.isArray(subjects)
      ? [...new Set(
          subjects
            .map(subject => String(subject || "").trim())
            .filter(Boolean)
        )]
      : [];

    const newClassId = Number(class_id);

    if (!ids.length) {
      return res.status(400).json({
        message: "No assignment records were supplied"
      });
    }

    if (!Number.isInteger(newClassId) || newClassId <= 0) {
      return res.status(400).json({
        message: "Please select a valid class"
      });
    }

    if (!cleanSubjects.length) {
      return res.status(400).json({
        message: "Please select at least one subject"
      });
    }

    const allowedRoles = [
      "Admin",
      "Class Teacher",
      "Subject Teacher"
    ];

    const normalizedRole = role || "Subject Teacher";

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid assignment role"
      });
    }

    if (
      isBranchScopedAdmin(req.user) &&
      normalizedRole === "Admin"
    ) {
      return res.status(403).json({
        message:
          "Branch admin can only assign Class Teacher or Subject Teacher roles"
      });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const placeholders = ids.map(() => "?").join(",");

    const [existingRows] = await conn.query(
      `SELECT
         id,
         branch_id,
         teacher_id,
         class_id,
         subject,
         role,
         academic_year
       FROM teacher_assignments
       WHERE id IN (${placeholders})
         AND status = 'active'
       FOR UPDATE`,
      ids
    );

    if (existingRows.length !== ids.length) {
      await conn.rollback();

      return res.status(404).json({
        message:
          "One or more teacher assignment records were not found"
      });
    }

    const first = existingRows[0];

    const sameTeacher = existingRows.every(
      row => Number(row.teacher_id) === Number(first.teacher_id)
    );

    const sameBranch = existingRows.every(
      row => Number(row.branch_id) === Number(first.branch_id)
    );

    if (!sameTeacher || !sameBranch) {
      await conn.rollback();

      return res.status(400).json({
        message:
          "The selected records do not belong to one teacher assignment group"
      });
    }

    if (isBranchScopedAdmin(req.user)) {
      if (!req.user.branch_id) {
        await conn.rollback();

        return res.status(403).json({
          message: "No branch is assigned to this administrator"
        });
      }

      if (Number(first.branch_id) !== Number(req.user.branch_id)) {
        await conn.rollback();

        return res.status(403).json({
          message:
            "You can only edit assignments in your own branch"
        });
      }
    }

    /*
     * Make sure the selected class belongs to the same branch.
     * This prevents a modified browser request from moving the
     * assignment into another branch.
     */
    const [classRows] = await conn.query(
      `SELECT id, branch_id, class_name
       FROM classes
       WHERE id = ?
       LIMIT 1`,
      [newClassId]
    );

    if (!classRows.length) {
      await conn.rollback();

      return res.status(404).json({
        message: "Selected class was not found"
      });
    }

    /*
     * Classes with branch_id = NULL are global/shared classes.
     * If a class is explicitly branch-owned, it must belong to
     * the same branch as the teacher assignment.
     */
    if (
      classRows[0].branch_id != null &&
      Number(classRows[0].branch_id) !==
        Number(first.branch_id)
    ) {
      await conn.rollback();

      return res.status(403).json({
        message:
          "The selected class does not belong to this teacher's branch"
      });
    }

    const finalAcademicYear =
      String(academic_year || first.academic_year || "2025/2026").trim();

    /*
     * Check for active assignments outside the group being edited.
     * We do this before changing anything.
     */
    for (const subject of cleanSubjects) {
      const [duplicates] = await conn.query(
        `SELECT id
         FROM teacher_assignments
         WHERE teacher_id = ?
           AND branch_id = ?
           AND class_id = ?
           AND UPPER(TRIM(subject)) = UPPER(TRIM(?))
           AND academic_year = ?
           AND status = 'active'
           AND id NOT IN (${placeholders})
         LIMIT 1`,
        [
          first.teacher_id,
          first.branch_id,
          newClassId,
          subject,
          finalAcademicYear,
          ...ids
        ]
      );

      if (duplicates.length) {
        await conn.rollback();

        return res.status(409).json({
          message:
            `An active assignment already exists for ${subject}`
        });
      }
    }

    /*
     * Keep as many existing rows as possible.
     * Extra old rows become inactive.
     * Extra new subjects receive new rows.
     */
    for (let index = 0; index < cleanSubjects.length; index++) {
      const subject = cleanSubjects[index];

      if (index < existingRows.length) {
        await conn.query(
          `UPDATE teacher_assignments
           SET class_id = ?,
               subject = ?,
               role = ?,
               academic_year = ?,
               status = 'active'
           WHERE id = ?`,
          [
            newClassId,
            subject,
            normalizedRole,
            finalAcademicYear,
            existingRows[index].id
          ]
        );
      } else {
        await conn.query(
          `INSERT INTO teacher_assignments
           (
             branch_id,
             teacher_id,
             class_id,
             subject,
             role,
             academic_year,
             status
           )
           VALUES (?, ?, ?, ?, ?, ?, 'active')`,
          [
            first.branch_id,
            first.teacher_id,
            newClassId,
            subject,
            normalizedRole,
            finalAcademicYear
          ]
        );
      }
    }

    if (existingRows.length > cleanSubjects.length) {
      const extraIds = existingRows
        .slice(cleanSubjects.length)
        .map(row => row.id);

      const extraPlaceholders =
        extraIds.map(() => "?").join(",");

      await conn.query(
        `UPDATE teacher_assignments
         SET status = 'inactive'
         WHERE id IN (${extraPlaceholders})`,
        extraIds
      );
    }

    await conn.commit();

    res.json({
      message: "Teacher assignment updated successfully"
    });

  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }

    console.error(
      "Grouped teacher assignment update error:",
      error
    );

    res.status(500).json({
      message: "Failed to update teacher assignment",
      error: error.message
    });

  } finally {
    if (conn) {
      conn.release();
    }
  }
};


// Admin: Update teacher assignment
exports.updateTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, role, academic_year } = req.body;

    if (!subject) {
      return res.status(400).json({
        message: "Subject is required"
      });
    }

    if (req.user && (req.user.role === "branch_admin" || req.user.role === "teacher_admin")) {
      const [rows] = await db.query(
        "SELECT branch_id FROM teacher_assignments WHERE id = ? LIMIT 1",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (Number(rows[0].branch_id) !== Number(req.user.branch_id)) {
        return res.status(403).json({
          message: "You can only edit assignments in your own branch"
        });
      }
    }

    const [result] = await db.query(
      `UPDATE teacher_assignments
       SET subject = ?, role = ?, academic_year = ?
       WHERE id = ? AND status = 'active'`,
      [
        subject,
        role || "Subject Teacher",
        academic_year || "2025/2026",
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Assignment not found"
      });
    }

    res.json({
      message: "Teacher assignment updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update teacher assignment",
      error: error.message
    });
  }
};


// Admin: Remove teacher assignment
exports.deleteTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && (req.user.role === "branch_admin" || req.user.role === "teacher_admin")) {
      const [rows] = await db.query(
        "SELECT branch_id FROM teacher_assignments WHERE id = ? LIMIT 1",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (Number(rows[0].branch_id) !== Number(req.user.branch_id)) {
        return res.status(403).json({
          message: "You can only remove assignments in your own branch"
        });
      }
    }

    const [result] = await db.query(
      "UPDATE teacher_assignments SET status = 'inactive' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Assignment not found"
      });
    }

    res.json({
      message: "Teacher assignment removed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove teacher assignment",
      error: error.message
    });
  }
};
