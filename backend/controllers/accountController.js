const db = require("../config/database");

// Get user accounts, optionally by branch
exports.getAccounts = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `SELECT
        users.id,
        users.branch_id,
        branches.branch_name,
        users.full_name,
        users.username,
        users.role,
        users.phone,
        users.email,
        users.status,
        users.created_at
      FROM users
      LEFT JOIN branches ON users.branch_id = branches.id`;

    const params = [];

    if (branch_id) {
      sql += " WHERE users.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY users.id DESC";

    const [accounts] = await db.query(sql, params);

    res.json({
      message: "Accounts retrieved successfully",
      accounts
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve accounts",
      error: error.message
    });
  }
};

// Update account status
exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["active", "inactive", "locked", "disabled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid account status"
      });
    }

    const [accounts] = await db.query(
      `SELECT id, branch_id, username, full_name, role, status
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    const account = accounts[0];

    if (req.user.role === "branch_admin" && Number(account.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only manage accounts in your own branch"
      });
    }

    await db.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, id]
    );

    if (account.role === "teacher") {
      await db.query(
        "UPDATE teachers SET status = ? WHERE user_id = ? OR ghana_card_number = ?",
        [status, id, account.username]
      );
    }

    if (account.role === "parent") {
      await db.query(
        "UPDATE parents SET status = ? WHERE user_id = ? OR ghana_card_number = ?",
        [status, id, account.username]
      );
    }

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        account.branch_id,
        req.user ? req.user.id : null,
        "Account Status Updated",
        "Accounts",
        `${account.full_name} account changed to ${status}.`
      ]
    );

    res.json({
      message: "Account status updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update account status",
      error: error.message
    });
  }
};
