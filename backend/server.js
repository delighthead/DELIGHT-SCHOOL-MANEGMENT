const http = require("http");
const express = require("express");
const contactRoutes = require("./routes/contactRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const websitePageRoutes = require("./routes/websitePageRoutes");
const adminProfileRoutes = require("./routes/adminProfileRoutes");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const branchRoutes = require("./routes/branchRoutes");
const parentRoutes = require("./routes/parentRoutes");
const feeRoutes = require("./routes/feeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const accountRoutes = require("./routes/accountRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const classRoutes = require("./routes/classRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

async function ensureUsersRoleCompatibility() {
  try {
    const [roleColumnRows] = await db.query(
      `SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'role'
       LIMIT 1`
    );

    if (roleColumnRows.length === 0) {
      console.warn("Schema check skipped: users.role column not found.");
      return;
    }

    const roleColumn = roleColumnRows[0];
    const enumDefinition = String(roleColumn.COLUMN_TYPE || "");
    const enumMatches = [...enumDefinition.matchAll(/'([^']+)'/g)];
    const existingRoles = enumMatches.map((match) => match[1]);

    const requiredRoles = [
      "super_admin",
      "branch_admin",
      "admin",
      "teacher_admin",
      "teacher",
      "parent"
    ];

    const mergedRoles = Array.from(new Set([...existingRoles, ...requiredRoles]));

    const hasAllRequiredRoles = requiredRoles.every((role) => mergedRoles.includes(role));
    if (hasAllRequiredRoles && existingRoles.length === mergedRoles.length) {
      return;
    }

    const enumSql = mergedRoles
      .map((role) => `'${role.replace(/'/g, "''")}'`)
      .join(", ");

    const nullSql = roleColumn.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
    const defaultSql = roleColumn.COLUMN_DEFAULT
      ? ` DEFAULT '${String(roleColumn.COLUMN_DEFAULT).replace(/'/g, "''")}'`
      : "";

    await db.query(
      `ALTER TABLE users MODIFY COLUMN role ENUM(${enumSql}) ${nullSql}${defaultSql}`
    );

    console.log("Updated users.role enum to include required application roles.");
  } catch (error) {
    console.warn("Schema compatibility check warning:", error.message);
  }
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));
app.use("/backups", express.static("backups"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Delight International School backend is running");
});

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SHOW TABLES");
    res.json({
      message: "Database connected successfully",
      tables: rows
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/website-pages", websitePageRoutes);
app.use("/api/admin-profile", adminProfileRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/activities", activityRoutes);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

async function startServer() {
  await ensureUsersRoleCompatibility();

  server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();

server.on("error", (error) => {
  console.error("Server error:", error.message);
});

// Keep process alive
setInterval(() => {
  // server heartbeat
}, 1000 * 60);
