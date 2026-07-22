/*
  ============================================================
  THE SNOOGUMS ACADEMY - AUTH ROUTES
  File: routes/auth.js

  WHAT ARE ROUTES?
  A route is a URL path + HTTP method + handler function.
  When the frontend calls POST /api/auth/register, Express
  finds the matching route here and runs its handler.

  HTTP METHODS:
  GET    → Read/retrieve data  (e.g. get user profile)
  POST   → Create/send data    (e.g. register, login)
  PUT    → Replace data        (e.g. update whole profile)
  PATCH  → Update part of data (e.g. change just password)
  DELETE → Remove data         (e.g. delete account)

  This file only DEFINES the routes and which controller
  function handles each one. The actual LOGIC lives in
  controllers/authController.js — separation of concerns.
  ============================================================
*/

const express = require('express');
const router  = express.Router();
/*
  express.Router() creates a mini-app that handles routes.
  We attach routes to this router, then export it.
  In server.js, it gets mounted at /api/auth —
  so router.post('/register') becomes POST /api/auth/register.
*/

// Import controller functions
const {
  register,
  login,
  getProfile,
  changePassword
} = require('../controllers/authController');

// Import authentication middleware
const { protect } = require('../middleware/auth');
/*
  protect is a middleware function that:
  1. Reads the JWT token from the request header
  2. Verifies it's valid and not expired
  3. Attaches the user data to req.user
  4. Calls next() to proceed to the route handler
  If the token is missing or invalid, it returns a 401 error.
  We add it to any route that requires the user to be logged in.
*/


// ---- PUBLIC ROUTES (no login required) ----

// POST /api/auth/register
// Called when a student submits the registration form
router.post('/register', register);

// POST /api/auth/login
// Called when any user (student/teacher/admin) logs in
router.post('/login', login);


// ---- PROTECTED ROUTES (must be logged in) ----

// GET /api/auth/profile
// Returns the logged-in user's profile data
router.get('/profile', protect, getProfile);

// PATCH /api/auth/change-password
// Allows a user to change their own password
router.patch('/change-password', protect, changePassword);


module.exports = router;
