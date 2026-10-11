const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const {
  verifyToken,
  requireAdmin,
  applyBranchSecurity,
  applyUserBranchSecurity
} = require("../middleware/authMiddleware");

// Admin-level users can view reports within their branch
router.get("/", verifyToken, requireAdmin, applyUserBranchSecurity, reportController.getReports);

// Only admins can create reports
router.post("/", verifyToken, requireAdmin, applyBranchSecurity, reportController.createReport);

// Delete a report record (branch permissions enforced by controller)
router.delete("/:id", verifyToken, requireAdmin, applyUserBranchSecurity, reportController.deleteReport);

module.exports = router;
