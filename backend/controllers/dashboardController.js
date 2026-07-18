const db = require("../config/database");

exports.getAdminDashboard = async (req, res) => {
  try {
    const { branch_id } = req.query;

    const where = branch_id ? "WHERE branch_id = ?" : "";
    const params = branch_id ? [branch_id] : [];

    const [[students]] = await db.query(
      `SELECT COUNT(*) AS total FROM students ${where}`,
      params
    );

    const [[teachers]] = await db.query(
      `SELECT COUNT(*) AS total FROM teachers ${where}`,
      params
    );

    const [[parents]] = await db.query(
      `SELECT COUNT(*) AS total FROM parents ${where}`,
      params
    );

    const [[fees]] = await db.query(
      `SELECT 
        COALESCE(SUM(amount_payable), 0) AS total_payable,
        COALESCE(SUM(amount_paid), 0) AS total_paid,
        COALESCE(SUM(balance), 0) AS total_balance
       FROM fees ${where}`,
      params
    );

    const [[pendingScores]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM scores 
       WHERE approval_status = 'pending'
       ${branch_id ? "AND branch_id = ?" : ""}`,
      params
    );

    const [[announcements]] = await db.query(
      `SELECT COUNT(*) AS total FROM announcements ${where}`,
      params
    );

    const [[attendanceToday]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM attendance 
       WHERE attendance_date = CURDATE()
       ${branch_id ? "AND branch_id = ?" : ""}`,
      params
    );

    let breakdown = null;

    if (!branch_id) {
      const [studentsByBranch] = await db.query(
        `SELECT branches.branch_name, COUNT(students.id) AS total
         FROM branches
         LEFT JOIN students ON students.branch_id = branches.id
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      const [teachersByBranch] = await db.query(
        `SELECT branches.branch_name, COUNT(teachers.id) AS total
         FROM branches
         LEFT JOIN teachers ON teachers.branch_id = branches.id
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      const [parentsByBranch] = await db.query(
        `SELECT branches.branch_name, COUNT(parents.id) AS total
         FROM branches
         LEFT JOIN parents ON parents.branch_id = branches.id
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      const [feesByBranch] = await db.query(
        `SELECT 
           branches.branch_name,
           COALESCE(SUM(fees.amount_payable), 0) AS total_payable,
           COALESCE(SUM(fees.amount_paid), 0) AS total_paid,
           COALESCE(SUM(fees.balance), 0) AS total_balance
         FROM branches
         LEFT JOIN fees ON fees.branch_id = branches.id
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      const [pendingScoresByBranch] = await db.query(
        `SELECT branches.branch_name, COUNT(scores.id) AS total
         FROM branches
         LEFT JOIN scores 
           ON scores.branch_id = branches.id 
           AND scores.approval_status = 'pending'
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      const [announcementsByBranch] = await db.query(
        `SELECT branches.branch_name, COUNT(announcements.id) AS total
         FROM branches
         LEFT JOIN announcements ON announcements.branch_id = branches.id
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      const [attendanceTodayByBranch] = await db.query(
        `SELECT branches.branch_name, COUNT(attendance.id) AS total
         FROM branches
         LEFT JOIN attendance 
           ON attendance.branch_id = branches.id
           AND attendance.attendance_date = CURDATE()
         WHERE branches.status = 'active'
         GROUP BY branches.id, branches.branch_name
         ORDER BY branches.branch_name`
      );

      breakdown = {
        students: studentsByBranch,
        teachers: teachersByBranch,
        parents: parentsByBranch,
        fees: feesByBranch,
        pending_scores: pendingScoresByBranch,
        announcements: announcementsByBranch,
        attendance_today: attendanceTodayByBranch
      };
    }

    res.json({
      message: "Dashboard summary retrieved successfully",
      summary: {
        students: students.total,
        teachers: teachers.total,
        parents: parents.total,
        total_payable: fees.total_payable,
        total_paid: fees.total_paid,
        total_balance: fees.total_balance,
        pending_scores: pendingScores.total,
        announcements: announcements.total,
        attendance_today: attendanceToday.total
      },
      breakdown
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve dashboard summary",
      error: error.message
    });
  }
};
