/*
  ============================================================
  THE SNOOGUMS ACADEMY - PAYMENT ROUTES
  File: routes/payment.js
  ============================================================
*/
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  initializePaystack,
  verifyPaystack,
  submitManualPayment,
  getPaymentHistory
} = require('../controllers/paymentController');

/*
  All payment routes require the user to be logged in.
  A student must have an account before they can pay.
*/

// POST /api/payment/paystack/initialize
// Starts a Paystack payment session, returns a checkout URL
router.post('/paystack/initialize', protect, initializePaystack);

// GET /api/payment/paystack/verify/:reference
// Called after Paystack redirects back to our site — verifies the payment
router.get('/paystack/verify/:reference', protect, verifyPaystack);

// POST /api/payment/manual
// Student submits manual bank transfer details for admin to review
router.post('/manual', protect, submitManualPayment);

// GET /api/payment/history
// Returns the logged-in student's payment history
router.get('/history', protect, getPaymentHistory);

module.exports = router;
