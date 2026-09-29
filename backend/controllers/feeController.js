const db = require("../config/database");
const { sendFeePaymentSms } = require("../utils/mnotifySms");

function isBranchScopedAdmin(user) {
  if (!user) return false;
  return user.role === "branch_admin" || user.role === "teacher_admin";
}

function computeFeeStatus(amountPayable, amountPaid) {
  const payable = Math.max(Number(amountPayable || 0), 0);
  const paid = Math.max(Number(amountPaid || 0), 0);
  const balance = Math.max(payable - paid, 0);

  if (paid >= payable && payable > 0) {
    return { balance, payment_status: "paid" };
  }

  if (paid > 0) {
    return { balance, payment_status: "part_payment" };
  }

  return { balance, payment_status: "unpaid" };
}

function normalizePaymentStatus(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) return "";
  if (raw === "paid") return "paid";
  if (raw === "unpaid") return "unpaid";
  if (raw === "part payment" || raw === "part_payment" || raw === "partial" || raw === "partial_payment") {
    return "part_payment";
  }

  return "";
}

// Get all fees, optionally filtered by branch
exports.getFees = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let sql = `SELECT
        fees.id,
        fees.branch_id,
        branches.branch_name,
        fees.student_id,
        students.admission_number,
        COALESCE(students.full_name, CONCAT(students.first_name, ' ', students.surname)) AS student_name,
        classes.class_name,
        fees.term,
        fees.academic_year,
        fees.amount_payable,
        fees.amount_paid,
        fees.balance,
        fees.payment_date,
        fees.payment_status,
        fees.created_at
      FROM fees
      LEFT JOIN branches ON fees.branch_id = branches.id
      LEFT JOIN students ON fees.student_id = students.id
      LEFT JOIN classes ON students.class_id = classes.id`;

    const params = [];

    // Branch-scoped admins must only retrieve their authenticated branch.
    // Never trust a branch_id supplied by the browser for these roles.
    const effectiveBranchId = isBranchScopedAdmin(req.user)
      ? req.user.branch_id
      : branch_id;

    if (effectiveBranchId) {
      sql += " WHERE fees.branch_id = ?";
      params.push(effectiveBranchId);
    }

    sql += " ORDER BY fees.created_at DESC";

    const [fees] = await db.query(sql, params);

    res.json({
      message: "Fees retrieved successfully",
      fees
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve fees",
      error: error.message
    });
  }
};

// Add fee record
exports.createFee = async (req, res) => {
  try {
    const {
      branch_id,
      student_id,
      term,
      academic_year,
      amount_payable,
      amount_paid,
      payment_date,
      payment_status
    } = req.body;

    const effectiveBranchId = isBranchScopedAdmin(req.user)
      ? req.user.branch_id
      : branch_id;

    if (!effectiveBranchId || !student_id || !term || !academic_year) {
      return res.status(400).json({
        message: "Branch, student, term, and academic year are required"
      });
    }

    const [studentRows] = await db.query(
      "SELECT id, branch_id FROM students WHERE id = ? LIMIT 1",
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    if (Number(studentRows[0].branch_id) !== Number(effectiveBranchId)) {
      return res.status(400).json({
        message: "Selected student does not belong to your permitted branch"
      });
    }

    const payable = Number(amount_payable || 0);
    const paid = Number(amount_paid || 0);
    const computed = computeFeeStatus(payable, paid);
    const explicitStatus = normalizePaymentStatus(payment_status);
    const finalStatus = explicitStatus || computed.payment_status;

    const [result] = await db.query(
      `INSERT INTO fees
      (branch_id, student_id, term, academic_year, amount_payable, amount_paid, balance, payment_date, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        effectiveBranchId,
        student_id,
        term,
        academic_year,
        payable,
        paid,
        computed.balance,
        payment_date || null,
        finalStatus
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        effectiveBranchId,
        req.user ? req.user.id : null,
        "Fee Recorded",
        "Fees",
        `Recorded fee for student ID ${student_id}. Payable: GHS ${payable}, Paid: GHS ${paid}, Balance: GHS ${computed.balance}.`
      ]
    );

    res.status(201).json({
      message: "Fee record added successfully",
      fee_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add fee record",
      error: error.message
    });
  }
};

// Update fee record
exports.updateFee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branch_id,
      student_id,
      term,
      academic_year,
      amount_payable,
      amount_paid,
      payment_date,
      payment_status
    } = req.body;

    const payable = Number(amount_payable || 0);
    const paid = Number(amount_paid || 0);
    const computed = computeFeeStatus(payable, paid);
    const explicitStatus = normalizePaymentStatus(payment_status);
    const finalStatus = explicitStatus || computed.payment_status;

    const [feeRows] = await db.query(
      "SELECT id, branch_id FROM fees WHERE id = ? LIMIT 1",
      [id]
    );

    if (feeRows.length === 0) {
      return res.status(404).json({
        message: "Fee record not found"
      });
    }

    const fee = feeRows[0];

    if (isBranchScopedAdmin(req.user) && Number(fee.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only update fees in your own branch"
      });
    }

    const effectiveBranchId = isBranchScopedAdmin(req.user)
      ? req.user.branch_id
      : branch_id;

    const [studentRows] = await db.query(
      "SELECT id, branch_id FROM students WHERE id = ? LIMIT 1",
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    if (Number(studentRows[0].branch_id) !== Number(effectiveBranchId)) {
      return res.status(400).json({
        message: "Selected student does not belong to the provided branch"
      });
    }

    const [result] = await db.query(
      `UPDATE fees SET
        branch_id = ?,
        student_id = ?,
        term = ?,
        academic_year = ?,
        amount_payable = ?,
        amount_paid = ?,
        balance = ?,
        payment_date = ?,
        payment_status = ?
      WHERE id = ?`,
      [
        effectiveBranchId,
        student_id,
        term,
        academic_year,
        payable,
        paid,
        computed.balance,
        payment_date || null,
        finalStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Fee record not found"
      });
    }

    res.json({
      message: "Fee record updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update fee record",
      error: error.message
    });
  }
};

// Get payment history for one fee record
exports.getFeePayments = async (req, res) => {
  try {
    const { fee_id } = req.params;

    const [feeRows] = await db.query(
      "SELECT id, branch_id FROM fees WHERE id = ? LIMIT 1",
      [fee_id]
    );

    if (feeRows.length === 0) {
      return res.status(404).json({
        message: "Fee record not found"
      });
    }

    if (
      isBranchScopedAdmin(req.user) &&
      Number(feeRows[0].branch_id) !== Number(req.user.branch_id)
    ) {
      return res.status(403).json({
        message: "You can only view fee payments in your own branch"
      });
    }

    const [payments] = await db.query(
      `SELECT
        id,
        fee_id,
        branch_id,
        student_id,
        payment_amount,
        payment_date,
        payment_note,
        created_at
       FROM fee_payments
       WHERE fee_id = ?
       ORDER BY payment_date ASC, id ASC`,
      [fee_id]
    );

    const [[summary]] = await db.query(
      `SELECT
        COALESCE(SUM(payment_amount), 0) AS total_paid
       FROM fee_payments
       WHERE fee_id = ?`,
      [fee_id]
    );

    res.json({
      message: "Fee payments retrieved successfully",
      payments,
      total_paid: Number(summary.total_paid || 0)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve fee payments",
      error: error.message
    });
  }
};


// Add a new payment to an existing fee record
exports.addFeePayment = async (req, res) => {
  try {
    const { fee_id } = req.params;

    const {
      payment_amount,
      payment_date,
      payment_note
    } = req.body;

    if (!payment_amount || !payment_date) {
      return res.status(400).json({
        message: "Payment amount and payment date are required"
      });
    }

    const [feeRows] = await db.query(
      `SELECT id, branch_id, student_id, amount_payable, amount_paid
       FROM fees
       WHERE id = ?
       LIMIT 1`,
      [fee_id]
    );

    if (feeRows.length === 0) {
      return res.status(404).json({
        message: "Fee record not found"
      });
    }

    const fee = feeRows[0];

    if (isBranchScopedAdmin(req.user) && Number(fee.branch_id) !== Number(req.user.branch_id)) {
      return res.status(403).json({
        message: "You can only add fee payments in your own branch"
      });
    }

    const amount = Number(payment_amount || 0);

    await db.query(
      `INSERT INTO fee_payments
      (
        fee_id,
        branch_id,
        student_id,
        payment_amount,
        payment_date,
        payment_note,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fee_id,
        fee.branch_id,
        fee.student_id,
        amount,
        payment_date,
        payment_note || null,
        req.user ? req.user.id : null
      ]
    );

    const totalPaid = Number(fee.amount_paid || 0) + amount;
    const payable = Number(fee.amount_payable || 0);
    const computed = computeFeeStatus(payable, totalPaid);
    const finalStatus = computed.payment_status;

    await db.query(
      `UPDATE fees
       SET amount_paid = ?,
            balance = ?,
           payment_date = ?,
           payment_status = ?
       WHERE id = ?`,
      [
        totalPaid,
          computed.balance,
        payment_date,
        finalStatus,
        fee_id
      ]
    );

    await db.query(
      `INSERT INTO activity_logs
      (branch_id, user_id, action, module, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        fee.branch_id,
        req.user ? req.user.id : null,
        "Fee Payment Added",
        "Fees",
        `Added payment of GHS ${amount} for fee ID ${fee_id}. Total paid: GHS ${totalPaid}, Balance: GHS ${computed.balance}.`
      ]
    );

    let smsStatus = "not_sent";

    try {
      const [studentRows] = await db.query(
        `SELECT
          full_name,
          admission_number,
          mother_phone,
          father_phone
         FROM students
         WHERE id = ?
         LIMIT 1`,
        [fee.student_id]
      );

      if (studentRows.length === 0) {
        smsStatus = "skipped";
        console.error(
          "Fee payment SMS skipped: student record not found for ID",
          fee.student_id
        );
      } else {
        const student = studentRows[0];

        const smsResult = await sendFeePaymentSms({
          studentName: student.full_name,
          paymentAmount: amount,
          totalPaid,
          balance: computed.balance,
          motherPhone: student.mother_phone,
          fatherPhone: student.father_phone
        });

        smsStatus = smsResult && smsResult.skipped
          ? "skipped"
          : "sent";
      }
    } catch (smsError) {
      console.error(
        "Fee payment SMS failed:",
        smsError.message
      );
      smsStatus = "failed";
    }

    res.status(201).json({
      message: "Fee payment added successfully",
      total_paid: totalPaid,
      balance: computed.balance,
      payment_status: finalStatus,
      sms_status: smsStatus
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add fee payment",
      error: error.message
    });
  }
};


// Apply a term fee to all active students in a branch and class
exports.applyClassTermFee = async (req, res) => {
  try {
    const {
      branch_id,
      class_id,
      term,
      academic_year,
      term_fee
    } = req.body;

    // Branch-scoped admins must always use their authenticated branch.
    const effectiveBranchId = isBranchScopedAdmin(req.user)
      ? req.user.branch_id
      : branch_id;

    if (!effectiveBranchId || !class_id || !term || !academic_year || term_fee === undefined) {
      return res.status(400).json({
        message: "Branch, class, term, academic year, and term fee are required."
      });
    }

    const feeAmount = Number(term_fee || 0);

    if (feeAmount <= 0) {
      return res.status(400).json({
        message: "Term fee must be greater than 0."
      });
    }

    const [students] = await db.query(
      `SELECT id, admission_number, full_name, first_name, surname
       FROM students
       WHERE branch_id = ?
         AND class_id = ?
         AND status = 'active'
       ORDER BY full_name ASC, first_name ASC, surname ASC`,
      [effectiveBranchId, class_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "No active students found for the selected branch and class."
      });
    }

    let created = 0;
    let updated = 0;

    for (const student of students) {
      const studentId = student.id;

      const [[previousBalanceRow]] = await db.query(
        `SELECT COALESCE(SUM(balance), 0) AS previous_balance
         FROM fees
         WHERE student_id = ?
           AND branch_id = ?
           AND NOT (term = ? AND academic_year = ?)`,
        [studentId, effectiveBranchId, term, academic_year]
      );

      const previousBalance = Number(previousBalanceRow.previous_balance || 0);
      const newPayable = feeAmount + previousBalance;

      const [existingRows] = await db.query(
        `SELECT id, amount_paid
         FROM fees
         WHERE student_id = ?
           AND branch_id = ?
           AND term = ?
           AND academic_year = ?
         LIMIT 1`,
        [studentId, effectiveBranchId, term, academic_year]
      );

      const amountPaid = existingRows.length ? Number(existingRows[0].amount_paid || 0) : 0;
      const computed = computeFeeStatus(newPayable, amountPaid);

      if (existingRows.length) {
        await db.query(
          `UPDATE fees
           SET amount_payable = ?,
               amount_paid = ?,
               balance = ?,
               payment_status = ?
           WHERE id = ?`,
          [
            newPayable,
            amountPaid,
            computed.balance,
            computed.payment_status,
            existingRows[0].id
          ]
        );

        updated++;
      } else {
        await db.query(
          `INSERT INTO fees
           (branch_id, student_id, term, academic_year, amount_payable, amount_paid, balance, payment_date, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
          [
            effectiveBranchId,
            studentId,
            term,
            academic_year,
            newPayable,
            0,
            newPayable,
            "unpaid"
          ]
        );

        created++;
      }
    }

    await db.query(
      `INSERT INTO activity_logs
       (branch_id, user_id, action, module, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        effectiveBranchId,
        req.user ? req.user.id : null,
        "Class Term Fee Applied",
        "Fees",
        `Applied GHS ${feeAmount} fee to class ID ${class_id} for ${term}, ${academic_year}. Created: ${created}, Updated: ${updated}.`
      ]
    );

    res.json({
      message: "Class term fees applied successfully.",
      total_students: students.length,
      created,
      updated
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to apply class term fees.",
      error: error.message
    });
  }
};
