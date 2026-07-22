/*
  ============================================================
  THE SNOOGUMS ACADEMY - DATABASE CONNECTION
  File: config/db.js

  WHAT DOES THIS FILE DO?
  It creates and exports a CONNECTION POOL to our MySQL database.

  WHAT IS A CONNECTION POOL?
  Instead of opening and closing a new database connection for
  every single request (which is slow and wasteful), a pool
  keeps several connections OPEN and READY.
  When a request needs the database, it borrows a connection
  from the pool, uses it, then returns it — like a shared pool
  of tools in a workshop rather than buying new tools each time.

  WHY mysql2 AND NOT mysql?
  mysql2 is the modern version. Key advantages:
  - Supports Promises and async/await natively
  - Faster performance
  - Better prepared statement support (protection from SQL injection)
  ============================================================
*/

// Load environment variables from .env file
// Must be called before accessing process.env values
require('dotenv').config();

// Import mysql2's Promise-based interface
// The /promise version lets us use async/await instead of callbacks
const mysql = require('mysql2/promise');

/*
  createPool() creates a pool of database connections.
  The object we pass in contains connection settings —
  all values come from our .env file via process.env.
*/
const pool = mysql.createPool({
  host:     process.env.DB_HOST,      // e.g. 'localhost'
  user:     process.env.DB_USER,      // e.g. 'root'
  password: process.env.DB_PASSWORD,  // your MySQL password
  database: process.env.DB_NAME,      // 'tsa_academy'
  port:     process.env.DB_PORT || 3306,

  /*
    waitForConnections: true
    If all connections in the pool are busy, new requests WAIT
    for one to become free (instead of immediately throwing an error).
  */
  waitForConnections: true,

  /*
    connectionLimit: 10
    Maximum number of connections to keep open simultaneously.
    For a ~100 student platform, 10 is more than enough.
    Increase this if the platform scales significantly.
  */
  connectionLimit: 10,

  /*
    queueLimit: 0
    How many requests can queue up waiting for a connection.
    0 = unlimited queue (requests never rejected due to queue being full).
  */
  queueLimit: 0,

  /*
    charset: utf8mb4
    Matches the database charset we set in db.sql.
    Ensures proper handling of all Unicode characters.
  */
  charset: 'utf8mb4'
});


/*
  TEST THE CONNECTION on startup.
  
  We wrap this in an immediately invoked async function
  (the pattern: (async () => { ... })()) because we can't
  use top-level await in all Node.js environments.

  pool.getConnection() borrows one connection from the pool.
  If it succeeds, the database is reachable. 
  We then immediately release() it back to the pool.
*/
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release(); // Return connection to the pool immediately
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Check your .env file — DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    /*
      We don't call process.exit() here because the database
      might become available after a brief delay (e.g. MySQL
      is still starting up). The app will fail gracefully on
      the first actual database query if the connection isn't fixed.
    */
  }
})();


/*
  Export the pool so other files can use it.
  In any controller or route file, import it like:
  const pool = require('../config/db');
  
  Then query the database:
  const [rows] = await pool.query('SELECT * FROM users');
*/
module.exports = pool;
