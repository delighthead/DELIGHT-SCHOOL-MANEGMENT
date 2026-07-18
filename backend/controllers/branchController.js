const db = require("../config/database");

exports.getBranches = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === "true";

    const [branches] = await db.query(
      includeInactive
        ? "SELECT id, branch_name, location, phone, email, address, status FROM branches ORDER BY branch_name"
        : "SELECT id, branch_name, location, phone, email, address, status FROM branches WHERE status = 'active' ORDER BY branch_name"
    );

    res.json({
      message: "Branches retrieved successfully",
      branches
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve branches",
      error: error.message
    });
  }
};

exports.createBranch = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({
        message: "Only super admin can create branches"
      });
    }

    const {
      branch_name,
      location,
      phone,
      email,
      address,
      status
    } = req.body;

    if (!branch_name || !String(branch_name).trim()) {
      return res.status(400).json({
        message: "Branch name is required"
      });
    }

    const cleanName = String(branch_name).trim();
    const cleanStatus = status === "inactive" ? "inactive" : "active";

    const [existing] = await db.query(
      "SELECT id FROM branches WHERE UPPER(branch_name) = UPPER(?) LIMIT 1",
      [cleanName]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "A branch with this name already exists"
      });
    }

    const [result] = await db.query(
      `INSERT INTO branches
      (branch_name, location, phone, email, address, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cleanName,
        location ? String(location).trim() : null,
        phone ? String(phone).trim() : null,
        email ? String(email).trim() : null,
        address ? String(address).trim() : null,
        cleanStatus
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        result.insertId,
        req.user.id,
        "Branch Created",
        "Branches",
        `Created branch ${cleanName}.`
      ]
    );

    res.status(201).json({
      message: "Branch created successfully",
      branch_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create branch",
      error: error.message
    });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({
        message: "Only super admin can edit branches"
      });
    }

    const { id } = req.params;
    const {
      branch_name,
      location,
      phone,
      email,
      address,
      status
    } = req.body;

    if (!branch_name || !String(branch_name).trim()) {
      return res.status(400).json({
        message: "Branch name is required"
      });
    }

    const [existing] = await db.query(
      "SELECT id, branch_name FROM branches WHERE id = ? LIMIT 1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Branch not found"
      });
    }

    const cleanName = String(branch_name).trim();
    const cleanStatus = status === "inactive" ? "inactive" : "active";

    const [duplicate] = await db.query(
      "SELECT id FROM branches WHERE UPPER(branch_name) = UPPER(?) AND id <> ? LIMIT 1",
      [cleanName, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message: "A branch with this name already exists"
      });
    }

    await db.query(
      `UPDATE branches
       SET branch_name = ?,
           location = ?,
           phone = ?,
           email = ?,
           address = ?,
           status = ?
       WHERE id = ?`,
      [
        cleanName,
        location ? String(location).trim() : null,
        phone ? String(phone).trim() : null,
        email ? String(email).trim() : null,
        address ? String(address).trim() : null,
        cleanStatus,
        id
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        "Branch Updated",
        "Branches",
        `Updated branch ${cleanName}.`
      ]
    );

    res.json({
      message: "Branch updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update branch",
      error: error.message
    });
  }
};
