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

module.exports = router;
