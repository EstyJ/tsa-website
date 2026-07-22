/*
  ============================================================
  THE SNOOGUMS ACADEMY - CONTACT CONTROLLER
  File: controllers/contactController.js
  ============================================================
*/
const pool = require('../config/db');

exports.sendMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    if (message.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 20 characters'
      });
    }

    // Save to database
    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES (?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        subject || 'General Enquiry',
        message.trim()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Message received! We will get back to you within 24-48 hours.',
      data: { messageId: result.insertId }
    });

  } catch (error) {
    console.error('Contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};
