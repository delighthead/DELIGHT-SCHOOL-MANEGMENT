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

// Download student Excel import template
exports.downloadStudentExcelTemplate = async (req, res) => {
  try {
    const XLSX = require("xlsx");

    const headers = [
      "Admission Number",
      "Branch / Location",
      "Full Name",
      "Sex",
      "Date of Birth",
      "Date of Admission",
      "Place of Birth",
      "Nationality",
      "Language Spoken",
      "Class Admitted",
      "Mother's Name",
      "Mother's Ghana Card Number",
      "Mother's Phone Number",
      "Father's Name",
      "Father's Ghana Card Number",
      "Father's Phone Number"
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 30 },
      { wch: 28 },
      { wch: 24 },
      { wch: 30 },
      { wch: 28 },
      { wch: 24 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Delight_Student_Import_Template.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    console.error("Download student Excel template error:", error);

    return res.status(500).json({
      message: "Failed to generate student Excel template"
    });
  }
};

// Preview and validate student Excel import.
// IMPORTANT: This endpoint does not create or modify students.
exports.previewStudentExcel = async (req, res) => {
  try {
    const XLSX = require("xlsx");

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "Please select an Excel file."
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true
    });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({
        message: "The Excel workbook does not contain a worksheet."
      });
    }

    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false
    });

    const requiredHeaders = [
      "Admission Number",
      "Branch / Location",
      "Full Name",
      "Sex",
      "Date of Birth",
      "Date of Admission",
      "Place of Birth",
      "Nationality",
      "Language Spoken",
      "Class Admitted",
      "Mother's Name",
      "Mother's Ghana Card Number",
      "Mother's Phone Number",
      "Father's Name",
      "Father's Ghana Card Number",
      "Father's Phone Number"
    ];

    const actualHeaders = XLSX.utils
      .sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      })[0] || [];

    const normalizedActualHeaders = actualHeaders.map(value =>
      String(value || "").trim()
    );

    const missingHeaders = requiredHeaders.filter(
      header => !normalizedActualHeaders.includes(header)
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        message: "The Excel file does not match the official student template.",
        missing_headers: missingHeaders
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        message: "The Excel file does not contain any student records."
      });
    }

    // Load active branches and classes once for validation.
    const [branchRows] = await db.query(
      `SELECT id, branch_name, location
       FROM branches
       WHERE status = 'active'
       ORDER BY branch_name`
    );

    const [classRows] = await db.query(
      `SELECT id, branch_id, class_name
       FROM classes
       WHERE status = 'active'
       ORDER BY class_name`
    );

    const normalize = value =>
      String(value == null ? "" : value)
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

    const findBranch = value => {
      const wanted = normalize(value);

      if (!wanted) return null;

      return branchRows.find(branch => {
        const branchName = normalize(branch.branch_name);
        const location = normalize(branch.location);

        return (
          wanted === branchName ||
          wanted === location ||
          wanted === normalize(`${branch.branch_name || ""} ${branch.location || ""}`)
        );
      }) || null;
    };

    const previewRows = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const errors = [];

      const excelRow = index + 2;

      const admissionNumber = String(row["Admission Number"] || "").trim();
      const branchText = String(row["Branch / Location"] || "").trim();
      const fullName = String(row["Full Name"] || "").trim();
      const sex = String(row["Sex"] || "").trim();
      const className = String(row["Class Admitted"] || "").trim();

      const branch = findBranch(branchText);

      if (admissionNumber) {
        errors.push(
          "Admission Number must be blank. The system generates it automatically."
        );
      }

      if (!branchText) {
        errors.push("Branch / Location is required.");
      } else if (!branch) {
        errors.push(`Branch / Location "${branchText}" was not found.`);
      }

      if (!fullName) {
        errors.push("Full Name is required.");
      }

      if (!sex) {
        errors.push("Sex is required.");
      } else if (!["MALE", "FEMALE"].includes(normalize(sex))) {
        errors.push('Sex must be "Male" or "Female".');
      }

      let matchedClass = null;

      if (!className) {
        errors.push("Class Admitted is required.");
      } else if (branch) {
        matchedClass = classRows.find(classRow =>
          (classRow.branch_id == null ||
            Number(classRow.branch_id) === Number(branch.id)) &&
          normalize(classRow.class_name) === normalize(className)
        );

        if (!matchedClass) {
          errors.push(
            `Class "${className}" is not an active class in ${branch.branch_name}.`
          );
        }
      }

      // Branch admins may import only into their own branch.
      if (
        branch &&
        req.user &&
        req.user.role !== "super_admin" &&
        req.user.branch_id &&
        Number(branch.id) !== Number(req.user.branch_id)
      ) {
        errors.push("You cannot import students into another branch.");
      }

      previewRows.push({
        excel_row: excelRow,
        valid: errors.length === 0,
        errors,
        data: {
          admission_number: admissionNumber,
          branch_id: branch ? Number(branch.id) : null,
          branch: branch ? branch.branch_name : branchText,
          full_name: fullName,
          sex:
            normalize(sex) === "FEMALE"
              ? "Female"
              : normalize(sex) === "MALE"
                ? "Male"
                : sex,
          date_of_birth: String(row["Date of Birth"] || "").trim(),
          date_of_admission: String(row["Date of Admission"] || "").trim(),
          place_of_birth: String(row["Place of Birth"] || "").trim(),
          nationality: String(row["Nationality"] || "").trim(),
          language_spoken: String(row["Language Spoken"] || "").trim(),
          class_id: matchedClass ? Number(matchedClass.id) : null,
          class_name: className,
          mother_name: String(row["Mother's Name"] || "").trim(),
          mother_ghana_card: String(
            row["Mother's Ghana Card Number"] || ""
          ).trim(),
          mother_phone: String(
            row["Mother's Phone Number"] || ""
          ).trim(),
          father_name: String(row["Father's Name"] || "").trim(),
          father_ghana_card: String(
            row["Father's Ghana Card Number"] || ""
          ).trim(),
          father_phone: String(
            row["Father's Phone Number"] || ""
          ).trim()
        }
      });
    }

    const validCount = previewRows.filter(row => row.valid).length;
    const errorCount = previewRows.length - validCount;

    return res.json({
      message: "Excel file validated successfully.",
      total_rows: previewRows.length,
      valid_rows: validCount,
      error_rows: errorCount,
      rows: previewRows
    });
  } catch (error) {
    console.error("Student Excel preview error:", error);

    return res.status(500).json({
      message: "Failed to read or validate the student Excel file."
    });
  }
};

// Import students from the official Excel template.
// The workbook is fully validated before any student is created.
exports.importStudentExcel = async (req, res) => {
  try {
    const XLSX = require("xlsx");

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "Please select an Excel file."
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true
    });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({
        message: "The Excel workbook does not contain a worksheet."
      });
    }

    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false
    });

    if (rows.length === 0) {
      return res.status(400).json({
        message: "The Excel file does not contain any student records."
      });
    }

    const requiredHeaders = [
      "Admission Number",
      "Branch / Location",
      "Full Name",
      "Sex",
      "Date of Birth",
      "Date of Admission",
      "Place of Birth",
      "Nationality",
      "Language Spoken",
      "Class Admitted",
      "Mother's Name",
      "Mother's Ghana Card Number",
      "Mother's Phone Number",
      "Father's Name",
      "Father's Ghana Card Number",
      "Father's Phone Number"
    ];

    const actualHeaders =
      XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      })[0] || [];

    const cleanHeaders = actualHeaders.map(value =>
      String(value || "").trim()
    );

    const missingHeaders = requiredHeaders.filter(
      header => !cleanHeaders.includes(header)
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        message: "The Excel file does not match the official student template.",
        missing_headers: missingHeaders
      });
    }

    const normalize = value =>
      String(value == null ? "" : value)
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

    const normalizeDate = value => {
      const text = String(value == null ? "" : value).trim();

      if (!text) return null;

      // Already YYYY-MM-DD.
      let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        const date = new Date(Date.UTC(year, month - 1, day));

        if (
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day
        ) {
          return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }

        return false;
      }

      // Excel display dates such as 02/10/2026.
      match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);

      if (match) {
        // Template uses day/month/year.
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);

        const date = new Date(Date.UTC(year, month - 1, day));

        if (
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day
        ) {
          return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }

        return false;
      }

      return false;
    };

    const [branchRows] = await db.query(
      `SELECT id, branch_name, location
       FROM branches
       WHERE status = 'active'
       ORDER BY branch_name`
    );

    const [classRows] = await db.query(
      `SELECT id, branch_id, class_name
       FROM classes
       WHERE status = 'active'
       ORDER BY class_name`
    );

    const findBranch = value => {
      const wanted = normalize(value);

      if (!wanted) return null;

      return branchRows.find(branch => {
        const branchName = normalize(branch.branch_name);
        const location = normalize(branch.location);

        return (
          wanted === branchName ||
          wanted === location ||
          wanted === normalize(
            `${branch.branch_name || ""} ${branch.location || ""}`
          )
        );
      }) || null;
    };

    const validatedRows = [];
    const validationErrors = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const excelRow = index + 2;
      const errors = [];

      const admissionNumber =
        String(row["Admission Number"] || "").trim();

      const branchText =
        String(row["Branch / Location"] || "").trim();

      const fullName =
        String(row["Full Name"] || "").trim();

      const sexText =
        String(row["Sex"] || "").trim();

      const className =
        String(row["Class Admitted"] || "").trim();

      const branch = findBranch(branchText);

      if (admissionNumber) {
        errors.push(
          "Admission Number must be blank. The system generates it automatically."
        );
      }

      if (!branchText) {
        errors.push("Branch / Location is required.");
      } else if (!branch) {
        errors.push(`Branch / Location "${branchText}" was not found.`);
      }

      if (!fullName) {
        errors.push("Full Name is required.");
      }

      const normalizedSex = normalize(sexText);

      if (!["MALE", "FEMALE"].includes(normalizedSex)) {
        errors.push('Sex must be "Male" or "Female".');
      }

      let matchedClass = null;

      if (!className) {
        errors.push("Class Admitted is required.");
      } else if (branch) {
        matchedClass = classRows.find(classRow =>
          (
            classRow.branch_id == null ||
            Number(classRow.branch_id) === Number(branch.id)
          ) &&
          normalize(classRow.class_name) === normalize(className)
        );

        if (!matchedClass) {
          errors.push(
            `Class "${className}" is not an active class in ${branch.branch_name}.`
          );
        }
      }

      if (
        branch &&
        req.user &&
        req.user.role !== "super_admin" &&
        req.user.branch_id &&
        Number(branch.id) !== Number(req.user.branch_id)
      ) {
        errors.push("You cannot import students into another branch.");
      }

      const dobText =
        String(row["Date of Birth"] || "").trim();

      const admissionDateText =
        String(row["Date of Admission"] || "").trim();

      const dateOfBirth = normalizeDate(dobText);
      const dateOfAdmission = normalizeDate(admissionDateText);

      if (dobText && dateOfBirth === false) {
        errors.push(
          "Date of Birth must be a valid date in DD/MM/YYYY or YYYY-MM-DD format."
        );
      }

      if (admissionDateText && dateOfAdmission === false) {
        errors.push(
          "Date of Admission must be a valid date in DD/MM/YYYY or YYYY-MM-DD format."
        );
      }

      if (errors.length > 0) {
        validationErrors.push({
          excel_row: excelRow,
          errors
        });

        continue;
      }

      validatedRows.push({
        excel_row: excelRow,
        branch_id: Number(branch.id),
        branch_name: branch.branch_name,
        full_name: fullName,
        sex: normalizedSex === "FEMALE" ? "Female" : "Male",
        date_of_birth: dateOfBirth || null,
        date_of_admission: dateOfAdmission || null,
        place_of_birth:
          String(row["Place of Birth"] || "").trim() || null,
        nationality:
          String(row["Nationality"] || "").trim() || "Ghanaian",
        language_spoken:
          String(row["Language Spoken"] || "").trim() || null,
        class_id: Number(matchedClass.id),
        class_name: matchedClass.class_name,
        mother_name:
          String(row["Mother's Name"] || "").trim() || null,
        mother_ghana_card:
          String(row["Mother's Ghana Card Number"] || "").trim() || null,
        mother_phone:
          String(row["Mother's Phone Number"] || "").trim() || null,
        father_name:
          String(row["Father's Name"] || "").trim() || null,
        father_ghana_card:
          String(row["Father's Ghana Card Number"] || "").trim() || null,
        father_phone:
          String(row["Father's Phone Number"] || "").trim() || null
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message:
          "Import stopped. Correct all Excel validation errors before importing.",
        total_rows: rows.length,
        valid_rows: validatedRows.length,
        error_rows: validationErrors.length,
        errors: validationErrors
      });
    }

    const importedStudents = [];

    // Students are processed sequentially so each branch's admission
    // number remains protected by the existing branch-row lock.
    for (const student of validatedRows) {
      let connection = null;

      try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [branchLockRows] = await connection.query(
          `SELECT id, branch_name, location
           FROM branches
           WHERE id = ?
             AND status = 'active'
           LIMIT 1
           FOR UPDATE`,
          [student.branch_id]
        );

        if (branchLockRows.length === 0) {
          throw new Error(
            `Branch for Excel row ${student.excel_row} is no longer active.`
          );
        }

        const branch = branchLockRows[0];

        const branchText =
          `${branch.branch_name || ""} ${branch.location || ""}`.toUpperCase();

        let prefix = null;

        if (branchText.includes("KOTOBABI")) {
          prefix = "AMDK";
        } else if (branchText.includes("OFANKOR")) {
          prefix = "AMDO";
        } else {
          throw new Error(
            `Automatic admission numbering is not configured for ${branch.branch_name}.`
          );
        }

        const [numberRows] = await connection.query(
          `SELECT admission_number
           FROM students
           WHERE branch_id = ?
             AND UPPER(admission_number) LIKE ?`,
          [student.branch_id, `${prefix}%`]
        );

        let highestNumber = 0;

        for (const numberRow of numberRows) {
          const currentAdmissionNumber =
            String(numberRow.admission_number || "")
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

        const admissionNumber =
          prefix + String(highestNumber + 1).padStart(3, "0");

        const primaryParentCard =
          student.mother_ghana_card ||
          student.father_ghana_card ||
          null;

        const primaryParentPhone =
          student.mother_phone ||
          student.father_phone ||
          null;

        const nameParts =
          student.full_name.trim().split(/\s+/);

        const firstName =
          nameParts[0] || student.full_name;

        const surname =
          nameParts.slice(1).join(" ") || "-";

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
            student.branch_id,
            admissionNumber,
            admissionNumber,
            student.full_name,
            firstName,
            surname,
            student.sex,
            student.date_of_birth,
            student.date_of_admission,
            student.place_of_birth,
            student.nationality,
            student.language_spoken,
            student.class_id,
            primaryParentCard,
            primaryParentPhone,
            student.mother_name,
            student.mother_ghana_card,
            student.mother_phone,
            student.father_name,
            student.father_ghana_card,
            student.father_phone,
            "active",
            null
          ]
        );

        await connection.commit();
        connection.release();
        connection = null;

        const motherParentId =
          await upsertParentAndLinkStudent({
            branchId: student.branch_id,
            studentDbId: result.insertId,
            fullName: student.mother_name,
            ghanaCard: student.mother_ghana_card,
            phone: student.mother_phone,
            relationship: "mother"
          });

        const fatherParentId =
          await upsertParentAndLinkStudent({
            branchId: student.branch_id,
            studentDbId: result.insertId,
            fullName: student.father_name,
            ghanaCard: student.father_ghana_card,
            phone: student.father_phone,
            relationship: "father"
          });

        await syncStudentParentLinks(
          result.insertId,
          [motherParentId, fatherParentId]
        );

        await db.query(
          `INSERT INTO activity_logs
          (branch_id, user_id, action, module, description)
          VALUES (?, ?, ?, ?, ?)`,
          [
            student.branch_id,
            req.user ? req.user.id : null,
            "Student Added",
            "Students",
            `Registered student ${student.full_name} with admission number ${admissionNumber} by Excel import.`
          ]
        );

        let smsStatus = "not_sent";

        try {
          const smsResult =
            await sendStudentRegistrationSms({
              studentName: student.full_name,
              admissionNumber,
              motherPhone: student.mother_phone,
              fatherPhone: student.father_phone
            });

          smsStatus =
            smsResult && smsResult.skipped
              ? "skipped"
              : "sent";
        } catch (smsError) {
          console.error(
            `Excel registration SMS failed for ${admissionNumber}:`,
            smsError.message
          );

          smsStatus = "failed";
        }

        importedStudents.push({
          excel_row: student.excel_row,
          student_database_id: result.insertId,
          admission_number: admissionNumber,
          full_name: student.full_name,
          sms_status: smsStatus
        });
      } catch (studentError) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error(
              "Excel student rollback failed:",
              rollbackError
            );
          }

          connection.release();
          connection = null;
        }

        console.error(
          `Excel import failed at row ${student.excel_row}:`,
          studentError
        );

        return res.status(500).json({
          message:
            `Import stopped while processing Excel row ${student.excel_row}.`,
          imported_count: importedStudents.length,
          imported_students: importedStudents,
          error: studentError.message
        });
      }
    }

    return res.status(201).json({
      message: `${importedStudents.length} student(s) imported successfully.`,
      imported_count: importedStudents.length,
      imported_students: importedStudents
    });
  } catch (error) {
    console.error("Student Excel import error:", error);

    return res.status(500).json({
      message: "Failed to import students from Excel.",
      error: error.message
    });
  }
};

// Update student status only
exports.updateStudentStatus = async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const status = String(req.body.status || "").trim().toLowerCase();

    const allowedStatuses = [
      "active",
      "inactive",
      "stopped",
      "transferred",
      "completed"
    ];

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        message: "Invalid student ID"
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid student status"
      });
    }

    const [students] = await db.query(
      `SELECT id, branch_id, admission_number, full_name, status
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!students.length) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    const student = students[0];

    // Branch administrators may only update students in their own branch.
    if (
      req.user &&
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this administrator"
        });
      }

      if (Number(student.branch_id) !== Number(req.user.branch_id)) {
        return res.status(403).json({
          message: "You cannot update a student from another branch"
        });
      }
    }

    if (student.status === status) {
      return res.json({
        message: "Student status is already up to date",
        student: {
          id: student.id,
          admission_number: student.admission_number,
          full_name: student.full_name,
          status
        }
      });
    }

    await db.query(
      `UPDATE students
       SET status = ?
       WHERE id = ?`,
      [status, studentId]
    );

    return res.json({
      message: "Student status updated successfully",
      student: {
        id: student.id,
        admission_number: student.admission_number,
        full_name: student.full_name,
        status
      }
    });
  } catch (error) {
    console.error("Update student status error:", error);

    return res.status(500).json({
      message: "Failed to update student status",
      error: error.message
    });
  }
};
