const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const weeklyReportController = require("../controllers/weeklyReportController");

const {
  verifyToken,
  requireAdmin,
  requireAdminOrTeacher,
  applyUserBranchSecurity
} = require("../middleware/authMiddleware");

const weeklyReportStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/weekly-reports");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `weekly-report-${Date.now()}${ext}`);
  }
});

const fileFilter = function (req, file, cb) {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowed.includes(ext)) {
    return cb(new Error("Only PDF, DOC and DOCX files are allowed"));
  }

  cb(null, true);
};

const uploadWeeklyReport = multer({
  storage: weeklyReportStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post(
  "/",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  uploadWeeklyReport.single("report_file"),
  weeklyReportController.createWeeklyReport
);

router.get(
  "/my",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  weeklyReportController.getMyWeeklyReports
);

router.get(
  "/",
  verifyToken,
  requireAdmin,
  applyUserBranchSecurity,
  weeklyReportController.getWeeklyReports
);

router.patch(
  "/:id/review",
  verifyToken,
  requireAdmin,
  applyUserBranchSecurity,
  weeklyReportController.reviewWeeklyReport
);

module.exports = router;
