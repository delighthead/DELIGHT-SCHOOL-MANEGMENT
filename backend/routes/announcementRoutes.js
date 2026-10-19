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
router.get(
  "/parent",
  verifyToken,
  (req, res, next) => {
    if (req.user?.role !== "parent") {
      return res.status(403).json({
        message: "Parent access required."
      });
    }

    next();
  },
  announcementController.getParentAnnouncements
);
router.get(
  "/",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  (req, res, next) => {
    // Legacy administrators must use their assigned branch.
    if (req.user?.role === "admin") {
      if (!req.user.branch_id) {
        return res.status(403).json({
          message: "An assigned branch is required."
        });
      }

      req.query.branch_id = req.user.branch_id;
    }

    next();
  },
  announcementController.getAnnouncements
);

// Only admins can create/delete announcements
router.post(
  "/",
  verifyToken,
  requireAdmin,
  (req, res, next) => {
    // Preserve the requested branch before security middleware changes it.
    req.requestedAnnouncementBranchId = req.body?.branch_id ?? null;
    next();
  },
  applyBranchSecurity,
  announcementController.createAnnouncement
);
router.delete("/:id", verifyToken, requireAdmin, applyBranchSecurity, announcementController.deleteAnnouncement);

module.exports = router;
