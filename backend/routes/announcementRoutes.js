const express = require("express");
const router = express.Router();

const announcementController = require("../controllers/announcementController");
const {
  verifyToken,
  requireAdmin,
  applyBranchSecurity,
  requireAdminOrTeacher,
  applyUserBranchSecurity
} = require("../middleware/authMiddleware");

// Admins and teachers can view announcements within their branch
router.get("/parent", verifyToken, announcementController.getParentAnnouncements);
router.get("/", verifyToken, requireAdminOrTeacher, applyUserBranchSecurity, announcementController.getAnnouncements);

// Only admins can create/delete announcements
router.post("/", verifyToken, requireAdmin, applyBranchSecurity, announcementController.createAnnouncement);
router.delete("/:id", verifyToken, requireAdmin, applyBranchSecurity, announcementController.deleteAnnouncement);

module.exports = router;
