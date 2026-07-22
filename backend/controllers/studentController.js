/*
  ============================================================
  THE SNOOGUMS ACADEMY - STUDENT CONTROLLER
  File: controllers/studentController.js
  ============================================================
*/
const pool = require('../config/db');

exports.getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.id, c.title, c.category, c.level, c.duration_weeks,
              c.lesson_count, c.thumbnail, c.is_active
       FROM courses c
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.student_id = ? AND e.is_active = TRUE`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLiveClasses = async (req, res) => {
  try {
    const [classes] = await pool.query(
      `SELECT lc.id, lc.title, lc.jitsi_room, lc.scheduled_at,
              lc.duration_mins, lc.status, lc.clocked_in_at,
              u.first_name AS teacher_first, u.last_name AS teacher_last,
              c.title AS course_title
       FROM live_classes lc
       JOIN courses c ON lc.course_id = c.id
       JOIN users u ON lc.teacher_id = u.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.student_id = ?
         AND lc.status IN ('scheduled', 'live')
         AND lc.scheduled_at >= NOW() - INTERVAL 2 HOUR
       ORDER BY lc.scheduled_at ASC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* Get student's selected programmes with pricing */
exports.getMyProgrammes = async (req, res) => {
  try {
    const [programmes] = await pool.query(
      `SELECT sp.id, sp.contacts_per_week, sp.status,
              p.name, p.category, p.duration_per_contact, p.price_per_contact
       FROM student_programmes sp
       JOIN programmes p ON sp.programme_id = p.id
       WHERE sp.student_id = ?`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: programmes });
  } catch (error) {
    console.error('Get my programmes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
