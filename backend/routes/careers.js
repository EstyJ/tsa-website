/*
  ============================================================
  THE SNOOGUMS ACADEMY - CAREERS ROUTES
  File: routes/careers.js
  ============================================================
*/
const express = require('express');
const router  = express.Router();
const { submitApplication } = require('../controllers/careersController');
const { uploadCV }          = require('../middleware/upload');

// POST /api/careers/apply
// Public — anyone can submit a teaching application
router.post('/apply', uploadCV, submitApplication);

module.exports = router;
