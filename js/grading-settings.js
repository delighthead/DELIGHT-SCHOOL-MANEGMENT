"use strict";

// Delight International School
// Numerical Grading System: Grades 1–9

const DEFAULT_NUMERICAL_GRADES = [
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

async function getGradingSettings() {
  try {
    const response = await fetch("/api/settings");

    if (!response.ok) {
      throw new Error("Could not load grading settings");
    }

    const data = await response.json();
    const settings = data.settings || data || {};

    return DEFAULT_NUMERICAL_GRADES.map(defaultGrade => {
      const grade = defaultGrade.grade;

      const minValue = settings[`grade_${grade}_min`];
      const maxValue = settings[`grade_${grade}_max`];
      const remarkValue = settings[`grade_${grade}_remark`];

      return {
        grade,
        min:
          minValue !== undefined && minValue !== null
            ? Number(minValue)
            : defaultGrade.min,
        max:
          maxValue !== undefined && maxValue !== null
            ? Number(maxValue)
            : defaultGrade.max,
        remark:
          String(remarkValue || defaultGrade.remark)
      };
    });
  } catch (error) {
    console.error("Could not load grading settings:", error);

    return DEFAULT_NUMERICAL_GRADES.map(
      grade => ({ ...grade })
    );
  }
}

function calculateGradeFromSettings(score, gradingSettings) {
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

  const settings =
    Array.isArray(gradingSettings) && gradingSettings.length
      ? gradingSettings
      : DEFAULT_NUMERICAL_GRADES;

  // Grade boundaries use minimum scores.
  // Example: 79.5 = Grade 2; 80 = Grade 1.
  const ordered = [...settings].sort(
    (a, b) => Number(b.min) - Number(a.min)
  );

  const found = ordered.find(
    grade => mark >= Number(grade.min)
  );

  if (!found) {
    return { grade: "", remark: "" };
  }

  return {
    grade: String(found.grade),
    remark: String(found.remark || "")
  };
}
