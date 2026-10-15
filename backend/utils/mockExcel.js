
"use strict";

const ExcelJS = require("exceljs");

const HEADERS = [
  "Student ID",
  "Admission Number",
  "Student Name",
  "Objectives",
  "Written",
  "Total",
  "Grade",
  "Remarks"
];

function studentName(student) {
  return (
    student.full_name ||
    [
      student.first_name,
      student.other_name,
      student.surname
    ].filter(Boolean).join(" ")
  ).trim();
}

async function createTemplate(exam, subject, students, scores = []) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Delight International School";
  workbook.title = "Basic 9 Mock Examination Scores";

  const sheet = workbook.addWorksheet("Mock Scores", {
    views: [{ state: "frozen", ySplit: 8 }]
  });

  sheet.addRow(["DELIGHT INTERNATIONAL SCHOOL"]);
  sheet.addRow(["BASIC 9 MOCK EXAMINATION SCORE TEMPLATE"]);
  sheet.addRow(["Examination", exam.mock_name]);
  sheet.addRow(["Academic Year", exam.academic_year]);
  sheet.addRow(["Subject", subject.subject]);
  sheet.addRow([
    "Marking Format",
    subject.objectives_max + " Objectives + " +
    subject.written_max + " Written"
  ]);
  sheet.addRow([]);

  sheet.addRow(HEADERS);

  const metadata = workbook.addWorksheet("_TemplateInfo");

  metadata.addRow(["Field", "Value"]);
  metadata.addRow(["mock_id", Number(exam.id)]);
  metadata.addRow(["branch_id", Number(exam.branch_id)]);
  metadata.addRow(["subject_setting_id", Number(subject.id)]);
  metadata.addRow(["mock_name", String(exam.mock_name)]);
  metadata.addRow(["academic_year", String(exam.academic_year)]);
  metadata.addRow(["subject", String(subject.subject)]);
  metadata.addRow(["objectives_max", Number(subject.objectives_max)]);
  metadata.addRow(["written_max", Number(subject.written_max)]);

  metadata.state = "veryHidden";

  for (const student of students) {
    const saved = scores.find(item =>
      Number(item.student_id) === Number(student.id) &&
      Number(item.subject_setting_id) === Number(subject.id)
    );

    sheet.addRow([
      Number(student.id),
      student.admission_number || student.student_id || "",
      studentName(student),
      saved?.objectives_score ?? "",
      saved?.written_score ?? "",
      saved?.total_score ?? "",
      saved?.grade ?? "",
      saved?.remarks ?? ""
    ]);
  }

  const widths = [15, 22, 35, 16, 16, 14, 12, 25];

  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  sheet.getRow(8).font = {
    bold: true,
    color: { argb: "FFFFFFFF" }
  };

  sheet.getRow(8).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF004080" }
  };

  for (let row = 9; row <= sheet.rowCount; row++) {
    sheet.getCell(row, 1).protection = { locked: true };
    sheet.getCell(row, 2).protection = { locked: true };
    sheet.getCell(row, 3).protection = { locked: true };
  }

  return workbook.xlsx.writeBuffer();
}

async function parseWorkbook(buffer, subject, exam = null) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const metadata = workbook.getWorksheet("_TemplateInfo");

  if (!metadata) {
    throw new Error("Invalid template: examination information missing.");
  }

  const values = {};

  metadata.eachRow((row, number) => {
    if (number > 1) {
      values[String(row.getCell(1).value)] = row.getCell(2).value;
    }
  });

  if (
    Number(values.subject_setting_id) !== Number(subject.id) ||
    String(values.subject) !== String(subject.subject) ||
    Number(values.objectives_max) !== Number(subject.objectives_max) ||
    Number(values.written_max) !== Number(subject.written_max)
  ) {
    throw new Error("This Excel file belongs to a different subject or marking format.");
  }

  if (exam && (
    Number(values.mock_id) !== Number(exam.id) ||
    Number(values.branch_id) !== Number(exam.branch_id) ||
    String(values.mock_name) !== String(exam.mock_name) ||
    String(values.academic_year) !== String(exam.academic_year)
  )) {
    throw new Error("This Excel file belongs to a different mock examination or branch.");
  }

  const sheet = workbook.getWorksheet("Mock Scores");

  if (!sheet) {
    throw new Error("Invalid template: Mock Scores worksheet missing.");
  }

  const actualHeaders = HEADERS.map((_, index) =>
    String(sheet.getRow(8).getCell(index + 1).value || "").trim()
  );

  if (actualHeaders.some((value, index) => value !== HEADERS[index])) {
    throw new Error("Invalid template: Excel columns have changed.");
  }

  const rows = [];
  const seen = new Set();
  const errors = [];

  for (let number = 9; number <= sheet.rowCount; number++) {
    const row = sheet.getRow(number);

    const studentId = Number(row.getCell(1).value);
    const objectivesRaw = row.getCell(4).value;
    const writtenRaw = row.getCell(5).value;

    const blankObjectives =
      objectivesRaw === null || objectivesRaw === undefined ||
      objectivesRaw === "";

    const blankWritten =
      writtenRaw === null || writtenRaw === undefined ||
      writtenRaw === "";

    if (!studentId && blankObjectives && blankWritten) {
      continue;
    }

    if (blankObjectives && blankWritten) {
      continue;
    }

    const isPlainNumber = value =>
      typeof value === "number" && Number.isFinite(value);

    if (!isPlainNumber(objectivesRaw) || !isPlainNumber(writtenRaw)) {
      errors.push(
        "Row " + number +
        ": Scores must be numbers, not formulas or text."
      );
      continue;
    }

    const objectives = objectivesRaw;
    const written = writtenRaw;

    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      errors.push("Row " + number + ": Invalid student ID.");
      continue;
    }

    if (seen.has(studentId)) {
      errors.push("Row " + number + ": Duplicate student ID.");
      continue;
    }

    seen.add(studentId);

    if (
      blankObjectives ||
      blankWritten ||
      !Number.isFinite(objectives) ||
      !Number.isFinite(written) ||
      objectives < 0 ||
      written < 0 ||
      objectives > Number(subject.objectives_max) ||
      written > Number(subject.written_max) ||
      Math.abs(Math.round(objectives * 100) - objectives * 100) > 0.000001 ||
      Math.abs(Math.round(written * 100) - written * 100) > 0.000001
    ) {
      errors.push("Row " + number + ": Invalid objectives or written score.");
      continue;
    }

    rows.push({
      student_id: studentId,
      admission_number: String(
        row.getCell(2).value ?? ""
      ).trim(),
      student_name: String(
        row.getCell(3).value ?? ""
      ).trim(),
      objectives_score: objectives,
      written_score: written
    });
  }

  return { rows, errors };
}

module.exports = {
  createTemplate,
  parseWorkbook
};
