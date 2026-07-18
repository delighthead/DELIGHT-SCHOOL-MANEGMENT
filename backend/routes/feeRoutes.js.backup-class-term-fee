const express = require("express");
const router = express.Router();

const { verifyToken, requireAdmin, applyBranchSecurity } = require("../middleware/authMiddleware");

const feeController = require("../controllers/feeController");

router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/", feeController.getFees);
router.post("/", feeController.createFee);
router.post("/apply-class-term", feeController.applyClassTermFee);
router.put("/:id", feeController.updateFee);

router.get("/:fee_id/payments", feeController.getFeePayments);
router.post("/:fee_id/payments", feeController.addFeePayment);

module.exports = router;
