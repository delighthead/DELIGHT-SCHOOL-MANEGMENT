function normalizeGhanaPhone(phone) {
  const clean = String(phone || "").replace(/[^\d+]/g, "").trim();

  if (!clean) return null;

  if (/^0\d{9}$/.test(clean)) {
    return clean;
  }

  if (/^233\d{9}$/.test(clean)) {
    return "0" + clean.slice(3);
  }

  if (/^\+233\d{9}$/.test(clean)) {
    return "0" + clean.slice(4);
  }

  return clean;
}

async function sendSms({ recipients, message }) {
  const apiKey = String(process.env.MNOTIFY_API_KEY || "").trim();
  const sender = String(process.env.MNOTIFY_SENDER || "DELIGHT").trim();

  if (!apiKey) {
    throw new Error("MNOTIFY_API_KEY is not configured");
  }

  const uniqueRecipients = [
    ...new Set(
      (recipients || [])
        .map(normalizeGhanaPhone)
        .filter(Boolean)
    )
  ];

  if (uniqueRecipients.length === 0) {
    return {
      skipped: true,
      reason: "No valid recipient phone numbers"
    };
  }

  const response = await fetch(
    `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient: uniqueRecipients,
        sender,
        message: String(message || ""),
        is_schedule: false,
        schedule_date: ""
      })
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(`mNotify returned HTTP ${response.status}`);
  }

  if (!response.ok || data.status !== "success") {
    throw new Error(
      data.message ||
      `mNotify SMS request failed with HTTP ${response.status}`
    );
  }

  return data;
}

async function sendStudentRegistrationSms({
  studentName,
  admissionNumber,
  motherPhone,
  fatherPhone
}) {
  const recipients = [motherPhone, fatherPhone].filter(Boolean);

  if (recipients.length === 0) {
    return {
      skipped: true,
      reason: "No parent phone number supplied"
    };
  }

  const message =
    `${studentName} has been successfully registered. ` +
    `Admission No: ${admissionNumber}. ` +
    `Visit the school portal or contact the school for assistance.`;

  return sendSms({
    recipients,
    message
  });
}

async function sendFeePaymentSms({
  studentName,
  paymentAmount,
  totalPaid,
  balance,
  motherPhone,
  fatherPhone
}) {
  const recipients = [motherPhone, fatherPhone].filter(Boolean);

  if (recipients.length === 0) {
    return {
      skipped: true,
      reason: "No parent phone number supplied"
    };
  }

  const money = (value) =>
    Number(value || 0).toFixed(2);

  const message =
    `Payment received for ${studentName}. ` +
    `Amount paid: GHS ${money(paymentAmount)}. ` +
    `Total paid: GHS ${money(totalPaid)}. ` +
    `Balance: GHS ${money(balance)}. ` +
    `Thank you. - Delight International School`;

  return sendSms({
    recipients,
    message
  });
}

module.exports = {
  normalizeGhanaPhone,
  sendSms,
  sendStudentRegistrationSms,
  sendFeePaymentSms
};
