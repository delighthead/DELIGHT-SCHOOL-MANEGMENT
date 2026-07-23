const express = require("express");
const router = express.Router();

const branchController = require("../controllers/branchController");
const { verifyToken, requireAdmin, requireAdminOrTeacher } = require("../middleware/authMiddleware");

router.get("/", verifyToken, requireAdminOrTeacher, branchController.getBranches);
router.post("/", verifyToken, requireAdmin, branchController.createBranch);
router.put("/:id", verifyToken, requireAdmin, branchController.updateBranch);

module.exports = router;
