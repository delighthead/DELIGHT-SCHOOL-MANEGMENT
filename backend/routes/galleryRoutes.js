const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const galleryController = require("../controllers/galleryController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/gallery");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.get("/", galleryController.getGalleryImages);

router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.single("gallery_image"),
  galleryController.uploadGalleryImage
);

router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  galleryController.deleteGalleryImage
);

module.exports = router;
