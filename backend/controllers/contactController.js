const nodemailer = require("nodemailer");
const db = require("../config/database");

exports.sendContactMessage = async (req, res) => {
  try {
    const { full_name, email, phone, subject, message } = req.body;

    if (!full_name || !email || !message) {
      return res.status(400).json({
        message: "Full name, email, and message are required."
      });
    }

    const [saved] = await db.query(
      `INSERT INTO contact_messages
       (full_name, email, phone, subject, message, email_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        full_name,
        email,
        phone || "",
        subject || "",
        message
      ]
    );

    let emailStatus = "saved_only";

    try {
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"Delight Website" <${process.env.SMTP_USER}>`,
          to: process.env.SCHOOL_EMAIL || "delightintschool@gmail.com",
          replyTo: email,
          subject: subject || "New Message from Delight School Website",
          html: `
            <h2>New Website Contact Message</h2>
            <p><strong>Full Name:</strong> ${full_name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Subject:</strong> ${subject || "No subject"}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `
        });

        emailStatus = "sent";
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      emailStatus = "email_failed";
    }

    await db.query(
      `UPDATE contact_messages SET email_status = ? WHERE id = ?`,
      [emailStatus, saved.insertId]
    );

    if (emailStatus === "sent") {
      return res.json({
        message: "Message sent successfully."
      });
    }

    return res.json({
      message: "Message received successfully. Email delivery is not configured yet, but the message has been saved.",
      email_status: emailStatus
    });

  } catch (error) {
    console.error("Contact message error:", error);
    res.status(500).json({
      message: "Failed to save message",
      error: error.message
    });
  }
};
