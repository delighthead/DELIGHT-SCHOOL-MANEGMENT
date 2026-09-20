const db = require("../config/database");

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
    const { status, teacher_id, class_name, subject, week } = req.query;

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

    if (subject) {
      where.push("subject = ?");
      params.push(subject);
    }

    if (week) {
      where.push("week = ?");
      params.push(week);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT *
       FROM lesson_plans
       ${whereSql}
       ORDER BY created_at DESC`,
      params
    );

    res.json({
      message: "Lesson plans loaded successfully",
      lesson_plans: rows
    });
  } catch (error) {
    console.error("Get lesson plans error:", error);
    res.status(500).json({
      message: "Failed to load lesson plans",
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

    await db.query(
      `UPDATE lesson_plans
       SET status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, admin_comment || null, req.user.id || null, id]
    );

    res.json({
      message: `Lesson plan ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error("Review lesson plan error:", error);
    res.status(500).json({
      message: "Failed to review lesson plan",
      error: error.message
    });
  }
};
