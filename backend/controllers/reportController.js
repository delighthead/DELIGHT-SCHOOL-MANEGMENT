// DELIGHT STUDENT TERMINAL REPORT SUPPORT
const db = require("../config/database");

exports.getReports = async (req, res) => {
  try {
    const branchId = req.query.branch_id;

    let sql = `
      SELECT
        reports.*,
        branches.branch_name,
        classes.class_name,
        users.full_name AS generated_by_name,
        CASE
          WHEN reports.student_id IS NOT NULL
            THEN COALESCE(students.full_name, 'Unknown Student')
          ELSE 'All Students'
        END AS student_display
      FROM reports
      LEFT JOIN branches ON reports.branch_id = branches.id
      LEFT JOIN classes ON reports.class_id = classes.id
      LEFT JOIN users ON reports.generated_by = users.id
      LEFT JOIN students ON reports.student_id = students.id
    `;

    const params = [];

    if (branchId) {
      sql += " WHERE reports.branch_id = ?";
      params.push(branchId);
    }

    sql += " ORDER BY reports.generated_at DESC";

    const [reports] = await db.query(sql, params);

    res.json({
      message: "Reports retrieved successfully",
      reports
    });

  } catch (error) {
    console.error("Get reports error:", error);

    res.status(500).json({
      message: "Failed to retrieve reports"
    });
  }
};

exports.createReport = async (req, res) => {
  try {
    const {
      branch_id,
      student_id,
      class_id,
      term,
      academic_year,
      teacher_comment,
      headteacher_comment,
      reopening_date
    } = req.body;

    const branchId = Number(branch_id);
    const classId = Number(class_id);

    if (
      !Number.isInteger(branchId) ||
      branchId <= 0 ||
      !Number.isInteger(classId) ||
      classId <= 0 ||
      !term ||
      !academic_year
    ) {
      return res.status(400).json({
        message: "Branch, class, term and academic year are required."
      });
    }

    const [branches] = await db.query(
      "SELECT id FROM branches WHERE id = ? LIMIT 1",
      [branchId]
    );

    if (!branches.length) {
      return res.status(400).json({
        message: "Selected branch does not exist."
      });
    }

    const [classes] = await db.query(
      "SELECT id FROM classes WHERE id = ? LIMIT 1",
      [classId]
    );

    if (!classes.length) {
      return res.status(400).json({
        message: "Selected class does not exist."
      });
    }

    if (
      student_id === undefined ||
      student_id === null ||
      String(student_id).trim() === ""
    ) {
      return res.status(400).json({
        message: "Please select a student or All Students."
      });
    }

    let studentId = null;

    if (String(student_id) !== "all") {
      studentId = Number(student_id);

      if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
          message: "Invalid student selected."
        });
      }

      const [students] = await db.query(
        `SELECT id
         FROM students
         WHERE id = ?
           AND branch_id = ?
           AND class_id = ?
           AND status = 'active'
         LIMIT 1`,
        [studentId, branchId, classId]
      );

      if (!students.length) {
        return res.status(400).json({
          message: "Student does not belong to the selected branch and class."
        });
      }
    }

    const generatedBy = req.user ? req.user.id : null;

    await db.query(
      `INSERT INTO reports (
        branch_id,
        report_name,
        report_type,
        class_id,
        student_id,
        term,
        academic_year,
        generated_by,
        teacher_comment,
        headteacher_comment,
        reopening_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branchId,
        "Terminal Exams",
        "Terminal Exams",
        classId,
        studentId,
        term,
        academic_year,
        generatedBy,
        teacher_comment || null,
        headteacher_comment || null,
        reopening_date || null
      ]
    );

    res.status(201).json({
      message: "Terminal Exams report created successfully."
    });

  } catch (error) {
    console.error("Create report error:", error);

    res.status(500).json({
      message: "Failed to create report."
    });
  }
};


// Delete only the selected report record.
exports.deleteReport = async (req, res) => {
  try {
    const reportId = Number(req.params.id);

    if (!Number.isSafeInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        message: "Invalid report ID."
      });
    }

    const role = req.user.role;
    // Only Super Admin can delete reports across branches.
    // All other administrators are restricted to their assigned branch.
    const restrictedRole = role !== "super_admin";

    let sql = "DELETE FROM reports WHERE id = ?";
    const params = [reportId];

    if (restrictedRole) {
      const branchId = Number(req.user.branch_id);

      if (!Number.isSafeInteger(branchId) || branchId <= 0) {
        return res.status(403).json({
          message: "Valid branch access is required."
        });
      }

      sql += " AND branch_id = ?";
      params.push(branchId);
    }

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Report not found or access denied."
      });
    }

    return res.json({
      message: "Report record deleted successfully."
    });

  } catch (error) {
    console.error("Delete report error:", error);

    return res.status(500).json({
      message: "Failed to delete report."
    });
  }
};
