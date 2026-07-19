const express = require("express");
const router = express.Router();

const activityController = require("../controllers/activityController");
const { verifyToken, requireAdmin, applyBranchSecurity } = require("../middleware/authMiddleware");

router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/", activityController.getActivities);
router.post("/", activityController.createActivity);
router.put("/:id", activityController.updateActivity);

module.exports = router;
