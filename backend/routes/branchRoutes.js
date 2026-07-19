const express = require("express");
const router = express.Router();

const branchController = require("../controllers/branchController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.get("/", branchController.getBranches);
router.post("/", verifyToken, requireAdmin, branchController.createBranch);
router.put("/:id", verifyToken, requireAdmin, branchController.updateBranch);

module.exports = router;
