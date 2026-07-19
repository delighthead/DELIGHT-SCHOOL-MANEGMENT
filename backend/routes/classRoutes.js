const express = require("express");
const router = express.Router();

const classController = require("../controllers/classController");
const { verifyToken, requireAdminOrTeacher } = require("../middleware/authMiddleware");

router.get("/", verifyToken, requireAdminOrTeacher, classController.getClasses);

module.exports = router;
