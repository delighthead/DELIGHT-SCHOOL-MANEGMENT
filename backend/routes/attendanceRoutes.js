const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");
const { verifyToken, requireAdminOrTeacher, applyUserBranchSecurity } = require("../middleware/authMiddleware");

router.use(verifyToken, requireAdminOrTeacher, applyUserBranchSecurity);

router.get("/", attendanceController.getAttendance);
router.post("/", attendanceController.createAttendance);
router.post("/bulk", attendanceController.bulkSaveAttendance);
router.put("/:id", attendanceController.updateAttendance);

module.exports = router;
