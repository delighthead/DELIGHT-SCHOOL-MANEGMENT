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

router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/", studentController.getStudents);
router.post("/", upload.single("profile_picture"), studentController.createStudent);
router.put("/:id", upload.single("profile_picture"), studentController.updateStudent);

module.exports = router;
