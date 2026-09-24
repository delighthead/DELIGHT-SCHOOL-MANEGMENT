const db = require("../config/database");

exports.getControls = async (req, res) => {
  try {
    let branchId = req.query.branch_id;

    if (
      req.user &&
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      branchId = req.user.branch_id;
    }

    const params = [];
    const conditions = ["b.status = 'active'"];

    if (branchId) {
      conditions.push("b.id = ?");
      params.push(branchId);
    }

    const whereSql =
      `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT
         b.id AS branch_id,
         b.branch_name,
         COALESCE(h.is_open, 0) AS is_open,
         h.updated_by,
         h.updated_at
       FROM branches b
       LEFT JOIN handwriting_submission_controls h
         ON h.branch_id = b.id
       ${whereSql}
       ORDER BY b.branch_name`,
      params
    );

    res.json({
      message: "Handwriting submission controls loaded successfully",
      controls: rows
    });
  } catch (error) {
    console.error("Get handwriting controls error:", error);
    res.status(500).json({
      message: "Failed to load Handwriting Report submission controls",
      error: error.message
    });
  }
};

exports.updateControl = async (req, res) => {
  try {
    let branchId = req.body.branch_id;
    const isOpen =
      req.body.is_open === true ||
      req.body.is_open === 1 ||
      req.body.is_open === "1";

    if (
      req.user &&
      ["branch_admin", "teacher_admin"].includes(req.user.role)
    ) {
      branchId = req.user.branch_id;
    }

    if (!branchId) {
      return res.status(400).json({
        message: "Branch is required"
      });
    }

    const [branches] = await db.query(
      "SELECT id, branch_name FROM branches WHERE id = ? LIMIT 1",
      [branchId]
    );

    if (!branches.length) {
      return res.status(404).json({
        message: "Branch not found"
      });
    }

    await db.query(
      `INSERT INTO handwriting_submission_controls
         (branch_id, is_open, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_open = VALUES(is_open),
         updated_by = VALUES(updated_by),
         updated_at = CURRENT_TIMESTAMP`,
      [branchId, isOpen ? 1 : 0, req.user.id || null]
    );

    res.json({
      message: isOpen
        ? "Handwriting Report submission opened successfully"
        : "Handwriting Report submission locked successfully",
      branch_id: Number(branchId),
      is_open: isOpen
    });
  } catch (error) {
    console.error("Update handwriting control error:", error);
    res.status(500).json({
      message: "Failed to update Handwriting Report submission control",
      error: error.message
    });
  }
};

exports.getMyControl = async (req, res) => {
  try {
    if (!req.user || !req.user.branch_id) {
      return res.status(403).json({
        message: "No branch is assigned to this account"
      });
    }

    const [rows] = await db.query(
      `SELECT
         b.id AS branch_id,
         b.branch_name,
         COALESCE(h.is_open, 0) AS is_open,
         h.updated_at
       FROM branches b
       LEFT JOIN handwriting_submission_controls h
         ON h.branch_id = b.id
       WHERE b.id = ?
       LIMIT 1`,
      [req.user.branch_id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Branch not found"
      });
    }

    res.json({
      message: "Handwriting submission status loaded successfully",
      control: rows[0]
    });
  } catch (error) {
    console.error("Get my handwriting control error:", error);
    res.status(500).json({
      message: "Failed to load Handwriting Report submission status",
      error: error.message
    });
  }
};
