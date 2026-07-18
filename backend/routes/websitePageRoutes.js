const express = require("express");
const router = express.Router();

const websitePageController = require("../controllers/websitePageController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Public routes
router.get("/", websitePageController.getAllPages);

// IMPORTANT: blocks routes must come before /:pageKey
router.get("/:pageKey/blocks", websitePageController.getPageBlocks);
router.put("/:pageKey/blocks", verifyToken, requireAdmin, websitePageController.updatePageBlocks);

// Main page routes
router.get("/:pageKey", websitePageController.getPageByKey);
router.put("/:pageKey", verifyToken, requireAdmin, websitePageController.updatePage);

module.exports = router;
