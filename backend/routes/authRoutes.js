const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/forgot-password/verify", authController.verifyForgotPassword);
router.post("/forgot-password/reset", authController.resetForgotPassword);

module.exports = router;
