const express = require("express");
const router = express.Router();


const requireHandwritingControlAdmin = (req, res, next) => {
  if (
    !req.user ||
    !["super_admin", "teacher_admin"].includes(req.user.role)
  ) {
    return res.status(403).json({
      message:
        "Only Super Admin or Branch Administrator can manage Handwriting Report submissions."
    });
  }

  next();
};

const controller =
  require("../controllers/handwritingSubmissionControlController");

const {
  verifyToken,
  requireAdminOrTeacher,
  applyBranchSecurity
} = require("../middleware/authMiddleware");

router.get(
  "/my",
  verifyToken,
  requireAdminOrTeacher,
  controller.getMyControl
);

router.get(
  "/",
  verifyToken,
  requireHandwritingControlAdmin,
  applyBranchSecurity,
  controller.getControls
);

router.put(
  "/",
  verifyToken,
  requireHandwritingControlAdmin,
  applyBranchSecurity,
  controller.updateControl
);

module.exports = router;
