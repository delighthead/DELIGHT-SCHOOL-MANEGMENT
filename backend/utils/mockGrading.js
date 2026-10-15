"use strict";

const db = require("../config/database");

const {
  calculateNumericalGrade
} = require("./numericalGrading");

// Shared grading logic copied from the existing mock controller.
// This preserves the school's configured grading rules.

async function calculateMockGrade(total) {
  const [rows] = await db.query(
    "SELECT * FROM settings WHERE id = 1 LIMIT 1"
  );

  const settings = rows[0];

  if (settings) {
    const grades = [];

    for (let grade = 1; grade <= 9; grade++) {
      const min = Number(settings[`grade_${grade}_min`]);
      const remark = String(
        settings[`grade_${grade}_remark`] || ""
      ).trim();

      if (!Number.isFinite(min) || !remark) {
        break;
      }

      grades.push({
        grade: String(grade),
        min,
        remark
      });
    }

    if (grades.length === 9) {
      grades.sort((a, b) => b.min - a.min);

      const result = grades.find(
        item => total >= item.min
      );

      if (result) {
        return {
          grade: result.grade,
          remarks: result.remark
        };
      }
    }
  }

  const fallback = calculateNumericalGrade(total);

  return {
    grade: fallback.grade,
    remarks: fallback.remark
  };
}

module.exports = {
  calculateMockGrade
};
