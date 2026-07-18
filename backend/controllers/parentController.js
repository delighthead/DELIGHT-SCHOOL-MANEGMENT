const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function linkParentToMatchingStudents(parentId, branchId, ghanaCardNumber, phoneNumber) {
  const cleanCard = String(ghanaCardNumber || "").trim();
  const cleanPhone = String(phoneNumber || "").trim();

  if (!parentId || !branchId || (!cleanCard && !cleanPhone)) return;

  await db.query(
    `INSERT INTO parent_student_links (parent_id, student_id, relationship)
     SELECT
       ?,
       students.id,
       CASE
         WHEN students.mother_ghana_card = ? OR students.mother_phone = ? THEN 'mother'
         WHEN students.father_ghana_card = ? OR students.father_phone = ? THEN 'father'
         ELSE 'guardian'
       END
     FROM students
     WHERE students.branch_id = ?
       AND (
         students.mother_ghana_card = ?
         OR students.father_ghana_card = ?
         OR students.parent_ghana_card_number = ?
         OR students.mother_phone = ?
         OR students.father_phone = ?
         OR students.parent_phone = ?
       )
     ON DUPLICATE KEY UPDATE
       relationship = VALUES(relationship)`,
    [
      parentId,
      cleanCard,
      cleanPhone,
      cleanCard,
      cleanPhone,
      branchId,
      cleanCard,
      cleanCard,
      cleanCard,
      cleanPhone,
      cleanPhone,
      cleanPhone
    ]
  );
}

async function getLoggedInParentProfile(user) {
  if (!user) return null;

  const [parents] = await db.query(
    `SELECT
      parents.id,
      parents.branch_id,
      branches.branch_name,
      parents.user_id,
      parents.full_name,
      parents.ghana_card_number,
      parents.phone,
      parents.email,
      parents.address,
      parents.status
    FROM parents
    LEFT JOIN branches ON parents.branch_id = branches.id
    WHERE parents.user_id = ? OR parents.ghana_card_number = ?
    LIMIT 1`,
    [user.id, user.username]
  );

  return parents.length > 0 ? parents[0] : null;
}

// Add parent
exports.createParent = async (req, res) => {
  try {
    const {
      branch_id,
      full_name,
      ghana_card_number,
      phone,
      email,
      address
    } = req.body;

    if (!branch_id || !full_name || !ghana_card_number || !phone) {
      return res.status(400).json({
        message: "Branch, full name, Ghana Card number, and phone are required"
      });
    }

    const hashedPassword = await bcrypt.hash(phone, 10);

    const [userResult] = await db.query(
      `INSERT INTO users (branch_id, full_name, username, password, role, phone, email, status)
       VALUES (?, ?, ?, ?, 'parent', ?, ?, 'active')`,
      [
        branch_id,
        full_name,
        ghana_card_number,
        hashedPassword,
        phone,
        email || null
      ]
    );

    const [parentResult] = await db.query(
      `INSERT INTO parents
      (branch_id, user_id, ghana_card_number, full_name, phone, email, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        userResult.insertId,
        ghana_card_number,
        full_name,
        phone,
        email || null,
        address || null
      ]
    );

    await linkParentToMatchingStudents(
      parentResult.insertId,
      branch_id,
      ghana_card_number,
      phone
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id,
        req.user ? req.user.id : null,
        "Parent Added",
        "Parents",
        `Added parent ${full_name} with Ghana Card ${ghana_card_number}.`
      ]
    );

    res.status(201).json({
      message: "Parent added successfully",
      parent_database_id: parentResult.insertId,
      login_username: ghana_card_number,
      login_password: phone
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Parent Ghana Card number or username already exists"
      });
    }

    res.status(500).json({
      message: "Failed to add parent",
      error: error.message
    });
  }
};

// Get parents
exports.getParents = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `SELECT
        parents.id,
        parents.branch_id,
        branches.branch_name,
        parents.full_name,
        parents.ghana_card_number,
        parents.phone,
        parents.email,
        parents.address,
        parents.status,
        parents.status,
        parents.created_at
      FROM parents
      LEFT JOIN branches ON parents.branch_id = branches.id`;

    const params = [];

    if (branch_id) {
      sql += " WHERE parents.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY parents.id DESC";

    const [parents] = await db.query(sql, params);

    res.json({
      message: "Parents retrieved successfully",
      parents
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parents",
      error: error.message
    });
  }
};

// Get children linked to a parent
exports.getParentChildren = async (req, res) => {
  try {
    const { parentId } = req.params;

    const [parents] = await db.query(
      "SELECT id, branch_id, ghana_card_number, full_name FROM parents WHERE id = ? LIMIT 1",
      [parentId]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    const parent = parents[0];

    const [children] = await db.query(
      `SELECT
        students.id,
        students.branch_id,
        branches.branch_name,
        students.admission_number,
        students.full_name,
        students.sex,
        students.date_of_birth,
        students.place_of_birth,
        students.nationality,
        students.language_spoken,
        classes.class_name,
        students.mother_name,
        students.mother_ghana_card,
        students.mother_phone,
        students.father_name,
        students.father_ghana_card,
        students.father_phone,
        students.status
      FROM students
      LEFT JOIN branches ON students.branch_id = branches.id
      LEFT JOIN classes ON students.class_id = classes.id
      WHERE students.branch_id = ?
      AND (
        students.mother_ghana_card = ?
        OR students.father_ghana_card = ?
        OR students.parent_ghana_card_number = ?
      )
      ORDER BY students.full_name`,
      [
        parent.branch_id,
        parent.ghana_card_number,
        parent.ghana_card_number,
        parent.ghana_card_number
      ]
    );

    res.json({
      message: "Parent children retrieved successfully",
      parent,
      children
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent children",
      error: error.message
    });
  }
};

// Get parent record by user login ID
exports.getParentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [parents] = await db.query(
      `SELECT
        parents.id,
        parents.branch_id,
        branches.branch_name,
        parents.user_id,
        parents.full_name,
        parents.ghana_card_number,
        parents.phone,
        parents.email,
        parents.address,
        parents.status
      FROM parents
      LEFT JOIN branches ON parents.branch_id = branches.id
      WHERE parents.user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent record not found for this login account"
      });
    }

    res.json({
      message: "Parent retrieved successfully",
      parent: parents[0]
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent",
      error: error.message
    });
  }
};

// Get logged-in parent profile
exports.getMyProfile = async (req, res) => {
  try {
    const parent = await getLoggedInParentProfile(req.user);

    if (!parent) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    res.json({
      message: "Parent profile retrieved successfully",
      parent
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent profile",
      error: error.message
    });
  }
};

// Update logged-in parent contact details only (phone, email)
exports.updateMyProfile = async (req, res) => {
  try {
    const parent = await getLoggedInParentProfile(req.user);

    if (!parent) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "").trim();

    const blockedFields = [
      "full_name",
      "ghana_card_number",
      "branch_id",
      "status",
      "address",
      "user_id"
    ];

    const attemptedRestricted = blockedFields.filter((key) => req.body[key] !== undefined);

    if (attemptedRestricted.length > 0) {
      return res.status(403).json({
        message: "You can only update phone number and email"
      });
    }

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required"
      });
    }

    const [duplicateUsers] = await db.query(
      "SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1",
      [phone, parent.user_id || 0]
    );

    if (duplicateUsers.length > 0) {
      return res.status(409).json({
        message: "Phone number is already used by another account"
      });
    }

    const hashedPassword = await bcrypt.hash(phone, 10);

    await db.query(
      `UPDATE parents
       SET phone = ?,
           email = ?
       WHERE id = ?`,
      [phone, email || null, parent.id]
    );

    if (parent.user_id) {
      await db.query(
        `UPDATE users
         SET phone = ?,
             email = ?,
             password = ?
         WHERE id = ?`,
        [phone, email || null, hashedPassword, parent.user_id]
      );
    } else {
      await db.query(
        `UPDATE users
         SET phone = ?,
             email = ?,
             password = ?
         WHERE username = ?`,
        [phone, email || null, hashedPassword, parent.ghana_card_number]
      );
    }

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        parent.branch_id,
        req.user ? req.user.id : null,
        "Parent Contact Updated",
        "Parents",
        `Parent updated own phone/email. Password synced to new phone.`
      ]
    );

    const updatedParent = await getLoggedInParentProfile(req.user);

    res.json({
      message: "Profile updated successfully. Your new phone number is now your password.",
      parent: updatedParent
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
};

// Get parent child results
exports.getParentResults = async (req, res) => {
  try {
    const { parentId } = req.params;

    const [parents] = await db.query(
      "SELECT id, branch_id, ghana_card_number, full_name FROM parents WHERE id = ? LIMIT 1",
      [parentId]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    const parent = parents[0];

    const [children] = await db.query(
      `SELECT
        students.id,
        students.branch_id,
        branches.branch_name,
        students.admission_number,
        students.full_name,
        students.sex,
        classes.class_name,
        students.status
      FROM students
      LEFT JOIN branches ON students.branch_id = branches.id
      LEFT JOIN classes ON students.class_id = classes.id
      WHERE students.branch_id = ?
      AND (
        students.mother_ghana_card = ?
        OR students.father_ghana_card = ?
        OR students.parent_ghana_card_number = ?
      )
      ORDER BY students.full_name
      LIMIT 1`,
      [
        parent.branch_id,
        parent.ghana_card_number,
        parent.ghana_card_number,
        parent.ghana_card_number
      ]
    );

    if (children.length === 0) {
      return res.json({
        message: "No child linked to this parent",
        parent,
        child: null,
        results: [],
        summary: null
      });
    }

    const child = children[0];

    const [results] = await db.query(
      `SELECT
        scores.id,
        scores.subject,
        scores.assessment_score,
        scores.examination_score,
        scores.total_score,
        scores.grade,
        scores.position,
        scores.remarks,
        scores.term,
        scores.academic_year,
        scores.approval_status
      FROM scores
      WHERE scores.student_id = ?
      AND scores.approval_status = 'approved'
      ORDER BY scores.subject`,
      [child.id]
    );

    let totalScore = 0;

    results.forEach((row) => {
      totalScore += Number(row.total_score || 0);
    });

    const average = results.length > 0 ? (totalScore / results.length).toFixed(1) : "0.0";

    let overallGrade = "N/A";

    if (average >= 80) overallGrade = "A";
    else if (average >= 70) overallGrade = "B";
    else if (average >= 60) overallGrade = "C";
    else if (average >= 50) overallGrade = "D";
    else if (average > 0) overallGrade = "F";

    res.json({
      message: "Parent results retrieved successfully",
      parent,
      child,
      results,
      summary: {
        total_score: totalScore,
        average,
        overall_grade: overallGrade,
        class_position: results.length > 0 ? results[0].position || "" : "",
        teacher_remark: results.length > 0 ? "Keep working hard." : "",
        headteacher_remark: results.length > 0 ? "Promoted." : ""
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent results",
      error: error.message
    });
  }
};

// Get parent child attendance
exports.getParentAttendance = async (req, res) => {
  try {
    const { parentId } = req.params;

    const [parents] = await db.query(
      "SELECT id, branch_id, ghana_card_number, full_name FROM parents WHERE id = ? LIMIT 1",
      [parentId]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    const parent = parents[0];

    const [children] = await db.query(
      `SELECT
        students.id,
        students.branch_id,
        branches.branch_name,
        students.admission_number,
        students.full_name,
        students.sex,
        classes.class_name,
        students.status
      FROM students
      LEFT JOIN branches ON students.branch_id = branches.id
      LEFT JOIN classes ON students.class_id = classes.id
      WHERE students.branch_id = ?
      AND (
        students.mother_ghana_card = ?
        OR students.father_ghana_card = ?
        OR students.parent_ghana_card_number = ?
      )
      ORDER BY students.full_name
      LIMIT 1`,
      [
        parent.branch_id,
        parent.ghana_card_number,
        parent.ghana_card_number,
        parent.ghana_card_number
      ]
    );

    if (children.length === 0) {
      return res.json({
        message: "No child linked to this parent",
        parent,
        child: null,
        attendance: [],
        summary: null
      });
    }

    const child = children[0];

    const [attendance] = await db.query(
      `SELECT
        attendance.id,
        attendance.attendance_date,
        attendance.term,
        attendance.academic_year,
        attendance.status,
        attendance.remarks,
        classes.class_name,
        branches.branch_name
      FROM attendance
      LEFT JOIN classes ON attendance.class_id = classes.id
      LEFT JOIN branches ON attendance.branch_id = branches.id
      WHERE attendance.student_id = ?
      AND attendance.branch_id = ?
      ORDER BY attendance.attendance_date DESC`,
      [child.id, child.branch_id]
    );

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: attendance.length
    };

    attendance.forEach((row) => {
      if (summary[row.status] !== undefined) {
        summary[row.status] += 1;
      }
    });

    res.json({
      message: "Parent attendance retrieved successfully",
      parent,
      child,
      attendance,
      summary
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent attendance",
      error: error.message
    });
  }
};

// Get parent child fees
exports.getParentFees = async (req, res) => {
  try {
    const { parentId } = req.params;

    const [parents] = await db.query(
      "SELECT id, branch_id, ghana_card_number, full_name FROM parents WHERE id = ? LIMIT 1",
      [parentId]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    const parent = parents[0];

    const [children] = await db.query(
      `SELECT
        students.id,
        students.branch_id,
        branches.branch_name,
        students.admission_number,
        students.full_name,
        students.sex,
        classes.class_name,
        students.status
      FROM students
      LEFT JOIN branches ON students.branch_id = branches.id
      LEFT JOIN classes ON students.class_id = classes.id
      WHERE students.branch_id = ?
      AND (
        students.mother_ghana_card = ?
        OR students.father_ghana_card = ?
        OR students.parent_ghana_card_number = ?
      )
      ORDER BY students.full_name
      LIMIT 1`,
      [
        parent.branch_id,
        parent.ghana_card_number,
        parent.ghana_card_number,
        parent.ghana_card_number
      ]
    );

    if (children.length === 0) {
      return res.json({
        message: "No child linked to this parent",
        parent,
        child: null,
        fees: [],
        summary: null
      });
    }

    const child = children[0];

    const [fees] = await db.query(
      `SELECT
        fees.id,
        fees.term,
        fees.academic_year,
        fees.amount_payable,
        fees.amount_paid,
        fees.balance,
        fees.payment_date,
        fees.payment_status,
        fees.created_at
      FROM fees
      WHERE fees.student_id = ?
      AND fees.branch_id = ?
      ORDER BY fees.created_at DESC`,
      [child.id, child.branch_id]
    );

    let totalPayable = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    fees.forEach((row) => {
      totalPayable += Number(row.amount_payable || 0);
      totalPaid += Number(row.amount_paid || 0);
      totalBalance += Number(row.balance || 0);
    });

    res.json({
      message: "Parent fees retrieved successfully",
      parent,
      child,
      fees,
      summary: {
        total_payable: totalPayable,
        total_paid: totalPaid,
        total_balance: totalBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent fees",
      error: error.message
    });
  }
};

// Get parent branch announcements
exports.getParentAnnouncements = async (req, res) => {
  try {
    const { parentId } = req.params;

    const [parents] = await db.query(
      `SELECT 
        parents.id,
        parents.branch_id,
        parents.ghana_card_number,
        parents.full_name,
        branches.branch_name
      FROM parents
      LEFT JOIN branches ON parents.branch_id = branches.id
      WHERE parents.id = ?
        AND students.status = 'active' 
      LIMIT 1`,
      [parentId]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    const parent = parents[0];

    const [announcements] = await db.query(
      `SELECT
        announcements.id,
        announcements.title,
        announcements.message,
        announcements.audience,
        announcements.created_at,
        branches.branch_name
      FROM announcements
      LEFT JOIN branches ON announcements.branch_id = branches.id
      WHERE announcements.branch_id = ?
      AND (
        announcements.audience = 'all'
        OR announcements.audience = 'parents'
        OR announcements.audience IS NULL
      )
      ORDER BY announcements.created_at DESC`,
      [parent.branch_id]
    );

    res.json({
      message: "Parent announcements retrieved successfully",
      parent,
      announcements
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent announcements",
      error: error.message
    });
  }
};

// Update parent
exports.updateParent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branch_id,
      full_name,
      ghana_card_number,
      phone,
      email,
      address,
      status
    } = req.body;

    if (!branch_id || !full_name || !ghana_card_number || !phone) {
      return res.status(400).json({
        message: "Branch, parent name, Ghana Card, and phone are required"
      });
    }

    const [parents] = await db.query(
      "SELECT id, branch_id, user_id, ghana_card_number FROM parents WHERE id = ? LIMIT 1",
      [id]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent not found"
      });
    }

    const parent = parents[0];

    if (req.user.role === "branch_admin" && Number(parent.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only edit parents in your own branch"
      });
    }

    await db.query(
      `UPDATE parents
       SET branch_id = ?,
           full_name = ?,
           ghana_card_number = ?,
           phone = ?,
           email = ?,
           address = ?,
           status = ?
       WHERE id = ?`,
      [
        branch_id,
        full_name,
        ghana_card_number,
        phone,
        email || null,
        address || null,
        status || "active",
        id
      ]
    );

    await linkParentToMatchingStudents(id, branch_id, ghana_card_number, phone);

    if (parent.user_id) {
      await db.query(
        `UPDATE users
         SET branch_id = ?,
             full_name = ?,
             username = ?,
             phone = ?,
             email = ?,
             status = ?
         WHERE id = ?`,
        [
          branch_id,
          full_name,
          ghana_card_number,
          phone,
          email || null,
          status || "active",
          parent.user_id
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
             status = ?
         WHERE username = ?`,
        [
          branch_id,
          full_name,
          ghana_card_number,
          phone,
          email || null,
          status || "active",
          parent.ghana_card_number
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
        "Parent Updated",
        "Parents",
        `Updated parent ${full_name}.`
      ]
    );

    res.json({
      message: "Parent updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update parent",
      error: error.message
    });
  }
};

// Get children linked to parent
exports.getParentChildren = async (req, res) => {
  try {
    const { id } = req.params;

    const [children] = await db.query(
      `SELECT
        students.id,
        students.student_id,
        students.admission_number,
        students.full_name,
        students.sex,
        classes.class_name,
        students.status,
        parent_student_links.relationship
      FROM parent_student_links
      JOIN students ON parent_student_links.student_id = students.id
      LEFT JOIN classes ON students.class_id = classes.id
      WHERE parent_student_links.parent_id = ?
        AND students.status = 'active'
        ORDER BY students.full_name ASC`,
      [id]
    );

    res.json({
      message: "Parent children retrieved successfully",
      children
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent children",
      error: error.message
    });
  }
};

// Get all active children for logged-in parent
exports.getMyActiveChildren = async (req, res) => {
  try {
    const [parents] = await db.query(
      "SELECT id FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
      [req.user.id, req.user.username]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const parentId = parents[0].id;

    const [children] = await db.query(
      `SELECT
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
        students.mother_name,
        students.mother_ghana_card,
        students.mother_phone,
        students.father_name,
        students.father_ghana_card,
        students.father_phone,
        students.profile_picture,
        students.status,
        classes.class_name,
        parent_student_links.relationship
      FROM parent_student_links
      JOIN students ON parent_student_links.student_id = students.id
      LEFT JOIN branches ON students.branch_id = branches.id
      LEFT JOIN classes ON students.class_id = classes.id
      WHERE parent_student_links.parent_id = ?
        AND students.status = 'active'
      ORDER BY students.full_name ASC`,
      [parentId]
    );

    res.json({
      message: "Active children retrieved successfully",
      children
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve active children",
      error: error.message
    });
  }
};

// Get approved scores for all active children of logged-in parent
exports.getMyChildrenScores = async (req, res) => {
  try {
    const [parents] = await db.query(
      "SELECT id FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
      [req.user.id, req.user.username]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const parentId = parents[0].id;

    const [scores] = await db.query(
      `SELECT
        students.id AS student_id,
        students.full_name AS student_name,
        students.admission_number,
        students.status AS student_status,
        classes.class_name,
        scores.subject,
        scores.term,
        scores.academic_year,
        scores.assessment_score,
        scores.examination_score,
        scores.total_score,
        scores.grade,
        scores.position,
        scores.remarks,
        scores.approval_status
      FROM parent_student_links
      JOIN students ON parent_student_links.student_id = students.id
      LEFT JOIN classes ON students.class_id = classes.id
      JOIN scores ON scores.student_id = students.id
      WHERE parent_student_links.parent_id = ?
        AND students.status = 'active'
        AND scores.approval_status = 'approved'
      ORDER BY students.full_name ASC, scores.subject ASC`,
      [parentId]
    );

    res.json({
      message: "Children scores retrieved successfully",
      scores
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve children scores",
      error: error.message
    });
  }
};

// Get fees for all active children of logged-in parent
exports.getMyChildrenFees = async (req, res) => {
  try {
    const [parents] = await db.query(
      "SELECT id FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
      [req.user.id, req.user.username]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const parentId = parents[0].id;

    const [fees] = await db.query(
      `SELECT
        students.id AS student_id,
        students.full_name AS student_name,
        students.admission_number,
        classes.class_name,
        fees.term,
        fees.academic_year,
        fees.amount_payable,
        fees.amount_paid,
        fees.balance,
        fees.payment_status,
        fees.payment_date
      FROM parent_student_links
      JOIN students ON parent_student_links.student_id = students.id
      LEFT JOIN classes ON students.class_id = classes.id
      LEFT JOIN fees ON fees.student_id = students.id
      WHERE parent_student_links.parent_id = ?
        AND students.status = 'active'
      ORDER BY students.full_name ASC, fees.academic_year DESC, fees.term ASC`,
      [parentId]
    );

    res.json({
      message: "Children fees retrieved successfully",
      fees
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve children fees",
      error: error.message
    });
  }
};

// Get attendance for all active children of logged-in parent
exports.getMyChildrenAttendance = async (req, res) => {
  try {
    const [parents] = await db.query(
      "SELECT id FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
      [req.user.id, req.user.username]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const parentId = parents[0].id;

    const [attendance] = await db.query(
      `SELECT
        students.id AS student_id,
        students.full_name AS student_name,
        students.admission_number,
        classes.class_name,
        attendance.attendance_date,
        attendance.term,
        attendance.academic_year,
        attendance.status,
        attendance.remarks
      FROM parent_student_links
      JOIN students ON parent_student_links.student_id = students.id
      LEFT JOIN classes ON students.class_id = classes.id
      JOIN attendance ON attendance.student_id = students.id
      WHERE parent_student_links.parent_id = ?
        AND students.status = 'active'
      ORDER BY attendance.attendance_date DESC, students.full_name ASC`,
      [parentId]
    );

    res.json({
      message: "Children attendance retrieved successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve children attendance",
      error: error.message
    });
  }
};

// Get reports for classes of all active children of logged-in parent
exports.getMyChildrenReports = async (req, res) => {
  try {
    const [parents] = await db.query(
      "SELECT id FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
      [req.user.id, req.user.username]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const parentId = parents[0].id;

    const [reports] = await db.query(
      `SELECT DISTINCT
        reports.id,
        reports.report_name,
        reports.report_type,
        reports.term,
        reports.academic_year,
        reports.generated_at,
        reports.file_path,
        branches.branch_name,
        classes.class_name,
        users.full_name AS generated_by_name
      FROM parent_student_links
      JOIN students ON parent_student_links.student_id = students.id
      JOIN reports ON reports.class_id = students.class_id
      LEFT JOIN branches ON reports.branch_id = branches.id
      LEFT JOIN classes ON reports.class_id = classes.id
      LEFT JOIN users ON reports.generated_by = users.id
      WHERE parent_student_links.parent_id = ?
        AND students.status = 'active'
      ORDER BY reports.generated_at DESC`,
      [parentId]
    );

    res.json({
      message: "Children reports retrieved successfully",
      reports
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve children reports",
      error: error.message
    });
  }
};


// Disable or enable parent account without deleting records
exports.toggleParentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["active", "disabled", "locked"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Status must be active, disabled, or locked."
      });
    }

    const [parentRows] = await db.query(
      "SELECT id, user_id, full_name FROM parents WHERE id = ? LIMIT 1",
      [id]
    );

    if (parentRows.length === 0) {
      return res.status(404).json({
        message: "Parent not found."
      });
    }

    const parent = parentRows[0];

    await db.query(
      "UPDATE parents SET status = ? WHERE id = ?",
      [status, id]
    );

    if (parent.user_id) {
      await db.query(
        "UPDATE users SET status = ? WHERE id = ?",
        [status, parent.user_id]
      );
    }

    res.json({
      message: `${parent.full_name || "Parent"} account is now ${status}.`
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update parent status.",
      error: error.message
    });
  }
};
