const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password, and role are required"
      });
    }

    let allowedRoles = [];

    if (role === "admin") {
      allowedRoles = ["super_admin", "branch_admin", "admin", "teacher_admin"];
    } else if (role === "teacher") {
      allowedRoles = ["teacher", "teacher_admin"];
    } else if (role === "parent") {
      allowedRoles = ["parent"];
    } else {
      return res.status(400).json({
        message: "Unknown user role"
      });
    }

    const placeholders = allowedRoles.map(() => "?").join(",");

    const [users] = await db.query(
      `SELECT id, branch_id, full_name, username, password, role, status
       FROM users
       WHERE username = ?
         AND role IN (${placeholders})
       LIMIT 1`,
      [username, ...allowedRoles]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid login details"
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: `Access denied. Account is ${user.status}. Please contact the school administrator.`
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid login details"
      });
    }

    if (user.role === "teacher") {
      const [teacherRows] = await db.query(
        "SELECT status FROM teachers WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
        [user.id, user.username]
      );

      if (teacherRows.length === 0) {
        return res.status(403).json({
          message: "Access denied. Teacher profile not found."
        });
      }

      if (teacherRows[0].status !== "active") {
        return res.status(403).json({
          message: `Access denied. Teacher account is ${teacherRows[0].status}. Please contact the school administrator.`
        });
      }
    }

    if (user.role === "parent") {
      const [parentRows] = await db.query(
        "SELECT id, status FROM parents WHERE user_id = ? OR ghana_card_number = ? LIMIT 1",
        [user.id, user.username]
      );

      if (parentRows.length === 0) {
        return res.status(403).json({
          message: "Access denied. Parent profile not found."
        });
      }

      const parentId = parentRows[0].id;

      if (String(parentRows[0].status || "").toLowerCase() !== "active") {
        return res.status(403).json({
          message: `Access denied. Parent account is ${parentRows[0].status}. Please contact the school administrator.`
        });
      }

      const [activeChildren] = await db.query(
        `SELECT students.id
         FROM parent_student_links
         JOIN students ON parent_student_links.student_id = students.id
         WHERE parent_student_links.parent_id = ?
           AND students.status = 'active'
         LIMIT 1`,
        [parentId]
      );

      if (activeChildren.length === 0) {
        return res.status(403).json({
          message: "Access denied. You have no active child linked to this account."
        });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        branch_id: user.branch_id,
        username: user.username
      },
      process.env.JWT_SECRET || "delight_school_secret",
      { expiresIn: "24h" }
    );

    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [user.id]
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
};

// Verify account for forgot password
exports.verifyForgotPassword = async (req, res) => {
  try {
    const { username, role, phone } = req.body;

    if (!username || !role || !phone) {
      return res.status(400).json({
        message: "Ghana Card, role, and phone number are required"
      });
    }

    const [users] = await db.query(
      `SELECT id, full_name, username, role, phone, status
       FROM users
       WHERE username = ?
         AND role = ?
         AND phone = ?
       LIMIT 1`,
      [username, role, phone]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "Account not found or phone number does not match"
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: `Account is ${user.status}. Please contact the school administrator.`
      });
    }

    res.json({
      message: "Account verified successfully",
      user_id: user.id,
      full_name: user.full_name
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify account",
      error: error.message
    });
  }
};

// Reset password after account verification
exports.resetForgotPassword = async (req, res) => {
  try {
    const { user_id, new_password, confirm_password } = req.body;

    if (!user_id || !new_password || !confirm_password) {
      return res.status(400).json({
        message: "User ID, new password, and confirm password are required"
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, user_id]
    );

    res.json({
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reset password",
      error: error.message
    });
  }
};
