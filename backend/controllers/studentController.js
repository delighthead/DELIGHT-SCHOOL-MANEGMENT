const db = require("../config/database");
const { sendStudentRegistrationSms } = require("../utils/mnotifySms");

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
    let { branch_id } = req.query;

    // Branch-scoped administrators must always use
    // the branch attached to their authenticated account.
    if (
      req.user &&
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this administrator"
        });
      }

      branch_id = req.user.branch_id;
    }

    let sql = `SELECT
        students.id,
        students.branch_id,
        branches.branch_name,
        students.student_id,
        students.admission_number,
        students.full_name,
        students.sex,
        students.date_of_birth,
        students.date_of_admission,
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


// Get next automatic admission number for a branch
exports.getNextAdmissionNumber = async (req, res) => {
  try {
    let branchId = req.query.branch_id;

    // Branch-scoped administrators can only generate numbers
    // for the branch assigned to their account.
    if (
      req.user &&
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this administrator"
        });
      }

      branchId = req.user.branch_id;
    }

    if (!branchId) {
      return res.status(400).json({
        message: "Branch is required"
      });
    }

    const [branches] = await db.query(
      `SELECT id, branch_name, location
       FROM branches
       WHERE id = ?
       LIMIT 1`,
      [branchId]
    );

    if (branches.length === 0) {
      return res.status(404).json({
        message: "Branch not found"
      });
    }

    const branch = branches[0];
    const branchText =
      `${branch.branch_name || ""} ${branch.location || ""}`.toUpperCase();

    let prefix = null;

    if (branchText.includes("KOTOBABI")) {
      prefix = "AMDK";
    } else if (branchText.includes("OFANKOR")) {
      prefix = "AMDO";
    } else {
      return res.status(400).json({
        message: "Automatic admission numbering is not configured for this branch"
      });
    }

    // Only numbers using the NEW branch-specific format are considered.
    // Existing old AMD001-style numbers are deliberately left untouched.
    const [rows] = await db.query(
      `SELECT admission_number
       FROM students
       WHERE branch_id = ?
         AND UPPER(admission_number) LIKE ?
       ORDER BY id`,
      [branchId, `${prefix}%`]
    );

    let highestNumber = 0;
    const usedNumbers = new Set();

    for (const row of rows) {
      const admissionNumber = String(row.admission_number || "")
        .trim()
        .toUpperCase();

      const match = admissionNumber.match(
        new RegExp(`^${prefix}(\\d+)$`)
      );

      if (!match) continue;

      const number = Number(match[1]);

      if (Number.isInteger(number) && number > 0) {
        usedNumbers.add(number);

        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    }

    // Always continue after the highest number ever used.
    // Deleted or manually changed lower numbers are not automatically recycled.
    let nextNumber = highestNumber + 1;

    // Extra safety in case the calculated number already exists.
    while (usedNumbers.has(nextNumber)) {
      nextNumber += 1;
    }

    const admissionNumber =
      prefix + String(nextNumber).padStart(3, "0");

    res.json({
      message: "Next admission number generated successfully",
      branch_id: Number(branchId),
      branch_name: branch.branch_name,
      prefix,
      sequence: nextNumber,
      admission_number: admissionNumber
    });
  } catch (error) {
    console.error("Generate admission number error:", error);

    res.status(500).json({
      message: "Failed to generate admission number",
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
      date_of_admission,
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

    if (!branch_id || !finalFullName) {
      return res.status(400).json({
        message: "Branch and full name are required"
      });
    }

    let cleanAdmissionNumber = null;
    let connection = null;
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

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Lock this branch while the next number is calculated and inserted.
      // Registrations in the other branch can still proceed independently.
      const [branchRows] = await connection.query(
        `SELECT id, branch_name, location
         FROM branches
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [branch_id]
      );

      if (branchRows.length === 0) {
        await connection.rollback();
        connection.release();
        connection = null;

        return res.status(404).json({
          message: "Branch not found"
        });
      }

      const branch = branchRows[0];
      const branchText =
        `${branch.branch_name || ""} ${branch.location || ""}`.toUpperCase();

      let prefix = null;

      if (branchText.includes("KOTOBABI")) {
        prefix = "AMDK";
      } else if (branchText.includes("OFANKOR")) {
        prefix = "AMDO";
      } else {
        await connection.rollback();
        connection.release();
        connection = null;

        return res.status(400).json({
          message: "Automatic admission numbering is not configured for this branch"
        });
      }

      const [numberRows] = await connection.query(
        `SELECT admission_number
         FROM students
         WHERE branch_id = ?
           AND UPPER(admission_number) LIKE ?`,
        [branch_id, `${prefix}%`]
      );

      let highestNumber = 0;

      for (const row of numberRows) {
        const currentAdmissionNumber = String(row.admission_number || "")
          .trim()
          .toUpperCase();

        const match = currentAdmissionNumber.match(
          new RegExp(`^${prefix}(\\d+)$`)
        );

        if (!match) continue;

        const currentNumber = Number(match[1]);

        if (
          Number.isInteger(currentNumber) &&
          currentNumber > highestNumber
        ) {
          highestNumber = currentNumber;
        }
      }

      cleanAdmissionNumber =
        prefix + String(highestNumber + 1).padStart(3, "0");

    const [result] = await connection.query(
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
        date_of_admission,
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        cleanAdmissionNumber,
        cleanAdmissionNumber,
        finalFullName,
        (finalFullName || "").trim().split(/\s+/)[0] || finalFullName,
        (finalFullName || "").trim().split(/\s+/).slice(1).join(" ") || "-",
        sex || "Male",
        date_of_birth || null,
        date_of_admission || null,
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

      await connection.commit();
      connection.release();
      connection = null;

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
        `Registered student ${finalFullName} with admission number ${cleanAdmissionNumber}.`
      ]
    );

    let smsStatus = "not_sent";

    try {
      const smsResult = await sendStudentRegistrationSms({
        studentName: finalFullName,
        admissionNumber: cleanAdmissionNumber,
        motherPhone: mother_phone,
        fatherPhone: father_phone
      });

      smsStatus = smsResult && smsResult.skipped
        ? "skipped"
        : "sent";
    } catch (smsError) {
      console.error(
        "Student registration SMS failed:",
        smsError.message
      );
      smsStatus = "failed";
    }

    res.status(201).json({
      message: "Student added successfully",
      student_database_id: result.insertId,
      sms_status: smsStatus
    });
    } catch (transactionError) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Student registration rollback failed:", rollbackError);
        }

        connection.release();
        connection = null;
      }

      throw transactionError;
    }
  } catch (error) {
    console.error("Create student error:", error);

    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That admission number is already in use. Please try the registration again."
      });
    }

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
      date_of_admission,
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

    // Check branch permission before looking up any other student's
    // admission number.
    if (
      req.user &&
      (req.user.role === "branch_admin" || req.user.role === "teacher_admin") &&
      Number(student.branch_id) !== Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message: "You can only edit students in your own branch"
      });
    }

    const cleanAdmissionNumber = String(admission_number || "")
      .trim()
      .toUpperCase();

    if (!cleanAdmissionNumber) {
      return res.status(400).json({
        message: "Admission number is required"
      });
    }

    const [duplicateAdmission] = await db.query(
      `SELECT id, full_name
       FROM students
       WHERE UPPER(admission_number) = ?
         AND id <> ?
       LIMIT 1`,
      [cleanAdmissionNumber, id]
    );

    if (duplicateAdmission.length > 0) {
      return res.status(409).json({
        message: `Admission number ${cleanAdmissionNumber} is already assigned to another student`
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
          date_of_admission = ?,
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
      student_id || cleanAdmissionNumber,
      cleanAdmissionNumber,
      finalFullName,
      firstName,
      surname,
      sex || "Male",
      date_of_birth || null,
      date_of_admission || null,
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
        `Updated student ${finalFullName} with admission number ${cleanAdmissionNumber}.`
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
