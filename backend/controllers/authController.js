/*
  ============================================================
  THE SNOOGUMS ACADEMY - AUTH CONTROLLER
  File: controllers/authController.js

  WHAT IS A CONTROLLER?
  A controller contains the BUSINESS LOGIC for a group of routes.
  It receives the request (req), does the work, and sends the response (res).

  Each function here handles one specific API endpoint.
  ============================================================
*/

const bcrypt = require('bcryptjs');
const { sendWelcomeEmail, sendAdminNewStudentEmail } = require('../config/email');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

/*
  ============================================================
  HELPER: generateToken(userId, role)
  Creates a JWT (JSON Web Token) for a user.

  WHAT IS A JWT?
  A JWT is a string that proves who you are without the server
  having to check the database on every single request.

  Structure: header.payload.signature
  - header:    algorithm used to sign it
  - payload:   the data (userId, role, expiry)
  - signature: proves it hasn't been tampered with

  When a user logs in:
  1. Server creates a JWT containing their userId and role
  2. Server sends it to the frontend
  3. Frontend stores it (localStorage or memory)
  4. On every subsequent request, frontend sends it in the header:
     Authorization: Bearer <token>
  5. Server verifies the signature — if valid, trusts the userId inside

  JWT_SECRET (from .env) is what creates the signature.
  If someone changes the payload without knowing the secret,
  the signature won't match and the token is rejected.
  ============================================================
*/
function generateToken(userId, role) {
  return jwt.sign(
    { id: userId, role: role },   // The payload (data stored IN the token)
    process.env.JWT_SECRET,        // The secret key used to sign it
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    // Token expires in 7 days — user must log in again after that
  );
}


/*
  ============================================================
  REGISTER - POST /api/auth/register

  Validates input → checks email isn't taken →
  hashes password → saves to database →
  returns success message (NO token yet — access locked)
  ============================================================
*/
exports.register = async (req, res) => {
  try {
    /*
      Destructure the request body.
      req.body contains the JSON data the frontend sent:
      {
        firstName: "Amaka",
        lastName: "Okafor",
        email: "amaka@gmail.com",
        phonePrefix: "+234",
        phone: "08012345678",
        password: "SecurePass1!"
      }
    */
    const { firstName, lastName, email, phonePrefix, phone, password } = req.body;

    // --- Input Validation ---
    // Even though the frontend validates, ALWAYS validate on backend too.
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Normalise email: lowercase and trim whitespace
    const normalEmail = email.toLowerCase().trim();

    // --- Check if email already exists ---
    /*
      pool.query() executes a SQL query and returns:
      [rows, fields]
      rows   = the result rows (array of objects)
      fields = column metadata (rarely needed)

      We use destructuring: const [rows] = await pool.query(...)
      to get just the rows array.

      The ? is a PREPARED STATEMENT PLACEHOLDER.
      Never concatenate user input directly into SQL strings —
      that's SQL injection (a major security vulnerability).
      
      BAD:  `SELECT * FROM users WHERE email = '${email}'`
      GOOD: `SELECT * FROM users WHERE email = ?`, [email]
      
      MySQL replaces ? with the value safely, escaping any
      special characters that could alter the query structure.
    */
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        // 409 Conflict = resource already exists
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // --- Hash the password ---
    /*
      bcrypt.hash(password, saltRounds)
      
      Hashing = converting a password into an unreadable string.
      It's ONE-WAY: you can verify a password matches a hash,
      but you cannot reverse a hash back to the original password.
      
      saltRounds: 12 means bcrypt runs 2^12 = 4096 iterations.
      Higher = more secure but slower. 12 is the recommended balance.
      
      Example:
      "SecurePass1!" → "$2a$12$LQv3c1yq..."  (always different even for same password)
    */
    const passwordHash = await bcrypt.hash(password, 12);

    // --- Save to database ---
    const [result] = await pool.query(
      `INSERT INTO users 
        (first_name, last_name, email, phone_prefix, phone, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'student', FALSE)`,
      [
        firstName.trim(),
        lastName.trim(),
        normalEmail,
        phonePrefix || '+234',
        phone ? phone.trim() : null,
        passwordHash
      ]
    );
    /*
      result.insertId = the auto-generated id of the new row.
      We'll use this later if we need to do anything with the new user.
    */
    const newUserId = result.insertId;

    // --- Save selected programmes ---
    const { category, programmes } = req.body;
    if (programmes && programmes.length > 0) {
      for (const prog of programmes) {
        try {
          await pool.query(
            `INSERT IGNORE INTO student_programmes (student_id, programme_id, status)
             VALUES (?, ?, 'pending')`,
            [newUserId, prog.id]
          );
        } catch (err) {
          console.error('Programme save error:', err.message);
        }
      }
    }

    // --- Notify admin of new registration ---
    sendAdminNewStudentEmail({
      studentName: `${firstName.trim()} ${lastName.trim()}`,
      email: normalEmail,
      category: category || 'Not specified',
      programmes: programmes || []
    });

    // --- Respond with success ---
    /*
      We do NOT send a JWT token here.
      The student has registered but access is LOCKED until
      admin confirms payment. They can't log in and do anything yet.
      (Login will succeed but dashboard will show "pending payment".)
    */
    // Return JWT token for ALL students so they can pay immediately
    const token = generateToken(newUserId, 'student');

    res.status(201).json({
      success: true,
      message: 'Account created! Complete your payment below to activate your account.',
      token,
      data: {
        id: newUserId,
        firstName: firstName.trim(),
        email: normalEmail
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
};


/*
  ============================================================
  LOGIN - POST /api/auth/login

  Validates credentials → checks role matches →
  checks account is active → returns JWT token
  ============================================================
*/
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      });
    }

    const normalEmail = email.toLowerCase().trim();

    // --- Find the user ---
    /*
      We select the password_hash to compare it,
      and is_active to know if access is unlocked.
      We DON'T send password_hash back to the frontend — ever.
    */
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, role, is_active, password_hash FROM users WHERE email = ?',
      [normalEmail]
    );

    if (users.length === 0) {
      /*
        SECURITY NOTE:
        We say "Invalid email or password" — not "Email not found."
        If we confirmed whether the email exists, an attacker could
        use our login endpoint to enumerate valid email addresses.
        Vague error = less information for attackers.
      */
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // --- Check role matches ---
    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `No ${role} account found with this email address`
      });
    }

    // --- Verify password ---
    /*
      bcrypt.compare(plainPassword, hash)
      Returns true if the plain password matches the stored hash.
      bcrypt handles the salt comparison internally.
    */
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // --- Check if account is active (payment confirmed) ---
    if (!user.is_active && user.role === 'student') {
      return res.status(403).json({
        // 403 Forbidden = authenticated but not authorised
        success: false,
        message: 'Your account is pending payment confirmation. Please contact our admin team.',
        pendingPayment: true
        // Frontend can use pendingPayment: true to show a specific message
      });
    }

    // --- Update last login timestamp ---
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // --- Generate JWT and respond ---
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.first_name}!`,
      token,
      /*
        Send the token to the frontend.
        The frontend stores this (we'll handle that in the dashboard JS)
        and includes it in the Authorization header on future requests:
        Authorization: Bearer <token>
      */
      user: {
        id:        user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
        role:      user.role
        // Note: we deliberately exclude password_hash from this object
      },
      redirect: `/pages/dashboard-${user.role}/index.html`
      // Tell frontend where to redirect: /dashboard/student, /dashboard/teacher, etc.
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};


/*
  ============================================================
  GET PROFILE - GET /api/auth/profile
  Protected route — requires valid JWT token.
  Returns the logged-in user's profile data.
  ============================================================
*/
exports.getProfile = async (req, res) => {
  try {
    /*
      req.user is set by the protect middleware (middleware/auth.js).
      It contains { id, role } decoded from the JWT token.
    */
    const [users] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, phone_prefix,
              role, is_active, created_at, last_login
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/*
  ============================================================
  CHANGE PASSWORD - PATCH /api/auth/change-password
  Protected route — user must be logged in.
  Used by teachers after first login (admin sets initial password).
  ============================================================
*/
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    // Get current password hash from database
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password is correct
    const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash the new password and save
    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
