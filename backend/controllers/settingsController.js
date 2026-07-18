const db = require("../config/database");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

async function ensureSettingsRow() {
  const [rows] = await db.query("SELECT id FROM settings WHERE id = 1");

  if (rows.length === 0) {
    await db.query(
      "INSERT INTO settings (id, school_name) VALUES (1, ?)",
      ["Delight International School"]
    );
  }
}

exports.getSettings = async (req, res) => {
  try {
    await ensureSettingsRow();

    const [rows] = await db.query("SELECT * FROM settings WHERE id = 1");

    res.json({
      message: "Settings retrieved successfully",
      settings: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve settings",
      error: error.message
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    await ensureSettingsRow();

    const allowedFields = [
      "school_name",
      "school_motto",
      "school_phone",
      "school_email",
      "school_address",
      "academic_year",
      "current_term",
      "assessment_max_score",
      "examination_max_score",
      "total_max_score",
      "pass_mark",
      "default_username",
      "default_password",
      "allow_password_reset",
      "lock_after_attempts",
      "grade_a_min",
      "grade_a_max",
      "grade_a_remark",
      "grade_b_min",
      "grade_b_max",
      "grade_b_remark",
      "grade_c_min",
      "grade_c_max",
      "grade_c_remark",
      "grade_d_min",
      "grade_d_max",
      "grade_d_remark",
      "grade_f_min",
      "grade_f_max",
      "grade_f_remark"
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        message: "No settings provided to update"
      });
    }

    values.push(1);

    await db.query(
      `UPDATE settings SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.json({
      message: "Settings updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update settings",
      error: error.message
    });
  }
};

exports.uploadSchoolLogo = async (req, res) => {
  try {
    await ensureSettingsRow();

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a logo image"
      });
    }

    const logoPath = `/uploads/logo/${req.file.filename}`;

    await db.query(
      "UPDATE settings SET school_logo = ? WHERE id = 1",
      [logoPath]
    );

    res.json({
      message: "School logo uploaded successfully",
      school_logo: logoPath
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload school logo",
      error: error.message
    });
  }
};

exports.backupDatabase = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, "..", "backups");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `delight_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
    const filePath = path.join(backupDir, fileName);

    const command = `mysqldump --no-tablespaces -u delight_user -pdelight123 delight_school_management > "${filePath}"`;

    exec(command, (error) => {
      if (error) {
        return res.status(500).json({
          message: "Database backup failed",
          error: error.message
        });
      }

      res.json({
        message: "Database backup completed successfully",
        file: fileName,
        path: `/backups/${fileName}`
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Database backup failed",
      error: error.message
    });
  }
};

// Restore database from uploaded SQL backup
exports.restoreDatabase = async (req, res) => {
  const { exec } = require("child_process");
  const fs = require("fs");

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a .sql backup file"
      });
    }

    if (!req.file.originalname.toLowerCase().endsWith(".sql")) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message: "Only .sql backup files are allowed"
      });
    }

    const filePath = req.file.path;

    const command = `mysql -u delight_user -pdelight123 delight_school_management < "${filePath}"`;

    exec(command, (error) => {
      if (error) {
        return res.status(500).json({
          message: "Database restore failed",
          error: error.message
        });
      }

      res.json({
        message: "Database restored successfully"
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Database restore failed",
      error: error.message
    });
  }
};
