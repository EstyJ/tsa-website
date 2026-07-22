/*
  ============================================================
  THE SNOOGUMS ACADEMY - CAREERS CONTROLLER
  File: controllers/careersController.js
  ============================================================
*/
const pool = require('../config/db');
const { sendApplicationReceivedEmail } = require('../config/email');

exports.submitApplication = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      subject, experience, qualification,
      bio
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !subject || !bio) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Get CV file path — multer puts file info in req.file
    const cvPath = req.file ? req.file.path : null;
    if (!cvPath) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your CV'
      });
    }

    /*
      Parse availability — it comes as a JSON string from the form.
      req.body.availability might be:
      '["weekday-morning", "weekends"]' → we parse it to an array
      then store it as JSON in MySQL.
    */
    let availability = [];
    try {
      availability = JSON.parse(req.body.availability || '[]');
    } catch {
      availability = [];
    }

    // Check if this email already applied
    const [existing] = await pool.query(
      'SELECT id FROM career_applications WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email address already exists. Our team will be in touch.'
      });
    }

    // Save application to database
    const [result] = await pool.query(
      `INSERT INTO career_applications
        (first_name, last_name, email, phone, subject, experience,
         qualification, availability, bio, cv_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        subject,
        experience || null,
        qualification || null,
        JSON.stringify(availability),
        bio.trim(),
        cvPath
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! We will review it and contact you within 3-5 business days.',
      data: { applicationId: result.insertId }
    });

  } catch (error) {
    console.error('Career application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};
