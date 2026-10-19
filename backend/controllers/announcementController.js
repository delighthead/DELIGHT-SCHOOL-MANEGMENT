const db = require("../config/database");
const { getAnnouncementBranchIds } = require("../utils/announcementBranches");
const {
  sendSms,
  normalizeGhanaPhone
} = require("../utils/mnotifySms");

function isBranchScopedAdmin(user) {
  if (!user) return false;
  return ["branch_admin", "teacher_admin", "admin"].includes(user.role);
}

// Get announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const { schoolBranchIds } = await getAnnouncementBranchIds();
    const { branch_id } = req.query;

    // Enforce announcement branch access for legacy administrators.
    if (
      isBranchScopedAdmin(req.user) &&
      (
        !req.user.branch_id ||
        Number(branch_id) !== Number(req.user.branch_id)
      )
    ) {
      return res.status(403).json({
        message: "You cannot view announcements outside your branch."
      });
    }

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
      // School-wide announcements belong to Kotobabi and Ofankor only.
      if (schoolBranchIds.includes(Number(branch_id))) {
        sql += ` WHERE (
          announcements.branch_id = ?
          OR announcements.branch_id IS NULL
        )`;
      } else {
        // Other branches must not receive school-wide announcements.
        sql += " WHERE announcements.branch_id = ?";
      }

      params.push(branch_id);
    } else if (req.user?.role !== "super_admin") {
      // Only the Super Admin may retrieve announcements across branches.
      return res.status(403).json({
        message: "Branch selection is required."
      });
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
    const { schoolBranchIds } = await getAnnouncementBranchIds();
    const { branch_id, title, message, audience } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message are required"
      });
    }

    const requestedBranchId = req.requestedAnnouncementBranchId;

    // Reject cross-branch or school-wide requests from branch administrators.
    if (
      isBranchScopedAdmin(req.user) &&
      (
        requestedBranchId === null ||
        Number(requestedBranchId) !== Number(req.user.branch_id)
      )
    ) {
      return res.status(403).json({
        message: "You cannot publish announcements outside your branch."
      });
    }

    const finalBranchId = branch_id || null;
    const finalAudience = String(audience || "all")
      .trim()
      .toLowerCase();

    // Only supported announcement audiences may be published.
    const allowedAudiences = ["teachers", "parents", "all"];

    if (!allowedAudiences.includes(finalAudience)) {
      return res.status(400).json({
        message: "Invalid announcement audience."
      });
    }

    // Parent-only announcements must target Kotobabi or Ofankor.
    if (
      finalAudience === "parents" &&
      !schoolBranchIds.includes(Number(finalBranchId))
    ) {
      return res.status(400).json({
        message: "Select a valid parent branch."
      });
    }

    // Teachers Only and everyone are school-wide announcements.
    if (
      ["teachers", "all"].includes(finalAudience) &&
      finalBranchId !== null
    ) {
      return res.status(400).json({
        message: "This audience must target both branches."
      });
    }

    // Only the Super Admin can publish school-wide announcements.
    if (
      finalBranchId === null &&
      req.user?.role !== "super_admin"
    ) {
      return res.status(403).json({
        message: "Only the Super Admin can publish school-wide announcements."
      });
    }

    // Branch administrators cannot publish outside their branch.
    if (
      isBranchScopedAdmin(req.user) &&
      Number(finalBranchId) !== Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message: "You cannot publish announcements outside your branch."
      });
    }

    const [result] = await db.query(
      `INSERT INTO announcements
      (branch_id, title, message, audience)
      VALUES (?, ?, ?, ?)`,
      [
        finalBranchId,
        title,
        message,
        finalAudience
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

    let smsStatus = "not_sent";
    let smsRecipientCount = 0;

    try {
      const recipients = [];

      // ----------------------------------------------------
      // Teachers
      // ----------------------------------------------------
      if (
        finalAudience === "teachers" ||
        finalAudience === "teacher" ||
        finalAudience === "all" ||
        finalAudience === "everyone"
      ) {
        let teacherSql = `
          SELECT phone
          FROM teachers
          WHERE status = 'active'
            AND phone IS NOT NULL
            AND TRIM(phone) <> ''
        `;

        const teacherParams = [];

        if (finalBranchId) {
          teacherSql += " AND branch_id = ?";
          teacherParams.push(finalBranchId);
        } else {
          // School-wide announcements target Kotobabi and Ofankor only.
          teacherSql += " AND branch_id IN (?, ?)";
          teacherParams.push(...schoolBranchIds);
        }

        const [teacherRows] = await db.query(
          teacherSql,
          teacherParams
        );

        teacherRows.forEach((teacher) => {
          if (teacher.phone) recipients.push(teacher.phone);
        });
      }

      // ----------------------------------------------------
      // Parents
      // ----------------------------------------------------
      if (
        finalAudience === "parents" ||
        finalAudience === "parent" ||
        finalAudience === "all" ||
        finalAudience === "everyone"
      ) {
        let parentSql = `
          SELECT phone
          FROM parents
          WHERE status = 'active'
            AND phone IS NOT NULL
            AND TRIM(phone) <> ''
        `;

        const parentParams = [];

        if (finalBranchId) {
          parentSql += " AND branch_id = ?";
          parentParams.push(finalBranchId);
        } else {
          // School-wide announcements target Kotobabi and Ofankor only.
          parentSql += " AND branch_id IN (?, ?)";
          parentParams.push(...schoolBranchIds);
        }

        const [parentRows] = await db.query(
          parentSql,
          parentParams
        );

        parentRows.forEach((parent) => {
          if (parent.phone) recipients.push(parent.phone);
        });
      }

      // Students audience intentionally does not send SMS.
      if (
        finalAudience === "students" ||
        finalAudience === "student"
      ) {
        smsStatus = "not_applicable";
      } else if (recipients.length === 0) {
        smsStatus = "skipped";
      } else {
        const smsMessage =
          `${String(title).trim()}: ${String(message).trim()} ` +
          `- https://delightintschool.com/pages/login.html`;

        const smsResult = await sendSms({
          recipients,
          message: smsMessage
        });

        if (smsResult && smsResult.skipped) {
          smsStatus = "skipped";
        } else {
          smsStatus = "sent";

          // sendSms() already removes duplicate phone numbers.
          // This count is an informational local count only.
          smsRecipientCount = [
            ...new Set(
              recipients
                .map(normalizeGhanaPhone)
                .filter(Boolean)
            )
          ].length;
        }
      }
    } catch (smsError) {
      console.error(
        "Announcement SMS failed:",
        smsError.message
      );

      smsStatus = "failed";
    }

    res.status(201).json({
      message: "Announcement added successfully",
      announcement_id: result.insertId,
      sms_status: smsStatus,
      sms_recipient_count: smsRecipientCount
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

    const [announcementRows] = await db.query(
      "SELECT id, branch_id FROM announcements WHERE id = ? LIMIT 1",
      [id]
    );

    if (announcementRows.length === 0) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    const announcement = announcementRows[0];

    if (
      isBranchScopedAdmin(req.user) &&
      Number(announcement.branch_id) !== Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message: "You can only delete announcements in your own branch"
      });
    }

    const [result] = await db.query(
      "DELETE FROM announcements WHERE id = ?",
      [id]
    );

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
    const { schoolBranchIds } = await getAnnouncementBranchIds();
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
      WHERE (
          (
            announcements.branch_id = ?
            AND announcements.audience IN ('parent', 'parents', 'all')
          )
          OR (
            ? IN (?, ?)
            AND announcements.branch_id IS NULL
            AND announcements.audience IN ('all', 'everyone', 'parents', 'parent')
          )
        )
      ORDER BY announcements.created_at DESC`,
      [parentBranchId, parentBranchId, ...schoolBranchIds]
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
