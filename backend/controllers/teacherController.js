/*
  ============================================================
  THE SNOOGUMS ACADEMY - TEACHER CONTROLLER
  File: controllers/teacherController.js
  ============================================================
*/
const pool = require('../config/db');

/* Get teacher's scheduled classes */
exports.getClasses = async (req, res) => {
  try {
    // Auto-mark classes as completed if their time + duration has passed
    await pool.query(
      `UPDATE live_classes
       SET status = 'completed'
       WHERE status IN ('scheduled','live')
         AND DATE_ADD(scheduled_at, INTERVAL duration_mins MINUTE) < NOW()`
    );

    const [classes] = await pool.query(
      `SELECT lc.id, lc.title, lc.jitsi_room, lc.scheduled_at,
              lc.duration_mins, lc.status, lc.clocked_in_at,
              c.title AS course_title
       FROM live_classes lc
       JOIN courses c ON lc.course_id = c.id
       WHERE lc.teacher_id = ?
       ORDER BY lc.scheduled_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* Clock in — marks class as live, students see notification */
exports.clockIn = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify this class belongs to this teacher
    const [classes] = await pool.query(
      'SELECT id, status FROM live_classes WHERE id = ? AND teacher_id = ?',
      [id, req.user.id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classes[0].status === 'live') {
      return res.status(400).json({ success: false, message: 'You are already clocked in for this class' });
    }

    // Set status to live and record clock-in time
    await pool.query(
      `UPDATE live_classes
       SET status = 'live', clocked_in_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Clocked in successfully! Students can now see your class is live.'
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* Get students enrolled in teacher's courses */
exports.getStudents = async (req, res) => {
  try {
    // Get students enrolled in teacher's courses
    const [enrolled] = await pool.query(
      `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.is_active,
              c.title AS course_title, c.category,
              'enrolled' AS source
       FROM users u
       JOIN enrollments e ON u.id = e.student_id
       JOIN courses c ON e.course_id = c.id
       WHERE c.instructor_id = ? AND u.role = 'student'
       ORDER BY u.first_name ASC`,
      [req.user.id]
    );

    // Also get students who registered for same category as teacher's courses
    const [byCategory] = await pool.query(
      `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.is_active,
              p.name AS course_title, p.category,
              'registered' AS source
       FROM users u
       JOIN student_programmes sp ON u.id = sp.student_id
       JOIN programmes p ON sp.programme_id = p.id
       JOIN courses c ON c.category = p.category
       WHERE c.instructor_id = ? AND u.role = 'student'
       ORDER BY u.first_name ASC`,
      [req.user.id]
    );

    // Merge and deduplicate by student ID
    const seen = new Set();
    const students = [];
    for (const s of [...enrolled, ...byCategory]) {
      if (!seen.has(s.id)) { seen.add(s.id); students.push(s); }
    }

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* Get attendance records for teacher's completed classes */
exports.getAttendance = async (req, res) => {
  try {
    const [records] = await pool.query(
      `SELECT lc.id, lc.title, lc.scheduled_at, lc.duration_mins,
              COUNT(a.id) AS student_count
       FROM live_classes lc
       LEFT JOIN attendance a ON lc.id = a.live_class_id
       WHERE lc.teacher_id = ? AND lc.status = 'completed'
       GROUP BY lc.id
       ORDER BY lc.scheduled_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* Upload course content (videos, slides, documents) */
exports.uploadContent = async (req, res) => {
  try {
    const { title, type, description } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!title || !filePath) {
      return res.status(400).json({ success: false, message: 'Title and file are required' });
    }

    const targetCategory  = req.body.targetCategory  || 'all';
    const targetProgramme = req.body.targetProgramme || null;

    await pool.query(
      `INSERT INTO course_content (teacher_id, title, type, description, file_path, target_category, target_programme)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), type || 'document', description || null, filePath, targetCategory, targetProgramme || null]
    );

    res.status(201).json({ success: true, message: 'Content uploaded successfully!' });
  } catch (error) {
    console.error('Upload content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* Get teacher's uploaded content */
exports.getContent = async (req, res) => {
  try {
    const [content] = await pool.query(
      `SELECT id, title, type, description, file_path, created_at
       FROM course_content WHERE teacher_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* Teacher posts announcement to their category students */
exports.postAnnouncement = async (req, res) => {
  try {
    const { title, body, target } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    await pool.query(
      `INSERT INTO announcements (title, body, posted_by, target)
       VALUES (?, ?, ?, ?)`,
      [title.trim(), body.trim(), req.user.id, target || 'all']
    );

    res.status(201).json({ success: true, message: 'Announcement posted! It will expire in 24 hours.' });
  } catch (error) {
    console.error('Teacher post announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
