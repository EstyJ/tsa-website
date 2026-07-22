/*
  ============================================================
  THE SNOOGUMS ACADEMY - PAYMENT CONTROLLER
  File: controllers/paymentController.js

  Handles both:
  1. Paystack — online card/transfer payment
  2. Manual   — student submits bank transfer details,
                admin confirms manually

  HOW PAYSTACK WORKS (flow):
  Step 1. Student clicks "Pay with Paystack" on the frontend
  Step 2. Frontend calls POST /api/payment/paystack/initialize
  Step 3. Our server calls Paystack's API to create a transaction
  Step 4. Paystack returns a checkout URL
  Step 5. We send that URL to the frontend
  Step 6. Frontend redirects the student to Paystack's checkout page
  Step 7. Student enters card details ON PAYSTACK'S SITE (not ours)
  Step 8. Paystack redirects back to our callback_url
  Step 9. We call GET /api/payment/paystack/verify/:reference
  Step 10. Our server calls Paystack's verify API to confirm payment
  Step 11. If confirmed → activate student's account
  ============================================================
*/

const axios = require('axios');
const { sendPaymentConfirmedEmail } = require('../config/email');
const pool  = require('../config/db');

/*
  Paystack API base URL — all Paystack requests go here.
  The Authorization header uses our secret key from .env.
*/
const PAYSTACK_BASE = 'https://api.paystack.co';


/*
  ============================================================
  INITIALIZE PAYSTACK PAYMENT
  POST /api/payment/paystack/initialize
  ============================================================
*/
exports.initializePaystack = async (req, res) => {
  try {
    const { amount, courseId } = req.body;
    /*
      amount should be in NAIRA from the frontend.
      Paystack expects amounts in KOBO (1 Naira = 100 Kobo).
      So we multiply by 100.
    */

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    // Get the student's email from the database (set by protect middleware)
    const [users] = await pool.query(
      'SELECT email, first_name FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student = users[0];

    /*
      Call Paystack's initialize endpoint.
      We send:
      - email: student's email (Paystack sends receipt to this)
      - amount: in kobo
      - reference: our own unique reference (to track this payment)
      - callback_url: where Paystack redirects after payment
      - metadata: extra info we want Paystack to return to us
    */
    const reference = `TSA-${req.user.id}-${Date.now()}`;

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email:        student.email,
        amount:       Math.round(amount * 100), // Convert to kobo
        reference:    reference,
        callback_url: `http://127.0.0.1:5500/pages/payment-success.html`,
        metadata: {
          studentId:   req.user.id,
          studentName: student.first_name,
          courseId:    courseId || null,
          custom_fields: [
            {
              display_name: 'Student Name',
              variable_name: 'student_name',
              value: student.first_name
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    /*
      Save the pending payment to our database BEFORE redirecting.
      If something goes wrong during the Paystack flow, we still
      have a record of the attempt with the reference.
    */
    await pool.query(
      `INSERT INTO payments
        (student_id, course_id, amount, currency, payment_method,
         paystack_reference, paystack_status, status)
       VALUES (?, ?, ?, 'NGN', 'paystack', ?, 'pending', 'pending')`,
      [
        req.user.id,
        courseId || null,
        amount,
        reference
      ]
    );

    /*
      Paystack returns:
      {
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: "https://checkout.paystack.com/...",
          access_code: "...",
          reference: "TSA-5-1702000000000"
        }
      }
    */
    res.status(200).json({
      success: true,
      data: {
        authorizationUrl: response.data.data.authorization_url,
        reference:        reference
      }
    });

  } catch (error) {
    console.error('Paystack initialize error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed. Please try again.'
    });
  }
};


/*
  ============================================================
  VERIFY PAYSTACK PAYMENT
  GET /api/payment/paystack/verify/:reference
  Called after Paystack redirects the student back to our site.
  ============================================================
*/
exports.verifyPaystack = async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify the payment with Paystack's API
    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paystackData = response.data.data;
    /*
      paystackData.status will be:
      "success"   → payment completed ✅
      "failed"    → payment failed ❌
      "abandoned" → user left the checkout page
    */

    // Update our payment record
    await pool.query(
      `UPDATE payments
       SET paystack_status = ?,
           status = ?,
           confirmed_at = CURRENT_TIMESTAMP
       WHERE paystack_reference = ?`,
      [
        paystackData.status,
        paystackData.status === 'success' ? 'confirmed' : 'rejected',
        reference
      ]
    );

    if (paystackData.status === 'success') {
      /*
        Payment confirmed — activate the student's account.
        This is the key step: is_active = TRUE gives them
        access to their dashboard and courses.
      */
      await pool.query(
        'UPDATE users SET is_active = TRUE WHERE id = ?',
        [req.user.id]
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified! Your account is now active.',
        data: {
          reference:   reference,
          amount:      paystackData.amount / 100, // Convert back from kobo to naira
          paidAt:      paystackData.paid_at
        }
      });

    } else {
      res.status(400).json({
        success: false,
        message: `Payment was not successful. Status: ${paystackData.status}`,
        data: { reference }
      });
    }

  } catch (error) {
    console.error('Paystack verify error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed. Please contact support.'
    });
  }
};


/*
  ============================================================
  SUBMIT MANUAL PAYMENT
  POST /api/payment/manual

  Student submits their bank transfer details.
  Admin reviews and manually confirms.
  ============================================================
*/
exports.submitManualPayment = async (req, res) => {
  try {
    const { amount, courseId, bankName, accountName, transferDate } = req.body;

    if (!amount || !bankName || !accountName || !transferDate) {
      return res.status(400).json({
        success: false,
        message: 'Amount, bank name, account name, and transfer date are required'
      });
    }

    // Check for existing pending payment from this student
    const [existing] = await pool.query(
      `SELECT id FROM payments
       WHERE student_id = ? AND payment_method = 'manual' AND status = 'pending'`,
      [req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending manual payment. Please wait for admin confirmation or contact us.'
      });
    }

    // Save to database
    const [result] = await pool.query(
      `INSERT INTO payments
        (student_id, course_id, amount, currency, payment_method,
         bank_name, account_name, transfer_date, status)
       VALUES (?, ?, ?, 'NGN', 'manual', ?, ?, ?, 'pending')`,
      [
        req.user.id,
        courseId || null,
        amount,
        bankName.trim(),
        accountName.trim(),
        transferDate
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Manual payment details submitted. Our admin team will review and confirm within 24 hours.',
      data: { paymentId: result.insertId }
    });

  } catch (error) {
    console.error('Manual payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};


/*
  ============================================================
  GET PAYMENT HISTORY
  GET /api/payment/history
  ============================================================
*/
exports.getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT
         id, amount, currency, payment_method,
         paystack_reference, paystack_status,
         bank_name, account_name, transfer_date,
         status, confirmed_at, created_at
       FROM payments
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
