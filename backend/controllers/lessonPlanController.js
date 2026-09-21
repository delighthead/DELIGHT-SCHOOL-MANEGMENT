const db = require("../config/database");
const { sendReviewNotification } = require("../utils/reviewNotificationEmail");

function getUploadedFilePath(file) {
  if (!file) return null;
  return `/uploads/lesson-plans/${file.filename}`;
}

exports.createLessonPlan = async (req, res) => {
  try {
    const {
      class_id,
      class_name,
      subject,
      week
    } = req.body;

    if (!class_name || !subject || !week) {
      return res.status(400).json({
        message: "Class, subject and week are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Lesson Note document is required"
      });
    }

    const filePath = getUploadedFilePath(req.file);
    const originalName = req.file.originalname;

    const [result] = await db.query(
      `INSERT INTO lesson_plans
       (teacher_id, class_id, class_name, subject, week, topic,
        objectives, resources, file_path, file_original_name, status)
       VALUES (?, ?, ?, ?, ?, 'Lesson Note', NULL, NULL, ?, ?, 'Pending')`,
      [
        req.user.id,
        class_id || null,
        class_name,
        subject,
        week,
        filePath,
        originalName
      ]
    );

    res.status(201).json({
      message: "Lesson Note uploaded successfully",
      lesson_plan_id: result.insertId
    });
  } catch (error) {
    console.error("Create lesson note error:", error);

    res.status(500).json({
      message: "Failed to upload Lesson Note",
      error: error.message
    });
  }
};


exports.getLessonPlans = async (req, res) => {
  try {
    const {
      status,
      teacher_id,
      class_name,
      subject,
      week
    } = req.query;

    const where = [];
    const params = [];

    if (status) {
      where.push("lp.status = ?");
      params.push(status);
    }

    if (teacher_id) {
      where.push("lp.teacher_id = ?");
      params.push(teacher_id);
    }

    if (class_name) {
      where.push("lp.class_name = ?");
      params.push(class_name);
    }

    if (subject) {
      where.push("lp.subject = ?");
      params.push(subject);
    }

    if (week) {
      where.push("lp.week = ?");
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
         lp.*,
         COALESCE(t.full_name, u.full_name, 'Unknown Teacher') AS teacher_name,
         t.teacher_id AS teacher_code,
         t.branch_id
       FROM lesson_plans lp
       LEFT JOIN teachers t ON t.user_id = lp.teacher_id
       LEFT JOIN users u ON u.id = lp.teacher_id
       ${whereSql}
       ORDER BY lp.created_at DESC`,
      params
    );

    res.json({
      message: "Lesson Notes loaded successfully",
      lesson_plans: rows
    });
  } catch (error) {
    console.error("Get Lesson Notes error:", error);

    res.status(500).json({
      message: "Failed to load Lesson Notes",
      error: error.message
    });
  }
};


exports.getMyLessonPlans = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM lesson_plans
       WHERE teacher_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: "My lesson plans loaded successfully",
      lesson_plans: rows
    });
  } catch (error) {
    console.error("Get my lesson plans error:", error);
    res.status(500).json({
      message: "Failed to load your lesson plans",
      error: error.message
    });
  }
};

exports.reviewLessonPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected"
      });
    }

    const [rows] = await db.query(
      `SELECT
         lp.id,
         lp.teacher_id,
         lp.class_name,
         lp.subject,
         lp.week,
         t.full_name AS teacher_name,
         t.email AS teacher_email,
         t.branch_id
       FROM lesson_plans lp
       LEFT JOIN teachers t ON t.user_id = lp.teacher_id
       WHERE lp.id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Lesson Note not found"
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
      `UPDATE lesson_plans
       SET status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, admin_comment || null, req.user.id || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Lesson Note not found"
      });
    }

    let emailNotification = "not_sent";

    if (submission.teacher_email) {
      try {
        await sendReviewNotification({
          teacherEmail: submission.teacher_email,
          teacherName: submission.teacher_name,
          submissionType: "Lesson Note",
          className: submission.class_name,
          subject: submission.subject,
          week: submission.week,
          status,
          adminComment: admin_comment
        });

        emailNotification = "sent";
      } catch (emailError) {
        emailNotification = "failed";
        console.error(
          "Lesson Note review email failed:",
          emailError.message
        );
      }
    } else {
      emailNotification = "no_teacher_email";
      console.warn(
        `Lesson Note ${id}: teacher has no email address`
      );
    }

    res.json({
      message: `Lesson Note ${status.toLowerCase()} successfully`,
      email_notification: emailNotification
    });
  } catch (error) {
    console.error("Review lesson note error:", error);

    res.status(500).json({
      message: "Failed to review Lesson Note",
      error: error.message
    });
  }
};
