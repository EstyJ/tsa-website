/*
  ============================================================
  THE SNOOGUMS ACADEMY - AUTHENTICATION MIDDLEWARE
  File: middleware/auth.js

  WHAT IS MIDDLEWARE?
  Middleware is a function that runs BETWEEN receiving a request
  and sending a response. It has access to req, res, and next().
  Calling next() passes control to the NEXT middleware or route handler.
  Not calling next() (and not sending a response) hangs the request.

  This file exports two middleware functions:
  1. protect     — verifies the user is logged in (valid JWT)
  2. restrictTo  — verifies the user has a specific role
  ============================================================
*/

const jwt  = require('jsonwebtoken');
const pool = require('../config/db');


/*
  ============================================================
  protect — VERIFY JWT TOKEN
  
  Every protected route uses this middleware.
  It reads the token from the Authorization header,
  verifies it, and attaches the user to req.user.
  ============================================================
*/
exports.protect = async (req, res, next) => {
  try {
    let token;

    /*
      JWT tokens are sent in the Authorization header like this:
      Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      
      We check that:
      1. The Authorization header exists
      2. It starts with "Bearer "
      Then we extract the token part (everything after "Bearer ")
    */
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
      // "Bearer abc123".split(' ') = ["Bearer", "abc123"]
      // [1] gets the second element = "abc123"
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorised. Please log in.'
      });
    }

    /*
      jwt.verify(token, secret)
      Checks that:
      1. The token was signed with OUR JWT_SECRET (not faked)
      2. The token hasn't expired
      If either check fails, it throws an error (caught below).
      If both pass, it returns the DECODED PAYLOAD:
      { id: 5, role: 'student', iat: 1234567890, exp: 1235432490 }
    */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      We verify the user still exists in the database.
      Why? In rare cases, a user might be deleted after their token
      was issued. Without this check, a deleted user's token would
      still work. This extra query catches that edge case.
    */
    const [users] = await pool.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'The user associated with this token no longer exists'
      });
    }

    /*
      Attach the user info to req.user so route handlers can access it.
      Now any route using this middleware can do:
      const userId = req.user.id;
      const userRole = req.user.role;
    */
    req.user = users[0];

    next(); // All checks passed — proceed to the route handler

  } catch (error) {
    /*
      jwt.verify throws specific error types we can handle gracefully:
      JsonWebTokenError  → token is malformed or has wrong signature
      TokenExpiredError  → token has expired (user needs to log in again)
    */
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};


/*
  ============================================================
  restrictTo — ROLE-BASED ACCESS CONTROL
  
  Used AFTER protect to further restrict which roles can access
  a specific route.
  
  Usage example:
  router.delete('/users/:id', protect, restrictTo('admin'), deleteUser)
  
  restrictTo returns a middleware function.
  This is called a "closure" — a function that returns another function,
  capturing the 'roles' parameter in its scope.
  ============================================================
*/
exports.restrictTo = (...roles) => {
  /*
    ...roles uses the REST parameter syntax.
    It collects all arguments into an array.
    restrictTo('admin', 'teacher') → roles = ['admin', 'teacher']
  */
  return (req, res, next) => {
    /*
      req.user.role was set by the protect middleware above.
      .includes() checks if the user's role is in the allowed roles list.
    */
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires ${roles.join(' or ')} privileges.`
      });
    }
    next();
  };
};
