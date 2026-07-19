const db = require("../config/database");

// Promote active students from one class to another class, or complete them
exports.promoteStudents = async (req, res) => {
  const connection = await db.getConnection();

  try {
    let { branch_id, from_class_id, to_class_id, academic_year, student_ids } = req.body;
    const selectedStudentIds = Array.isArray(student_ids) ? student_ids : [];

    // Branch admin must only promote students in their own branch
    if (req.user && req.user.role === "branch_admin") {
      branch_id = req.user.branch_id;
    }
    const promotedBy = req.user ? req.user.id : null;

    if (!branch_id || !from_class_id || !to_class_id) {
      return res.status(400).json({
        message: "Branch, current class, and next class are required"
      });
    }

    await connection.beginTransaction();

    const [[fromClass]] = await connection.query(
      "SELECT class_name FROM classes WHERE id = ? LIMIT 1",
      [from_class_id]
    );

    let toClassName = "Completed";

    if (to_class_id !== "completed") {
      const [[toClass]] = await connection.query(
        "SELECT class_name FROM classes WHERE id = ? LIMIT 1",
        [to_class_id]
      );

      toClassName = toClass ? toClass.class_name : "";
    }

    let studentSql = `SELECT id, full_name, admission_number
       FROM students
       WHERE branch_id = ?
         AND class_id = ?
         AND status = 'active'`;

    const studentParams = [branch_id, from_class_id];

    if (selectedStudentIds.length > 0) {
      studentSql += ` AND id IN (${selectedStudentIds.map(() => "?").join(",")})`;
      studentParams.push(...selectedStudentIds);
    }

    const [students] = await connection.query(studentSql, studentParams);

    if (students.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "No active students found for promotion"
      });
    }

    for (const student of students) {
      await connection.query(
        `INSERT INTO promotion_history
        (
          branch_id,
          student_id,
          from_class_id,
          to_class_id,
          from_class_name,
          to_class_name,
          academic_year,
          promoted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          branch_id,
          student.id,
          from_class_id,
          to_class_id === "completed" ? null : to_class_id,
          fromClass ? fromClass.class_name : "",
          toClassName,
          academic_year || null,
          promotedBy
        ]
      );
    }

    let result;

    if (to_class_id === "completed") {
      let updateSql = `UPDATE students
         SET status = 'completed'
         WHERE branch_id = ?
           AND class_id = ?
           AND status = 'active'`;

      const updateParams = [branch_id, from_class_id];

      if (selectedStudentIds.length > 0) {
        updateSql += ` AND id IN (${selectedStudentIds.map(() => "?").join(",")})`;
        updateParams.push(...selectedStudentIds);
      }

      [result] = await connection.query(updateSql, updateParams);
    } else {
      let updateSql = `UPDATE students
         SET class_id = ?,
             status = 'active'
         WHERE branch_id = ?
           AND class_id = ?
           AND status = 'active'`;

      const updateParams = [to_class_id, branch_id, from_class_id];

      if (selectedStudentIds.length > 0) {
        updateSql += ` AND id IN (${selectedStudentIds.map(() => "?").join(",")})`;
        updateParams.push(...selectedStudentIds);
      }

      [result] = await connection.query(updateSql, updateParams);
    }

    await connection.commit();

    res.json({
      message: "Students promoted successfully",
      promoted_count: result.affectedRows,
      academic_year: academic_year || null
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      message: "Failed to promote students",
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get promotion history
exports.getPromotionHistory = async (req, res) => {
  try {
    let sql = `SELECT 
        ph.id,
        ph.branch_id,
        b.branch_name,
        ph.student_id,
        s.admission_number,
        s.full_name,
        ph.from_class_name,
        ph.to_class_name,
        ph.academic_year,
        ph.promoted_at,
        u.username AS promoted_by_username
       FROM promotion_history ph
       LEFT JOIN branches b ON ph.branch_id = b.id
       LEFT JOIN students s ON ph.student_id = s.id
       LEFT JOIN users u ON ph.promoted_by = u.id`;

    const params = [];

    if (req.user && req.user.role === "branch_admin") {
      sql += " WHERE ph.branch_id = ?";
      params.push(req.user.branch_id);
    }

    sql += " ORDER BY ph.promoted_at DESC";

    const [history] = await db.query(sql, params);

    res.json({
      message: "Promotion history retrieved successfully",
      history
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve promotion history",
      error: error.message
    });
  }
};
