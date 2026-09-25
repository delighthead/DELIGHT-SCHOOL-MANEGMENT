const express = require("express");
const db = require("../config/database");
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


async function requireOpenHandwritingSubmission(req, res, next) {
  try {
    // The submission window applies to teachers.
    if (!req.user || req.user.role !== "teacher") {
      return next();
    }

    if (!req.user.branch_id) {
      return res.status(403).json({
        message: "No branch is assigned to your account"
      });
    }

    const [rows] = await db.query(
      `SELECT is_open
       FROM handwriting_submission_controls
       WHERE branch_id = ?
       LIMIT 1`,
      [req.user.branch_id]
    );

    const submissionOpen =
      rows.length > 0 &&
      Number(rows[0].is_open) === 1;

    if (!submissionOpen) {
      return res.status(403).json({
        message:
          "Handwriting Report submission is currently locked by Administration."
      });
    }

    next();
  } catch (error) {
    console.error(
      "Handwriting submission lock check error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to confirm Handwriting Report submission status."
    });
  }
}

router.post(
  "/",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  requireOpenHandwritingSubmission,
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

router.patch(
  "/:id/comment",
  verifyToken,
  requireAdmin,
  applyUserBranchSecurity,
  weeklyReportController.commentWeeklyReport
);

router.delete(
  "/my/:id",
  verifyToken,
  weeklyReportController.deleteMyWeeklyReport
);

router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  applyUserBranchSecurity,
  weeklyReportController.deleteWeeklyReport
);

module.exports = router;
