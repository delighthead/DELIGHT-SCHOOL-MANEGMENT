const express = require("express");
const router = express.Router();

const { verifyToken, requireAdmin, applyBranchSecurity } = require("../middleware/authMiddleware");

const dashboardController = require("../controllers/dashboardController");

router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/admin-summary", dashboardController.getAdminDashboard);

module.exports = router;
