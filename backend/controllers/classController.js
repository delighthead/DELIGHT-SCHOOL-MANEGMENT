const db = require("../config/database");

const STANDARD_CLASSES = [
  "Nursery 1",
  "Nursery 2",
  "Kindergarten 1",
  "Kindergarten 2",
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "Basic 7",
  "Basic 8",
  "Basic 9"
];

function getDefaultAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}/${year + 1}`;
}

exports.getClasses = async (req, res) => {
  try {
    const includeAll =
      String(req.query.include_all || "").toLowerCase() === "1" ||
      String(req.query.include_all || "").toLowerCase() === "true" ||
      String(req.query.include_inactive || "").toLowerCase() === "1" ||
      String(req.query.include_inactive || "").toLowerCase() === "true";

    const statusClause = includeAll ? "" : "WHERE status = 'active'";

    let [classes] = await db.query(
      `SELECT id, class_name, academic_year
       FROM classes
       ${statusClause}
       ORDER BY FIELD(
         class_name,
         'Nursery 1',
         'Nursery 2',
         'Kindergarten 1',
         'Kindergarten 2',
         'Basic 1',
         'Basic 2',
         'Basic 3',
         'Basic 4',
         'Basic 5',
         'Basic 6',
         'Basic 7',
         'Basic 8',
         'Basic 9'
       ), class_name`
    );

    const existingNames = new Set(
      classes.map(item => String(item.class_name || "").trim().toLowerCase()).filter(Boolean)
    );

    const missingNames = STANDARD_CLASSES.filter(
      className => !existingNames.has(className.toLowerCase())
    );

    if (missingNames.length > 0) {
      const academicYear =
        (classes.find(item => item.class_name && item.academic_year)?.academic_year || "") ||
        getDefaultAcademicYear();

      // Populate missing standard classes once so all dropdowns can use DB-backed class IDs.
      await db.query(
        `INSERT IGNORE INTO classes (class_name, academic_year, status)
         VALUES ?`,
        [missingNames.map(className => [className, academicYear, "active"])]
      );

      [classes] = await db.query(
        `SELECT id, class_name, academic_year
         FROM classes
         ${statusClause}
         ORDER BY FIELD(
           class_name,
           'Nursery 1',
           'Nursery 2',
           'Kindergarten 1',
           'Kindergarten 2',
           'Basic 1',
           'Basic 2',
           'Basic 3',
           'Basic 4',
           'Basic 5',
           'Basic 6',
           'Basic 7',
           'Basic 8',
           'Basic 9'
         ), class_name`
      );
    }

    res.json({
      message: "Classes retrieved successfully",
      classes
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve classes",
      error: error.message
    });
  }
};
