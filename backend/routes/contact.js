/*
  ============================================================
  THE SNOOGUMS ACADEMY - CONTACT ROUTES
  File: routes/contact.js
  ============================================================
*/
const express = require('express');
const router  = express.Router();
const { sendMessage } = require('../controllers/contactController');

// POST /api/contact
// Public — anyone can send a contact message
router.post('/', sendMessage);

module.exports = router;
