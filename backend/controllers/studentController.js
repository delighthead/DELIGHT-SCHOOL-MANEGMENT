const db = require("../config/database");

async function upsertParentAndLinkStudent({
  branchId,
  studentDbId,
  fullName,
  ghanaCard,
  phone,
  relationship
}) {
  if (!ghanaCard) return null;

  const cleanCard = String(ghanaCard).trim();
  if (!cleanCard) return null;

  const cleanFullName = String(fullName || "").trim() || `Parent ${cleanCard}`;

  const bcrypt = require("bcryptjs");
  const defaultPassword = (phone && String(phone).trim()) || cleanCard;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  let userId = null;

  const [existingUsers] = await db.query(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [cleanCard]
  );

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;

    await db.query(
      `UPDATE users
       SET branch_id = ?,
           full_name = ?,
           phone = ?,
           password = ?,
           role = 'parent',
           status = 'active'
       WHERE id = ?`,
      [branchId, cleanFullName, phone || null, hashedPassword, userId]
    );
  } else {
    const [userResult] = await db.query(
      `INSERT INTO users
      (branch_id, full_name, username, password, role, phone, status)
      VALUES (?, ?, ?, ?, 'parent', ?, 'active')`,
      [branchId, cleanFullName, cleanCard, hashedPassword, phone || null]
    );

    userId = userResult.insertId;
  }

  let parentId = null;

  const [existingParents] = await db.query(
    "SELECT id FROM parents WHERE ghana_card_number = ? LIMIT 1",
    [cleanCard]
  );

  if (existingParents.length > 0) {
    parentId = existingParents[0].id;

    await db.query(
      `UPDATE parents
       SET branch_id = ?,
           user_id = ?,
           full_name = ?,
           phone = ?,
           status = 'active'
       WHERE id = ?`,
      [branchId, userId, cleanFullName, phone || null, parentId]
    );
  } else {
    const [parentResult] = await db.query(
      `INSERT INTO parents
      (branch_id, user_id, ghana_card_number, full_name, phone, status)
      VALUES (?, ?, ?, ?, ?, 'active')`,
      [branchId, userId, cleanCard, cleanFullName, phone || null]
    );

    parentId = parentResult.insertId;
  }

  await db.query(
    `INSERT IGNORE INTO parent_student_links
    (parent_id, student_id, relationship)
    VALUES (?, ?, ?)`,
    [parentId, studentDbId, relationship || "guardian"]
  );

  return parentId;
}

async function syncStudentParentLinks(studentDbId, parentIds) {
  const ids = (parentIds || []).filter(id => Number.isInteger(Number(id))).map(Number);

  if (ids.length === 0) {
    await db.query("DELETE FROM parent_student_links WHERE student_id = ?", [studentDbId]);
    return;
  }

  const placeholders = ids.map(() => "?").join(",");
  await db.query(
    `DELETE FROM parent_student_links
     WHERE student_id = ?
       AND parent_id NOT IN (${placeholders})`,
    [studentDbId, ...ids]
  );
}


// Get all students
exports.getStudents = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `SELECT
        students.id,
        students.branch_id,
        branches.branch_name,
        students.student_id,
        students.admission_number,
        students.full_name,
        students.sex,
        students.date_of_birth,
        students.place_of_birth,
        students.nationality,
        students.language_spoken,
        students.class_id,
        classes.class_name,
        students.mother_name,
        students.mother_ghana_card,
        students.mother_phone,
        students.father_name,
        students.father_ghana_card,
        students.father_phone,
        students.status,
        students.profile_picture,
        students.created_at
      FROM students
      LEFT JOIN branches ON students.branch_id = branches.id
      LEFT JOIN classes ON students.class_id = classes.id`;

    const params = [];

    if (branch_id) {
      sql += " WHERE students.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY students.id DESC";

    const [students] = await db.query(sql, params);

    res.json({
      message: "Students retrieved successfully",
      students
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve students",
      error: error.message
    });
  }
};

// Add student
exports.createStudent = async (req, res) => {
  try {
    const profilePicture = req.file ? `/uploads/students/${req.file.filename}` : null;

    const {
      branch_id,
      student_id,
      admission_number,
      full_name,
      fullname,
      sex,
      date_of_birth,
      place_of_birth,
      nationality,
      language_spoken,
      class_name,
      mother_name,
      mother_ghana_card,
      mother_phone,
      father_name,
      father_ghana_card,
      father_phone,
      status
    } = req.body;

    const finalFullName = full_name || fullname;
    const primaryParentCard = (String(mother_ghana_card || "").trim() || String(father_ghana_card || "").trim()) || null;
    const primaryParentPhone = (String(mother_phone || "").trim() || String(father_phone || "").trim()) || null;

    if (!branch_id || !admission_number || !finalFullName) {
      return res.status(400).json({
        message: "Branch, admission number, and full name are required"
      });
    }

    let classId = null;

    if (class_name) {
      const [existingClass] = await db.query(
        "SELECT id FROM classes WHERE class_name = ? LIMIT 1",
        [class_name]
      );

      if (existingClass.length > 0) {
        classId = existingClass[0].id;
      } else {
        const [classResult] = await db.query(
          `INSERT INTO classes
          (branch_id, class_name, academic_year, status)
          VALUES (?, ?, ?, ?)`,
          [branch_id, class_name, "2025/2026", "active"]
        );

        classId = classResult.insertId;
      }
    }

    const [result] = await db.query(
      `INSERT INTO students
      (
        branch_id,
        student_id,
        admission_number,
        full_name,
        first_name,
        surname,
        sex,
        date_of_birth,
        place_of_birth,
        nationality,
        language_spoken,
        class_id,
        parent_ghana_card_number,
        parent_phone,
        mother_name,
        mother_ghana_card,
        mother_phone,
        father_name,
        father_ghana_card,
        father_phone,
        status,
        profile_picture
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        student_id || admission_number,
        admission_number,
        finalFullName,
        (finalFullName || "").trim().split(/\s+/)[0] || finalFullName,
        (finalFullName || "").trim().split(/\s+/).slice(1).join(" ") || "-",
        sex || "Male",
        date_of_birth || null,
        place_of_birth || null,
        nationality || "Ghanaian",
        language_spoken || null,
        classId,
        primaryParentCard,
        primaryParentPhone,
        mother_name || null,
        mother_ghana_card || null,
        mother_phone || null,
        father_name || null,
        father_ghana_card || null,
        father_phone || null,
        status || "active",
        profilePicture
      ]
    );

    const motherParentId = await upsertParentAndLinkStudent({
      branchId: branch_id,
      studentDbId: result.insertId,
      fullName: mother_name,
      ghanaCard: mother_ghana_card,
      phone: mother_phone,
      relationship: "mother"
    });

    const fatherParentId = await upsertParentAndLinkStudent({
      branchId: branch_id,
      studentDbId: result.insertId,
      fullName: father_name,
      ghanaCard: father_ghana_card,
      phone: father_phone,
      relationship: "father"
    });

    await syncStudentParentLinks(result.insertId, [motherParentId, fatherParentId]);

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Student Added",
        "Students",
        `Registered student ${finalFullName} with admission number ${admission_number}.`
      ]
    );

    res.status(201).json({
      message: "Student added successfully",
      student_database_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add student",
      error: error.message
    });
  }
};

module.exports = exports;

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const profilePicture = req.file ? `/uploads/students/${req.file.filename}` : null;

    const {
      branch_id,
      student_id,
      admission_number,
      full_name,
      fullname,
      sex,
      date_of_birth,
      place_of_birth,
      nationality,
      language_spoken,
      class_name,
      mother_name,
      mother_ghana_card,
      mother_phone,
      father_name,
      father_ghana_card,
      father_phone,
      status
    } = req.body;

    const finalFullName = (full_name || fullname || "").trim();
    const primaryParentCard = (String(mother_ghana_card || "").trim() || String(father_ghana_card || "").trim()) || null;
    const primaryParentPhone = (String(mother_phone || "").trim() || String(father_phone || "").trim()) || null;

    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!branch_id || !admission_number || !finalFullName) {
      return res.status(400).json({
        message: "Branch, admission number, and full name are required"
      });
    }

    const [students] = await db.query(
      "SELECT id, branch_id, profile_picture FROM students WHERE id = ? LIMIT 1",
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = students[0];

    if (req.user && req.user.role === "branch_admin" && Number(student.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only edit students in your own branch"
      });
    }

    const nameParts = finalFullName.split(/\s+/);
    const firstName = nameParts[0] || finalFullName;
    const surname = nameParts.slice(1).join(" ") || "-";

    let classId = null;

    if (class_name) {
      const [existingClass] = await db.query(
        "SELECT id FROM classes WHERE class_name = ? LIMIT 1",
        [class_name]
      );

      if (existingClass.length > 0) {
        classId = existingClass[0].id;
      } else {
        const [classResult] = await db.query(
          `INSERT INTO classes
          (branch_id, class_name, academic_year, status)
          VALUES (?, ?, ?, ?)`,
          [branch_id, class_name, "2025/2026", "active"]
        );

        classId = classResult.insertId;
      }
    }

    let sql = `UPDATE students
      SET branch_id = ?,
          student_id = ?,
          admission_number = ?,
          full_name = ?,
          first_name = ?,
          surname = ?,
          sex = ?,
          date_of_birth = ?,
          place_of_birth = ?,
          nationality = ?,
          language_spoken = ?,
          class_id = ?,
          parent_ghana_card_number = ?,
          parent_phone = ?,
          mother_name = ?,
          mother_ghana_card = ?,
          mother_phone = ?,
          father_name = ?,
          father_ghana_card = ?,
          father_phone = ?,
          status = ?`;

    const params = [
      branch_id,
      student_id || admission_number,
      admission_number,
      finalFullName,
      firstName,
      surname,
      sex || "Male",
      date_of_birth || null,
      place_of_birth || null,
      nationality || "Ghanaian",
      language_spoken || null,
      classId,
      primaryParentCard,
      primaryParentPhone,
      mother_name || null,
      mother_ghana_card || null,
      mother_phone || null,
      father_name || null,
      father_ghana_card || null,
      father_phone || null,
      status || "active"
    ];

    if (profilePicture) {
      sql += ", profile_picture = ?";
      params.push(profilePicture);
    }

    sql += " WHERE id = ?";
    params.push(id);

    await db.query(sql, params);

    const motherParentId = await upsertParentAndLinkStudent({
      branchId: branch_id,
      studentDbId: id,
      fullName: mother_name,
      ghanaCard: mother_ghana_card,
      phone: mother_phone,
      relationship: "mother"
    });

    const fatherParentId = await upsertParentAndLinkStudent({
      branchId: branch_id,
      studentDbId: id,
      fullName: father_name,
      ghanaCard: father_ghana_card,
      phone: father_phone,
      relationship: "father"
    });

    await syncStudentParentLinks(id, [motherParentId, fatherParentId]);

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Student Updated",
        "Students",
        `Updated student ${finalFullName} with admission number ${admission_number}.`
      ]
    );

    res.json({
      message: "Student updated successfully"
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      message: "Failed to update student",
      error: error.message
    });
  }
};
