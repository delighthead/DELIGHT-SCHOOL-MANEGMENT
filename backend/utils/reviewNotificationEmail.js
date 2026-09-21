const nodemailer = require("nodemailer");

function createTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error("SMTP configuration is incomplete");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendReviewNotification({
  teacherEmail,
  teacherName,
  submissionType,
  className,
  subject,
  week,
  status,
  adminComment
}) {
  if (!teacherEmail) {
    return {
      sent: false,
      reason: "Teacher has no email address"
    };
  }

  const transporter = createTransporter();

  const safeName = escapeHtml(teacherName || "Teacher");
  const safeType = escapeHtml(submissionType);
  const safeClass = escapeHtml(className || "-");
  const safeSubject = escapeHtml(subject || "");
  const safeWeek = escapeHtml(week || "-");
  const safeStatus = escapeHtml(status || "Reviewed");
  const safeComment = escapeHtml(adminComment || "No comment provided.");

  const subjectLine = `${submissionType} Reviewed - Delight International School`;

  const subjectRow = subject
    ? `<tr><td><strong>Subject:</strong></td><td>${safeSubject}</td></tr>`
    : "";

  const textLines = [
    `Dear ${teacherName || "Teacher"},`,
    "",
    `Your ${submissionType} has been reviewed.`,
    "",
    `Class: ${className || "-"}`,
    subject ? `Subject: ${subject}` : null,
    `Week: ${week || "-"}`,
    `Status: ${status || "Reviewed"}`,
    `Admin Comment: ${adminComment || "No comment provided."}`,
    "",
    "Please log in to the Delight International School Portal to view the details.",
    "",
    "Delight International School"
  ].filter(Boolean);

  await transporter.sendMail({
    from: `"Delight International School" <${process.env.SMTP_USER}>`,
    to: teacherEmail,
    subject: subjectLine,
    text: textLines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <p>Dear <strong>${safeName}</strong>,</p>

        <p>Your <strong>${safeType}</strong> has been reviewed.</p>

        <table cellpadding="5" cellspacing="0">
          <tr>
            <td><strong>Class:</strong></td>
            <td>${safeClass}</td>
          </tr>
          ${subjectRow}
          <tr>
            <td><strong>Week:</strong></td>
            <td>${safeWeek}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>${safeStatus}</td>
          </tr>
          <tr>
            <td><strong>Admin Comment:</strong></td>
            <td>${safeComment}</td>
          </tr>
        </table>

        <p>
          Please log in to the Delight International School Portal
          to view the details.
        </p>

        <p>
          Regards,<br>
          <strong>Delight International School</strong>
        </p>
      </div>
    `
  });

  return { sent: true };
}

module.exports = {
  sendReviewNotification
};
