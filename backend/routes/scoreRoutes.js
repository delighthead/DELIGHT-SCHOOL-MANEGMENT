const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const scoreController = require("../controllers/scoreController");
const {
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  requireAdmin,
  applyBranchSecurity
} = require("../middleware/authMiddleware");

// Excel score template and upload
router.get(
  "/excel/template",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  scoreController.downloadScoreTemplate
);

router.post(
  "/excel/upload",
  verifyToken,
  requireAdminOrTeacher,
  applyUserBranchSecurity,
  upload.single("score_file"),
  scoreController.uploadScoreExcel
);

// Teachers and admins can view/create scores within their branch
router.get("/", verifyToken, requireAdminOrTeacher, applyUserBranchSecurity, scoreController.getScores);
router.post("/", verifyToken, requireAdminOrTeacher, applyUserBranchSecurity, scoreController.createScore);
router.put("/:id", verifyToken, requireAdminOrTeacher, applyUserBranchSecurity, scoreController.updateScore);

// Only admins approve/reject scores
router.patch("/bulk/approval", verifyToken, requireAdmin, applyBranchSecurity, scoreController.bulkUpdateScoreApproval);

router.patch("/:id/approval", verifyToken, requireAdmin, applyBranchSecurity, scoreController.updateScoreApproval);

module.exports = router;
