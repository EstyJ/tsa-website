/*
  ============================================================
  THE SNOOGUMS ACADEMY - ADMIN CONTROLLER
  File: controllers/adminController.js
  Handles all admin dashboard data operations.
  ============================================================
*/
const pool = require('../config/db');
const { sendPaymentConfirmedEmail, sendTeacherAccountCreatedEmail, sendLiveClassScheduledEmail } = require('../config/email');
const bcrypt = require('bcryptjs');

/* ============================================================
   GET STATS — Overview numbers for the dashboard cards
============================================================ */
exports.getStats = async (req, res) => {
  try {
    const [[{ totalStudents }]]        = await pool.query(`SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'`);
    const [[{ pendingPayments }]]      = await pool.query(`SELECT COUNT(*) AS pendingPayments FROM payments WHERE status = 'pending'`);
    const [[{ pendingApplications }]]  = await pool.query(`SELECT COUNT(*) AS pendingApplications FROM career_applications WHERE status = 'pending'`);
    const [[{ unreadMessages }]]       = await pool.query(`SELECT COUNT(*) AS unreadMessages FROM contact_messages WHERE is_read = FALSE`);
    const [[{ activeStudents }]]       = await pool.query(`SELECT COUNT(*) AS activeStudents FROM users WHERE role = 'student' AND is_active = TRUE`);

    // Recent registrations (last 5)
    const [recentRegistrations] = await pool.query(
      `SELECT id, first_name, last_name, email, is_active, created_at
       FROM users WHERE role = 'student'
       ORDER BY created_at DESC LIMIT 5`
    );

    // Recent pending payments (last 5)
    const [recentPayments] = await pool.query(
      `SELECT p.id, p.amount, p.payment_method, p.status, p.created_at,
              u.first_name, u.last_name, u.email
       FROM payments p
       JOIN users u ON p.student_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC LIMIT 5`
    );

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        pendingPayments,
        pendingApplications,
        unreadMessages,
        activeStudents,
        recentRegistrations,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   GET ALL USERS
============================================================ */
exports.getUsers = async (req, res) => {
  try {
    /*
      req.query contains URL query parameters.
      e.g. GET /api/admin/users?role=student
      req.query.role = 'student'
    */
    const { role } = req.query;

    let query = `SELECT id, first_name, last_name, email, phone, role,
                        is_active, created_at, last_login
                 FROM users`;
    const params = [];

    if (role && role !== 'all') {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.query(query, params);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   UPDATE USER STATUS (activate / deactivate)
   This is how admin grants or revokes course access.
============================================================ */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own account status'
      });
    }

    await pool.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    res.status(200).json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   DELETE USER
============================================================ */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   GET ALL PAYMENTS
============================================================ */
exports.getPayments = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT p.id, p.amount, p.currency, p.payment_method,
             p.paystack_reference, p.bank_name, p.account_name,
             p.transfer_date, p.status, p.created_at, p.confirmed_at,
             u.first_name, u.last_name, u.email
      FROM payments p
      JOIN users u ON p.student_id = u.id`;

    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const [payments] = await pool.query(query, params);
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   CONFIRM OR REJECT A PAYMENT
   This is the most important admin action —
   confirming a payment activates the student's account.
============================================================ */
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    // action = 'confirm' or 'reject'

    if (!['confirm', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be confirm or reject' });
    }

    // Get the payment to find the student
    const [payments] = await pool.query(
      'SELECT student_id FROM payments WHERE id = ?', [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const studentId  = payments[0].student_id;
    const newStatus  = action === 'confirm' ? 'confirmed' : 'rejected';

    // Update the payment record
    await pool.query(
      `UPDATE payments
       SET status = ?, confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP, notes = ?
       WHERE id = ?`,
      [newStatus, req.user.id, notes || null, id]
    );

    // If confirmed → activate the student's account
    if (action === 'confirm') {
      await pool.query(
        'UPDATE users SET is_active = TRUE WHERE id = ?',
        [studentId]
      );
    }

    res.status(200).json({
      success: true,
      message: `Payment ${newStatus} successfully${action === 'confirm' ? '. Student account has been activated.' : '.'}`
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   GET CAREER APPLICATIONS
============================================================ */
exports.getApplications = async (req, res) => {
  try {
    const [applications] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, subject,
              experience, qualification, availability, bio, cv_path,
              status, admin_notes, created_at
       FROM career_applications
       ORDER BY created_at DESC`
    );
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   UPDATE APPLICATION STATUS
============================================================ */
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.query(
      'UPDATE career_applications SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes || null, id]
    );

    res.status(200).json({ success: true, message: `Application marked as ${status}` });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   GET CONTACT MESSAGES
============================================================ */
exports.getMessages = async (req, res) => {
  try {
    const [messages] = await pool.query(
      `SELECT id, name, email, subject, message, is_read, created_at
       FROM contact_messages
       ORDER BY created_at DESC`
    );
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   MARK MESSAGE AS READ
============================================================ */
exports.markMessageRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
      [req.params.id]
    );
    res.status(200).json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   GET COURSES
============================================================ */
exports.getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.id, c.title, c.category, c.level, c.is_active, c.created_at,
              u.first_name, u.last_name
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   CREATE TEACHER ACCOUNT FROM APPLICATION
   Admin clicks "Create Account" on a shortlisted application.
   This creates a teacher user account with a temporary password.
============================================================ */
exports.createTeacherAccount = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Get the application details
    const [applications] = await pool.query(
      'SELECT * FROM career_applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = applications[0];

    // Check if teacher account already exists with this email
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [app.email.toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash the temporary password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the teacher account
    const [result] = await pool.query(
      `INSERT INTO users
        (first_name, last_name, email, phone, password_hash, role, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, 'teacher', TRUE, TRUE)`,
      [
        app.first_name,
        app.last_name,
        app.email.toLowerCase(),
        app.phone || null,
        passwordHash
      ]
    );

    // Update application status to hired
    await pool.query(
      'UPDATE career_applications SET status = "hired" WHERE id = ?',
      [applicationId]
    );

    res.status(201).json({
      success: true,
      message: `Teacher account created for ${app.first_name} ${app.last_name}. They can now log in with their email and the password you set.`,
      data: {
        teacherId: result.insertId,
        name: `${app.first_name} ${app.last_name}`,
        email: app.email
      }
    });

  } catch (error) {
    console.error('Create teacher account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   GET ALL LIVE CLASSES
============================================================ */
exports.getLiveClasses = async (req, res) => {
  try {
    const [classes] = await pool.query(
      `SELECT lc.id, lc.title, lc.jitsi_room, lc.scheduled_at,
              lc.duration_mins, lc.status, lc.clocked_in_at,
              u.first_name AS teacher_first, u.last_name AS teacher_last,
              c.title AS course_title
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       JOIN courses c ON lc.course_id = c.id
       ORDER BY lc.scheduled_at DESC`
    );
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   SCHEDULE A LIVE CLASS
   Admin creates a live class session for a teacher.
============================================================ */
exports.scheduleLiveClass = async (req, res) => {
  try {
    const { title, courseId, teacherId, scheduledAt, durationMins } = req.body;

    if (!title || !courseId || !teacherId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Title, course, teacher, and scheduled time are required'
      });
    }

    /*
      Generate a unique Jitsi room name.
      Format: tsa-courseId-timestamp
      e.g. tsa-1-1702000000000
      This becomes the Jitsi Meet URL: meet.jit.si/tsa-1-1702000000000
    */
    const jitsiRoom = `tsa-${courseId}-${Date.now()}`;

    const [result] = await pool.query(
      `INSERT INTO live_classes
        (title, course_id, teacher_id, jitsi_room, scheduled_at, duration_mins, status)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [title, courseId, teacherId, jitsiRoom, scheduledAt, durationMins || 60]
    );

    // Send email to teacher
    const [teachers] = await pool.query(
      'SELECT first_name, email FROM users WHERE id = ?', [teacherId]
    );
    if (teachers.length > 0) {
      sendLiveClassScheduledEmail({
        name: teachers[0].first_name,
        email: teachers[0].email,
        className: title,
        scheduledAt,
        durationMins: durationMins || 60,
        jitsiRoom,
        courseName: title
      });
    }

    // Send email to all enrolled students
    const [students] = await pool.query(
      `SELECT DISTINCT u.first_name, u.email
       FROM users u
       JOIN enrollments e ON u.id = e.student_id
       WHERE e.course_id = ? AND u.role = 'student'`,
      [courseId]
    );

    for (const student of students) {
      sendLiveClassScheduledEmail({
        name: student.first_name,
        email: student.email,
        className: title,
        scheduledAt,
        durationMins: durationMins || 60,
        jitsiRoom,
        courseName: title
      });
    }

    res.status(201).json({
      success: true,
      message: `Live class scheduled! Emails sent to teacher${students.length > 0 ? ` and ${students.length} student(s)` : ''}.`,
      data: { classId: result.insertId, jitsiRoom }
    });

  } catch (error) {
    console.error('Schedule live class error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   CREATE COURSE
   Admin adds a new course from the dashboard.
============================================================ */
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, durationWeeks, lessonCount, instructorId } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') +
      '-' + Date.now();

    const [result] = await pool.query(
      `INSERT INTO courses
        (title, slug, description, category, level, duration_weeks, lesson_count, instructor_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        title.trim(),
        slug,
        description || null,
        category,
        level || 'all',
        durationWeeks || 0,
        lessonCount || 0,
        instructorId || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully!',
      data: { courseId: result.insertId }
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/* ============================================================
   CREATE STUDENT ACCOUNT (admin creates for student)
============================================================ */
exports.createStudentAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, category, programmes } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const bcrypt = require('bcryptjs');
    const normalEmail  = email.toLowerCase().trim();

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'student', TRUE)`,
      [firstName.trim(), lastName.trim(), normalEmail, phone || null, passwordHash]
    );

    const newUserId = result.insertId;

    // Save programmes if provided
    if (programmes && programmes.length > 0) {
      for (const prog of programmes) {
        await pool.query(
          `INSERT IGNORE INTO student_programmes (student_id, programme_id, status)
           VALUES (?, ?, 'active')`,
          [newUserId, prog.id]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: `Student account created for ${firstName} ${lastName}`,
      data: { studentId: newUserId }
    });
  } catch (error) {
    console.error('Create student account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ============================================================
   GET STUDENT PROGRAMMES (what category + programmes a student has)
============================================================ */
exports.getStudentProgrammes = async (req, res) => {
  try {
    const [programmes] = await pool.query(
      `SELECT sp.id, sp.status, sp.enrolled_at, sp.payment_frequency,
              p.name, p.category, p.duration_per_contact, p.price_per_contact
       FROM student_programmes sp
       JOIN programmes p ON sp.programme_id = p.id
       WHERE sp.student_id = ?`,
      [req.params.id]
    );
    res.status(200).json({ success: true, data: programmes });
  } catch (error) {
    console.error('Get student programmes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ============================================================
   POST ANNOUNCEMENT
   Admin posts to all, teachers post to their category
============================================================ */
exports.postAnnouncement = async (req, res) => {
  try {
    const { title, body, target } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and message body are required' });
    }

    await pool.query(
      `INSERT INTO announcements (title, body, posted_by, target)
       VALUES (?, ?, ?, ?)`,
      [title.trim(), body.trim(), req.user.id, target || 'all']
    );

    res.status(201).json({ success: true, message: 'Announcement posted! It will expire in 24 hours.' });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ============================================================
   GET ANNOUNCEMENTS (only non-expired ones)
============================================================ */
exports.getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await pool.query(
      `SELECT a.id, a.title, a.body, a.target, a.expires_at, a.created_at,
              u.first_name, u.last_name, u.role
       FROM announcements a
       JOIN users u ON a.posted_by = u.id
       WHERE a.expires_at > NOW()
       ORDER BY a.created_at DESC`
    );
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
