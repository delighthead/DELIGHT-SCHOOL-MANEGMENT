const express = require("express");
const router = express.Router();

const promotionController = require("../controllers/promotionController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.post("/students", verifyToken, requireAdmin, promotionController.promoteStudents);
router.get("/history", verifyToken, requireAdmin, promotionController.getPromotionHistory);

module.exports = router;
