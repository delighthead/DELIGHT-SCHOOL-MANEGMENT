const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const studentController = require("../controllers/studentController");
const { verifyToken, requireAdmin, applyBranchSecurity } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/students");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Excel files are processed in memory and are not permanently stored.
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (extension === ".xlsx" || extension === ".xls") {
      return cb(null, true);
    }

    cb(new Error("Only Excel .xlsx or .xls files are allowed"));
  }
});

router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/next-admission-number", studentController.getNextAdmissionNumber);
router.get("/excel-template", studentController.downloadStudentExcelTemplate);

router.post(
  "/excel-preview",
  excelUpload.single("excel_file"),
  studentController.previewStudentExcel
);

router.post(
  "/excel-import",
  excelUpload.single("excel_file"),
  studentController.importStudentExcel
);

router.get("/", studentController.getStudents);
router.post("/", upload.single("profile_picture"), studentController.createStudent);
router.patch("/:id/status", studentController.updateStudentStatus);
router.put("/:id", upload.single("profile_picture"), studentController.updateStudent);

module.exports = router;
