const mockReportRemarksController = require("../controllers/mockReportRemarksController");
const express = require("express");
const router = express.Router();

const mockExamController = require("../controllers/mockExamController");
const mockExcelController = require("../controllers/mockExcelController");

const multer = require("multer");
const mockExcelPreviewController = require("../controllers/mockExcelPreviewController");
const mockExcelImportController = require("../controllers/mockExcelImportController");

const mockExcelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    if (!/\.xlsx$/i.test(file.originalname || "")) {
      return callback(
        new Error("Only .xlsx Excel files are allowed.")
      );
    }

    callback(null, true);
  }
});


const {
  verifyToken,
  requireAdmin,
  requireAdminOrTeacher,
  applyUserBranchSecurity
} = require("../middleware/authMiddleware");

// All mock examination requests require authentication.
router.use(verifyToken);


// Available school subjects from active teacher assignments.
router.get(
  "/available-subjects",
  requireAdmin,
  applyUserBranchSecurity,
  mockExamController.getAvailableSubjects
);

// List mock examinations.
router.get(
  "/",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockExamController.getMockExams
);

// Create Mock 1, Mock 2, Mock 3, etc.
router.post(
  "/",
  requireAdmin,
  applyUserBranchSecurity,
  mockExamController.createMockExam
);

// Activate or complete a mock examination.
router.patch(
  "/:mockId/status",
  requireAdmin,
  applyUserBranchSecurity,
  mockExamController.updateMockStatus
);

// Configure subject marking formats (40/60 or 30/70).
router.post(
  "/:mockId/subjects",
  requireAdmin,
  applyUserBranchSecurity,
  mockExamController.configureSubject
);

// List configured subjects with teacher assignment restrictions.
router.get(
  "/:mockId/subjects",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockExamController.getMockSubjects
);

// List active students in the mock examination class.
router.get(
  "/:mockId/students",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockExamController.getMockStudents
);


// Preview Excel scores without saving any records.
router.post(
  "/:mockId/scores/preview-excel",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  (req, res, next) => {
    mockExcelUpload.single("file")(req, res, error => {
      if (error) {
        return res.status(400).json({
          message: error.message || "Invalid Excel upload."
        });
      }

      next();
    });
  },
  mockExcelPreviewController.previewExcel
);


// Import validated Excel scores using a database transaction.
router.post(
  "/:mockId/scores/import-excel",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  (req, res, next) => {
    mockExcelUpload.single("file")(req, res, error => {
      if (error) {
        return res.status(400).json({
          message: error.message || "Invalid Excel upload."
        });
      }

      next();
    });
  },
  mockExcelImportController.importExcel
);

// Download a subject-specific Excel score template.
router.get(
  "/:mockId/scores/template",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockExcelController.downloadTemplate
);

// Retrieve students' mock examination scores.
router.get(
  "/:mockId/scores",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockExamController.getMockScores
);

// Enter or update objectives and written scores.
router.post(
  "/:mockId/scores",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockExamController.saveMockScore
);


// Mock examination report card remarks.
router.get(
  "/:mockId/students/:studentId/remarks",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockReportRemarksController.getRemarks
);

router.put(
  "/:mockId/students/:studentId/remarks",
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  mockReportRemarksController.saveRemarks
);

module.exports = router;
