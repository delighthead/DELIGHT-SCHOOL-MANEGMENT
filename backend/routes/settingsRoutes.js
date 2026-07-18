const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const settingsController = require("../controllers/settingsController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Logo upload
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/logo");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `school-logo-${Date.now()}${ext}`);
  }
});

const uploadLogo = multer({ storage: logoStorage });

// SQL restore upload
const restoreStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "restores");
  },
  filename: function (req, file, cb) {
    cb(null, `restore-${Date.now()}-${file.originalname}`);
  }
});

const uploadRestore = multer({ storage: restoreStorage });

router.get("/", settingsController.getSettings);
router.put("/", verifyToken, requireAdmin, settingsController.updateSettings);
router.post("/logo", verifyToken, requireAdmin, uploadLogo.single("school_logo"), settingsController.uploadSchoolLogo);
router.post("/backup", verifyToken, requireAdmin, settingsController.backupDatabase);
router.post("/restore", verifyToken, requireAdmin, uploadRestore.single("backup_file"), settingsController.restoreDatabase);

module.exports = router;
