const db = require("../config/database");
const { sendReviewNotification } = require("../utils/reviewNotificationEmail");

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
    const {
      status,
      teacher_id,
      class_name,
      report_type,
      week
    } = req.query;

    const where = [];
    const params = [];

    if (status) {
      where.push("wr.status = ?");
      params.push(status);
    }

    if (teacher_id) {
      where.push("wr.teacher_id = ?");
      params.push(teacher_id);
    }

    if (class_name) {
      where.push("wr.class_name = ?");
      params.push(class_name);
    }

    if (report_type) {
      where.push("wr.report_type = ?");
      params.push(report_type);
    }

    if (week) {
      where.push("wr.week = ?");
      params.push(week);
    }

    // Branch-scoped admins must only see submissions
    // belonging to teachers in their authenticated branch.
    if (
      req.user &&
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "No branch is assigned to this administrator"
        });
      }

      where.push("t.branch_id = ?");
      params.push(req.user.branch_id);
    }

    const whereSql =
      where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
         wr.*,
         COALESCE(t.full_name, u.full_name, 'Unknown Teacher') AS teacher_name,
         t.teacher_id AS teacher_code,
         t.branch_id
       FROM weekly_reports wr
       LEFT JOIN teachers t ON t.user_id = wr.teacher_id
       LEFT JOIN users u ON u.id = wr.teacher_id
       ${whereSql}
       ORDER BY wr.created_at DESC`,
      params
    );

    res.json({
      message: "Handwriting Reports loaded successfully",
      weekly_reports: rows
    });
  } catch (error) {
    console.error("Get Handwriting Reports error:", error);

    res.status(500).json({
      message: "Failed to load Handwriting Reports",
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

    const [rows] = await db.query(
      `SELECT
         wr.id,
         wr.teacher_id,
         wr.class_name,
         wr.week,
         t.full_name AS teacher_name,
         t.email AS teacher_email,
         t.branch_id
       FROM weekly_reports wr
       LEFT JOIN teachers t ON t.user_id = wr.teacher_id
       WHERE wr.id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Handwriting Report not found"
      });
    }

    const submission = rows[0];

    if (
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      if (
        !req.user.branch_id ||
        Number(submission.branch_id) !== Number(req.user.branch_id)
      ) {
        return res.status(403).json({
          message: "You can only review submissions from your own branch"
        });
      }
    }

    const [result] = await db.query(
      `UPDATE weekly_reports
       SET status = 'Reviewed',
           admin_comment = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [admin_comment || null, req.user.id || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Handwriting Report not found"
      });
    }

    let emailNotification = "not_sent";

    if (submission.teacher_email) {
      try {
        await sendReviewNotification({
          teacherEmail: submission.teacher_email,
          teacherName: submission.teacher_name,
          submissionType: "Handwriting Report",
          className: submission.class_name,
          week: submission.week,
          status: "Reviewed",
          adminComment: admin_comment
        });

        emailNotification = "sent";
      } catch (emailError) {
        emailNotification = "failed";
        console.error(
          "Handwriting Report review email failed:",
          emailError.message
        );
      }
    } else {
      emailNotification = "no_teacher_email";
      console.warn(
        `Handwriting Report ${id}: teacher has no email address`
      );
    }

    res.json({
      message: "Handwriting Report marked as reviewed successfully",
      email_notification: emailNotification
    });
  } catch (error) {
    console.error("Review handwriting report error:", error);

    res.status(500).json({
      message: "Failed to review Handwriting Report",
      error: error.message
    });
  }
};
