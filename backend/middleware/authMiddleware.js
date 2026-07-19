const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "delight_school_secret"
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (
    !req.user ||
    !["super_admin", "branch_admin", "admin", "teacher_admin"].includes(req.user.role)
  ) {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};

exports.applyBranchSecurity = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Access denied"
    });
  }

  if (req.user.role === "branch_admin") {
    req.query.branch_id = req.user.branch_id;

    if (!req.body) {
      req.body = {};
    }

    req.body.branch_id = req.user.branch_id;
  }

  next();
};

exports.requireAdminOrTeacher = (req, res, next) => {
  if (
    !req.user ||
    !["super_admin", "branch_admin", "admin", "teacher_admin", "teacher"].includes(req.user.role)
  ) {
    return res.status(403).json({
      message: "Admin or teacher access required"
    });
  }

  next();
};

exports.applyUserBranchSecurity = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Access denied"
    });
  }

  if (req.user.role === "branch_admin" || req.user.role === "teacher") {
    req.query.branch_id = req.user.branch_id;

    if (!req.body) {
      req.body = {};
    }

    req.body.branch_id = req.user.branch_id;
  }

  next();
};
