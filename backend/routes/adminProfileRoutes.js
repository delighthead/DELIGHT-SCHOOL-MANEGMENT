const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const adminProfileController = require("../controllers/adminProfileController");
const { verifyToken } = require("../middleware/authMiddleware");

function allowAdminRoles(req, res, next) {
  const role = req.user && req.user.role;

  if (["super_admin", "branch_admin", "admin"].includes(role)) {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Admin only."
  });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/admins");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `admin-profile-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.get("/me", verifyToken, allowAdminRoles, adminProfileController.getMyProfile);

router.patch(
  "/me",
  verifyToken,
  allowAdminRoles,
  upload.single("profile_picture"),
  adminProfileController.updateMyProfile
);

module.exports = router;
