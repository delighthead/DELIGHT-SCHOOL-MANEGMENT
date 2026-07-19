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
        (
          SELECT COUNT(DISTINCT scores.student_id)
          FROM scores
          WHERE scores.branch_id = reports.branch_id
            AND scores.class_id = reports.class_id
            AND scores.term = reports.term
            AND scores.academic_year = reports.academic_year
        ) AS student_count,
        (
          SELECT
            CASE
              WHEN COUNT(DISTINCT scores.student_id) = 1 THEN
                MAX(COALESCE(students.full_name, CONCAT(students.first_name, ' ', students.surname)))
              WHEN COUNT(DISTINCT scores.student_id) > 1 THEN
                CONCAT('Class Report (', COUNT(DISTINCT scores.student_id), ' students)')
              ELSE
                'Class Report'
            END
          FROM scores
          LEFT JOIN students ON scores.student_id = students.id
          WHERE scores.branch_id = reports.branch_id
            AND scores.class_id = reports.class_id
            AND scores.term = reports.term
            AND scores.academic_year = reports.academic_year
        ) AS student_display
      FROM reports
      LEFT JOIN branches ON reports.branch_id = branches.id
      LEFT JOIN classes ON reports.class_id = classes.id
      LEFT JOIN users ON reports.generated_by = users.id
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
    res.status(500).json({
      message: "Failed to retrieve reports",
      error: error.message
    });
  }
};

exports.createReport = async (req, res) => {
  try {
    const {
      branch_id,
      report_name,
      report_type,
      class_id,
      term,
      academic_year,
      teacher_comment,
      headteacher_comment,
      reopening_date
    } = req.body;

    const generatedBy = req.user ? req.user.id : null;

    await db.query(
      `INSERT INTO reports
      (
        branch_id,
        report_name,
        report_type,
        class_id,
        term,
        academic_year,
        generated_by,
        teacher_comment,
        headteacher_comment,
        reopening_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id || null,
        report_name || null,
        report_type || null,
        class_id || null,
        term || null,
        academic_year || null,
        generatedBy,
        teacher_comment || null,
        headteacher_comment || null,
        reopening_date || null
      ]
    );

    res.status(201).json({
      message: "Report created successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create report",
      error: error.message
    });
  }
};
