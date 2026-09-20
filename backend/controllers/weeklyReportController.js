const db = require("../config/database");

function getUploadedFilePath(file) {
  if (!file) return null;
  return `/uploads/weekly-reports/${file.filename}`;
}

exports.createWeeklyReport = async (req, res) => {
  try {
    const {
      class_id,
      class_name,
      week
    } = req.body;

    if (!class_name || !week) {
      return res.status(400).json({
        message: "Class and week are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Handwriting Report document is required"
      });
    }

    const filePath = getUploadedFilePath(req.file);
    const originalName = req.file.originalname;

    const reportType = "Handwriting Report";
    const title = `Handwriting Report - ${week}`;

    const [result] = await db.query(
      `INSERT INTO weekly_reports
       (teacher_id, class_id, class_name, report_type, week, title,
        activities, learner_participation, progress, challenges,
        interventions, file_path, file_original_name, status)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, 'Pending')`,
      [
        req.user.id,
        class_id || null,
        class_name,
        reportType,
        week,
        title,
        filePath,
        originalName
      ]
    );

    res.status(201).json({
      message: "Handwriting Report uploaded successfully",
      weekly_report_id: result.insertId
    });
  } catch (error) {
    console.error("Create handwriting report error:", error);

    res.status(500).json({
      message: "Failed to upload Handwriting Report",
      error: error.message
    });
  }
};


exports.getWeeklyReports = async (req, res) => {
  try {
    const { status, teacher_id, class_name, report_type, week } = req.query;

    const where = [];
    const params = [];

    if (status) {
      where.push("status = ?");
      params.push(status);
    }

    if (teacher_id) {
      where.push("teacher_id = ?");
      params.push(teacher_id);
    }

    if (class_name) {
      where.push("class_name = ?");
      params.push(class_name);
    }

    if (report_type) {
      where.push("report_type = ?");
      params.push(report_type);
    }

    if (week) {
      where.push("week = ?");
      params.push(week);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT *
       FROM weekly_reports
       ${whereSql}
       ORDER BY created_at DESC`,
      params
    );

    res.json({
      message: "Weekly reports loaded successfully",
      weekly_reports: rows
    });
  } catch (error) {
    console.error("Get weekly reports error:", error);
    res.status(500).json({
      message: "Failed to load weekly reports",
      error: error.message
    });
  }
};

exports.getMyWeeklyReports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM weekly_reports
       WHERE teacher_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: "My weekly reports loaded successfully",
      weekly_reports: rows
    });
  } catch (error) {
    console.error("Get my weekly reports error:", error);
    res.status(500).json({
      message: "Failed to load your weekly reports",
      error: error.message
    });
  }
};

exports.reviewWeeklyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_comment } = req.body;

    await db.query(
      `UPDATE weekly_reports
       SET status = 'Reviewed', admin_comment = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [admin_comment || null, req.user.id || null, id]
    );

    res.json({
      message: "Weekly report marked as reviewed successfully"
    });
  } catch (error) {
    console.error("Review weekly report error:", error);
    res.status(500).json({
      message: "Failed to review weekly report",
      error: error.message
    });
  }
};
