const db = require("../config/database");

function getLoggedInUserId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    req.user?.user_id ||
    req.user?.uid
  );
}

exports.getMyProfile = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User ID not found in login token",
        tokenUser: req.user
      });
    }

    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.username,
          u.full_name,
          u.role,
          u.phone,
          u.email,
          u.status,
          u.branch_id,
          u.profile_picture,
          b.branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    const profile = rows[0];

    res.json({
      message: "Profile loaded successfully",
      profile: {
        id: profile.id,
        username: profile.username || "",
        full_name: profile.full_name || profile.username || "Admin",
        role: profile.role || "",
        phone: profile.phone || "",
        email: profile.email || "",
        status: profile.status || "",
        branch_id: profile.branch_id || "",
        branch_name: profile.branch_name || "All Branches",
        profile_picture: profile.profile_picture || ""
      }
    });
  } catch (error) {
    console.error("Admin profile load error:", error);
    res.status(500).json({
      message: "Failed to load profile",
      error: error.message
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User ID not found in login token",
        tokenUser: req.user
      });
    }

    const phone = req.body.phone || "";
    const email = req.body.email || "";

    let profilePicture = "";

    if (req.file) {
      profilePicture = "/uploads/admins/" + req.file.filename;
    }

    if (profilePicture) {
      await db.query(
        `UPDATE users
         SET phone = ?, email = ?, profile_picture = ?
         WHERE id = ?`,
        [phone, email, profilePicture, userId]
      );
    } else {
      await db.query(
        `UPDATE users
         SET phone = ?, email = ?
         WHERE id = ?`,
        [phone, email, userId]
      );
    }

    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.username,
          u.full_name,
          u.role,
          u.phone,
          u.email,
          u.status,
          u.branch_id,
          u.profile_picture,
          b.branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    const profile = rows[0];

    res.json({
      message: "Profile updated successfully",
      profile: {
        id: profile.id,
        username: profile.username || "",
        full_name: profile.full_name || profile.username || "Admin",
        role: profile.role || "",
        phone: profile.phone || "",
        email: profile.email || "",
        status: profile.status || "",
        branch_id: profile.branch_id || "",
        branch_name: profile.branch_name || "All Branches",
        profile_picture: profile.profile_picture || ""
      }
    });
  } catch (error) {
    console.error("Admin profile update error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
};
