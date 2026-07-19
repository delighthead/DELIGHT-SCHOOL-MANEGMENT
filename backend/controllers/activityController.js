const db = require("../config/database");

// Get recent activities, optionally by branch
exports.getActivities = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `SELECT
        activity_logs.id,
        activity_logs.branch_id,
        branches.branch_name,
        activity_logs.user_id,
        users.full_name AS user_name,
        activity_logs.action,
        activity_logs.module,
        activity_logs.description,
        activity_logs.created_at
      FROM activity_logs
      LEFT JOIN branches ON activity_logs.branch_id = branches.id
      LEFT JOIN users ON activity_logs.user_id = users.id`;

    const params = [];

    if (branch_id) {
      sql += " WHERE activity_logs.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY activity_logs.created_at DESC LIMIT 100";

    const [activities] = await db.query(sql, params);

    res.json({
      message: "Activities retrieved successfully",
      activities
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve activities",
      error: error.message
    });
  }
};

// Add activity manually/system
exports.createActivity = async (req, res) => {
  try {
    const {
      branch_id,
      user_id,
      action,
      module,
      description
    } = req.body;

    if (!action || !module || !description) {
      return res.status(400).json({
        message: "Action, module, and description are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        branch_id || null,
        user_id || null,
        action,
        module,
        description
      ]
    );

    res.status(201).json({
      message: "Activity logged successfully",
      activity_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to log activity",
      error: error.message
    });
  }
};

// Update activity record
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branch_id,
      action,
      module,
      description
    } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Activity ID is required"
      });
    }

    const [existingRows] = await db.query(
      "SELECT id, branch_id FROM activity_logs WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    const existing = existingRows[0];

    if (
      req.user &&
      req.user.role === "branch_admin" &&
      Number(existing.branch_id) !== Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message: "You can only edit activities in your own branch"
      });
    }

    const fields = [];
    const values = [];

    if (module !== undefined) {
      fields.push("module = ?");
      values.push(module);
    }

    if (action !== undefined) {
      fields.push("action = ?");
      values.push(action);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }

    if (branch_id !== undefined && req.user && req.user.role !== "branch_admin") {
      fields.push("branch_id = ?");
      values.push(branch_id || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: "No activity fields provided for update"
      });
    }

    values.push(id);

    await db.query(
      `UPDATE activity_logs SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    res.json({
      message: "Activity updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update activity",
      error: error.message
    });
  }
};
