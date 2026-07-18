const db = require("../config/database");

// Get announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `SELECT
        announcements.id,
        announcements.branch_id,
        COALESCE(branches.branch_name, 'All Branches') AS branch_name,
        announcements.title,
        announcements.message,
        announcements.audience,
        announcements.created_at
      FROM announcements
      LEFT JOIN branches ON announcements.branch_id = branches.id`;

    const params = [];

    if (branch_id) {
      sql += " WHERE announcements.branch_id = ? OR announcements.branch_id IS NULL";
      params.push(branch_id);
    }

    sql += " ORDER BY announcements.created_at DESC";

    const [announcements] = await db.query(sql, params);

    res.json({
      message: "Announcements retrieved successfully",
      announcements
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve announcements",
      error: error.message
    });
  }
};

// Add announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { branch_id, title, message, audience } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message are required"
      });
    }

    const finalBranchId = branch_id || null;

    const [result] = await db.query(
      `INSERT INTO announcements
      (branch_id, title, message, audience)
      VALUES (?, ?, ?, ?)`,
      [
        finalBranchId,
        title,
        message,
        audience || "all"
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        finalBranchId,
        req.user ? req.user.id : null,
        "Announcement Posted",
        "Announcements",
        `Posted announcement: ${title}.`
      ]
    );

    res.status(201).json({
      message: "Announcement added successfully",
      announcement_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add announcement",
      error: error.message
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM announcements WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    res.json({
      message: "Announcement deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete announcement",
      error: error.message
    });
  }
};

// Get announcements for logged-in parent
exports.getParentAnnouncements = async (req, res) => {
  try {
    const [parents] = await db.query(
      "SELECT branch_id FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
      [req.user.id, req.user.username]
    );

    if (parents.length === 0) {
      return res.status(404).json({
        message: "Parent profile not found"
      });
    }

    const parentBranchId = parents[0].branch_id || req.user.branch_id;

    const [announcements] = await db.query(
      `SELECT
        announcements.id,
        announcements.branch_id,
        branches.branch_name,
        announcements.title,
        announcements.message,
        announcements.audience,
        announcements.created_at
      FROM announcements
      LEFT JOIN branches ON announcements.branch_id = branches.id
      WHERE (announcements.branch_id = ? OR announcements.branch_id IS NULL)
        AND (announcements.audience = 'parent'
             OR announcements.audience = 'parents'
             OR announcements.audience = 'everyone'
             OR announcements.audience = 'all')
      ORDER BY announcements.created_at DESC`,
      [parentBranchId]
    );

    res.json({
      message: "Parent announcements retrieved successfully",
      announcements
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parent announcements",
      error: error.message
    });
  }
};
