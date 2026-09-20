const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const lessonPlanController = require("../controllers/lessonPlanController");

const {
  verifyToken,
  requireAdmin,
  requireAdminOrTeacher,
  applyUserBranchSecurity
} = require("../middleware/authMiddleware");

const lessonPlanStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/lesson-plans");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `lesson-plan-${Date.now()}${ext}`);
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

const uploadLessonPlan = multer({
  storage: lessonPlanStorage,
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
  uploadLessonPlan.single("lesson_file"),
  lessonPlanController.createLessonPlan
);

router.get(
  "/my",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  lessonPlanController.getMyLessonPlans
);

router.get(
  "/",
  verifyToken,
  requireAdmin,
  applyUserBranchSecurity,
  lessonPlanController.getLessonPlans
);

router.patch(
  "/:id/review",
  verifyToken,
  requireAdmin,
  applyUserBranchSecurity,
  lessonPlanController.reviewLessonPlan
);

module.exports = router;
