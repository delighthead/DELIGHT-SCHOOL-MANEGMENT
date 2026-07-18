async function getGradingSettings() {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/settings");
    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    const s = data.settings || {};

    return [
      {
        grade: "A",
        min: Number(s.grade_a_min),
        max: Number(s.grade_a_max),
        remark: s.grade_a_remark || "Excellent"
      },
      {
        grade: "B",
        min: Number(s.grade_b_min),
        max: Number(s.grade_b_max),
        remark: s.grade_b_remark || "Very Good"
      },
      {
        grade: "C",
        min: Number(s.grade_c_min),
        max: Number(s.grade_c_max),
        remark: s.grade_c_remark || "Good"
      },
      {
        grade: "D",
        min: Number(s.grade_d_min),
        max: Number(s.grade_d_max),
        remark: s.grade_d_remark || "Pass"
      },
      {
        grade: "F",
        min: Number(s.grade_f_min),
        max: Number(s.grade_f_max),
        remark: s.grade_f_remark || "Needs Improvement"
      }
    ];
  } catch (error) {
    console.error("Could not load grading settings:", error);
    return null;
  }
}

function calculateGradeFromSettings(score, gradingSettings) {
  const mark = Number(score);

  if (isNaN(mark)) {
    return {
      grade: "",
      remark: ""
    };
  }

  const settings = gradingSettings || [
    { grade: "A", min: 80, max: 100, remark: "Excellent" },
    { grade: "B", min: 70, max: 79, remark: "Very Good" },
    { grade: "C", min: 60, max: 69, remark: "Good" },
    { grade: "D", min: 50, max: 59, remark: "Pass" },
    { grade: "F", min: 0, max: 49, remark: "Needs Improvement" }
  ];

  const found = settings.find(g => mark >= g.min && mark <= g.max);

  if (!found) {
    return {
      grade: "",
      remark: ""
    };
  }

  return {
    grade: found.grade,
    remark: found.remark
  };
}
