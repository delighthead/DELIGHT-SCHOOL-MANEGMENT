const express = require("express");
const router = express.Router();

const accountController = require("../controllers/accountController");
const { verifyToken, requireAdmin, applyBranchSecurity } = require("../middleware/authMiddleware");

router.use(verifyToken, requireAdmin, applyBranchSecurity);

router.get("/", accountController.getAccounts);
router.patch("/:id/status", accountController.updateAccountStatus);

module.exports = router;
