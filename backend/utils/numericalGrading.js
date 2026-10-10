"use strict";

// Delight International School
// Numerical Grading System: Grades 1–9

const GRADING_SCALE = [
  { grade: "1", min: 80, max: 100, remark: "Highest" },
  { grade: "2", min: 70, max: 79, remark: "Higher" },
  { grade: "3", min: 65, max: 69, remark: "High" },
  { grade: "4", min: 60, max: 64, remark: "High Average" },
  { grade: "5", min: 55, max: 59, remark: "Average" },
  { grade: "6", min: 50, max: 54, remark: "Low Average" },
  { grade: "7", min: 45, max: 49, remark: "Low" },
  { grade: "8", min: 40, max: 44, remark: "Lower" },
  { grade: "9", min: 0, max: 39, remark: "Lowest" }
];

function calculateNumericalGrade(score) {
  if (
    score === null ||
    score === undefined ||
    String(score).trim() === ""
  ) {
    return { grade: "", remark: "" };
  }

  const mark = Number(score);

  if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
    return { grade: "", remark: "" };
  }

  // Use minimum boundaries so decimal scores are graded correctly.
  // Example: 79.5 = Grade 2, while 80 = Grade 1.
  const found = GRADING_SCALE.find(
    item => mark >= item.min
  );

  if (!found) {
    return { grade: "", remark: "" };
  }

  return {
    grade: found.grade,
    remark: found.remark
  };
}

module.exports = {
  GRADING_SCALE,
  calculateNumericalGrade
};
