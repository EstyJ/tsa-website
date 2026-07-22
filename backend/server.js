/*
  ============================================================
  THE SNOOGUMS ACADEMY - SERVER ENTRY POINT
  File: server.js

  WHAT IS THIS FILE?
  This is where the backend STARTS. When you run "npm run dev",
  Node.js reads this file first and executes it top to bottom.

  It does four things:
  1. Loads configuration (environment variables, middleware)
  2. Connects to the database
  3. Registers all our API routes
  4. Starts listening for incoming requests on a port

  WHAT IS EXPRESS?
  Express is a web framework for Node.js. Without it, you'd
  have to write raw HTTP handling code from scratch — hundreds
  of lines just to receive a request. Express makes it simple:
  app.get('/api/users', handler)  ← done in one line.
  ============================================================
*/

// Load environment variables FIRST — before anything else.
// This makes process.env.PORT, process.env.JWT_SECRET etc. available.
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const rateLimit = require('express-rate-limit');

/*
  Import our route files.
  Each file handles a specific group of related endpoints.
  We haven't created these files yet — we'll build them next.
*/
const authRoutes    = require('./routes/auth');
const careersRoutes = require('./routes/careers');
const contactRoutes = require('./routes/contact');
const paymentRoutes = require('./routes/payment');
const adminRoutes   = require('./routes/admin');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');

// Connect to the database (just importing this file runs the connection test)
require('./config/db');

/*
  Create the Express application.
  app is our server — everything we configure goes on it.
*/
const app = express();


/* ============================================================
   SECURITY MIDDLEWARE
   Middleware = functions that run on EVERY request before
   your route handler. Think of them as checkpoints.
   Request → middleware 1 → middleware 2 → route handler → response
============================================================ */

/*
  helmet() adds security HTTP headers automatically.
  It sets about 14 headers that protect against common attacks:
  - X-Content-Type-Options: stops browsers from guessing file types
  - X-Frame-Options: prevents your site from being embedded in iframes (clickjacking)
  - Strict-Transport-Security: forces HTTPS
  etc.
  One line of code, a lot of security. Always include it.
*/
app.use(helmet({
  /*
    crossOriginResourcePolicy: false — we need to allow our
    frontend (on a different origin during dev) to load resources.
    In production you'd tighten this.
  */
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

/*
  CORS (Cross-Origin Resource Sharing)
  
  By default, browsers BLOCK JavaScript from one domain calling
  an API on a different domain. This is a security feature.
  
  During development our frontend is on http://127.0.0.1:5500
  (VS Code Live Server) and our backend is on http://localhost:5000.
  Different ports = different origins = blocked by default.
  
  cors() tells the browser: "I explicitly allow requests from
  FRONTEND_URL to reach this server." Requests from anywhere
  else are still blocked.
*/
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
  credentials: true,
  /*
    credentials: true — allows the browser to send cookies and
    Authorization headers with cross-origin requests.
    Needed for our JWT authentication.
  */
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


/* ============================================================
   RATE LIMITING
   Limits how many requests one IP can make per time window.
   Protects against:
   - Brute force attacks (trying thousands of passwords)
   - DDoS (flooding the server with requests)
   - Abuse of the registration/contact forms
============================================================ */

/*
  General rate limit: 100 requests per 15 minutes per IP.
  Applied to ALL routes.
*/
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,  // Send rate limit info in response headers
  legacyHeaders: false
});

/*
  Stricter limit for authentication routes.
  5 login attempts per 15 minutes — prevents brute-force guessing.
*/
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.'
  }
});

app.use(generalLimiter); // Apply general limit to all routes


/* ============================================================
   BODY PARSING MIDDLEWARE
   Tells Express how to read the body of incoming requests.
============================================================ */

/*
  express.json() — parses requests with Content-Type: application/json
  This is needed for our frontend to send JSON data to the API.
  Without this, req.body would be undefined for JSON requests.
  limit: '10mb' — max size of a JSON body (prevents huge payloads).
*/
app.use(express.json({ limit: '10mb' }));

/*
  express.urlencoded() — parses HTML form submissions (not used much
  since we use JSON, but good to have for compatibility).
*/
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/*
  express.static() — serves our uploaded files (CV documents, profile images)
  as static files accessible via a URL.
  e.g. a file at /uploads/cvs/esther-cv.pdf
  becomes accessible at http://localhost:5000/uploads/cvs/esther-cv.pdf
*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


/* ============================================================
   API ROUTES
   We "mount" each router at a specific URL prefix.
   All routes defined in auth.js will start with /api/auth/
   All routes defined in payment.js will start with /api/payment/
============================================================ */

app.use('/api/auth',    authLimiter, authRoutes);
// authLimiter applied specifically to auth routes (stricter limit)

app.use('/api/careers', careersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);


/* ============================================================
   HEALTH CHECK ROUTE
   A simple endpoint to confirm the server is running.
   Useful for deployment platforms and monitoring tools.
   GET http://localhost:5000/api/health → { status: "OK" }
============================================================ */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TSA Backend is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});


/* ============================================================
   404 HANDLER
   If a request reaches here, no route above matched it.
   We send a clean "not found" response instead of Express's
   ugly default HTML error page.
============================================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});


/* ============================================================
   GLOBAL ERROR HANDLER
   If any route throws an error and doesn't catch it, Express
   passes it here. The four parameters (err, req, res, next)
   is what tells Express this is an error handler — don't remove next.
============================================================ */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  /*
    In production, never send stack traces to the client —
    they reveal internal code structure to potential attackers.
    In development, stack traces are helpful for debugging.
  */
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    ...(isDev && { stack: err.stack })
    /*
      ...(condition && object) is a conditional spread.
      If isDev is true, the stack property is included.
      If isDev is false, it's not included (safe for production).
    */
  });
});


/* ============================================================
   START THE SERVER
   app.listen() tells Node.js to start accepting connections
   on the specified port.
============================================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   🎓  THE SNOOGUMS ACADEMY - BACKEND       ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Server running on port ${PORT}              ║`);
  console.log(`║   Environment: ${process.env.NODE_ENV}             ║`);
  console.log(`║   API: http://localhost:${PORT}/api/health    ║`);
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
