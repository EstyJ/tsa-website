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
    // Get student's categories
    const [progs] = await pool.query(
      `SELECT DISTINCT p.category FROM student_programmes sp
       JOIN programmes p ON sp.programme_id = p.id
       WHERE sp.student_id = ?`,
      [req.user.id]
    );
    const categories = progs.map(p => p.category);

    // Get live classes from courses matching student's categories
    // OR directly assigned to this student
    let classes = [];

    if (categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT DISTINCT lc.id, lc.title, lc.jitsi_room, lc.scheduled_at,
                lc.duration_mins, lc.status, lc.clocked_in_at,
                u.first_name AS teacher_first, u.last_name AS teacher_last,
                c.title AS course_title, c.category
         FROM live_classes lc
         JOIN courses c ON lc.course_id = c.id
         JOIN users u ON lc.teacher_id = u.id
         WHERE c.category IN (${placeholders})
           AND lc.scheduled_at >= NOW() - INTERVAL 7 DAY
         ORDER BY lc.scheduled_at ASC`,
        categories
      );
      classes = rows;
    }

    // Also get classes from enrollments
    const [enrolled] = await pool.query(
      `SELECT DISTINCT lc.id, lc.title, lc.jitsi_room, lc.scheduled_at,
              lc.duration_mins, lc.status, lc.clocked_in_at,
              u.first_name AS teacher_first, u.last_name AS teacher_last,
              c.title AS course_title, c.category
       FROM live_classes lc
       JOIN courses c ON lc.course_id = c.id
       JOIN users u ON lc.teacher_id = u.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.student_id = ?
         AND lc.scheduled_at >= NOW() - INTERVAL 7 DAY
       ORDER BY lc.scheduled_at ASC`,
      [req.user.id]
    );

    // Merge and deduplicate
    const allIds = new Set(classes.map(c => c.id));
    for (const row of enrolled) {
      if (!allIds.has(row.id)) classes.push(row);
    }

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


/* Get announcements for this student (based on their category) */
exports.getAnnouncements = async (req, res) => {
  try {
    // Get student's categories
    const [progs] = await pool.query(
      `SELECT DISTINCT p.category FROM student_programmes sp
       JOIN programmes p ON sp.programme_id = p.id
       WHERE sp.student_id = ?`,
      [req.user.id]
    );

    const categories = progs.map(p => p.category);

    const [announcements] = await pool.query(
      `SELECT a.id, a.title, a.body, a.target, a.created_at,
              CONCAT(u.first_name, ' ', u.last_name) AS posted_by,
              u.role AS poster_role
       FROM announcements a
       JOIN users u ON a.posted_by = u.id
       WHERE a.expires_at > NOW()
         AND (a.target = 'all' ${categories.length > 0 ? `OR a.target IN (${categories.map(() => '?').join(',')})` : ''})
       ORDER BY a.created_at DESC`,
      categories.length > 0 ? categories : []
    );

    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    console.error('Get student announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* Add more programmes to student account */
exports.addProgrammes = async (req, res) => {
  try {
    const { programmes } = req.body;
    if (!programmes || programmes.length === 0) {
      return res.status(400).json({ success: false, message: 'No programmes selected' });
    }
    for (const prog of programmes) {
      await pool.query(
        `INSERT IGNORE INTO student_programmes (student_id, programme_id, status)
         VALUES (?, ?, 'pending')`,
        [req.user.id, prog.id]
      );
    }
    res.status(201).json({
      success: true,
      message: `${programmes.length} programme(s) added successfully! Admin will activate them.`
    });
  } catch (error) {
    console.error('Add programmes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* Get content uploaded for a specific programme */
exports.getContentByProgramme = async (req, res) => {
  try {
    const { progId } = req.params;

    // Get the programme details to find its category
    const [progs] = await pool.query(
      'SELECT category, name FROM programmes WHERE id = ?', [progId]
    );

    if (progs.length === 0) {
      return res.status(404).json({ success: false, message: 'Programme not found' });
    }

    const category = progs[0].category;
    const progName = progs[0].name;

    // Get content matching this programme or category
    const [content] = await pool.query(
      `SELECT cc.id, cc.title, cc.type, cc.description, cc.file_path, cc.created_at,
              CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by
       FROM course_content cc
       JOIN users u ON cc.teacher_id = u.id
       WHERE cc.target_category = ? OR cc.target_category = 'all'
         OR cc.target_programme = ?
       ORDER BY cc.created_at DESC`,
      [category, progName]
    );

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Get content by programme error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
