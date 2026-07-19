const express = require("express");
const router = express.Router();

const parentController = require("../controllers/parentController");
const { verifyToken, requireAdmin, applyBranchSecurity } = require("../middleware/authMiddleware");

// Parent self-service route
router.get("/my/profile", verifyToken, parentController.getMyProfile);
router.put("/my/profile", verifyToken, parentController.updateMyProfile);
router.get("/my/children", verifyToken, parentController.getMyActiveChildren);
router.get("/my/scores", verifyToken, parentController.getMyChildrenScores);
router.get("/my/fees", verifyToken, parentController.getMyChildrenFees);
router.get("/my/attendance", verifyToken, parentController.getMyChildrenAttendance);
router.get("/my/reports", verifyToken, parentController.getMyChildrenReports);

// Admin parent management routes
router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/", parentController.getParents);
router.post("/", parentController.createParent);
router.put("/:id/status", parentController.toggleParentStatus);
router.put("/:id", parentController.updateParent);
router.get("/:id/children", parentController.getParentChildren);

module.exports = router;
