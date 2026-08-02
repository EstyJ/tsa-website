-- =============================================================
-- THE SNOOGUMS ACADEMY - DATABASE SCHEMA
-- File: models/db.sql
--
-- WHAT IS THIS FILE?
-- This file defines ALL the tables in our database.
-- Run this file ONCE to create the database structure.
-- After that, Node.js will read/write data to these tables.
--
-- HOW TO RUN IT:
-- In MySQL Workbench or your terminal:
-- mysql -u root -p < models/db.sql
--
-- Or open MySQL Workbench, paste the contents, and run it.
--
-- WHAT IS SQL?
-- SQL (Structured Query Language) is the language for databases.
-- Think of it like English instructions for creating spreadsheets.
-- CREATE TABLE = create a new spreadsheet (table)
-- Each column in the table is one piece of data per row.
-- =============================================================


-- Create the database if it doesn't exist, then use it
CREATE DATABASE IF NOT EXISTS tsa_academy
  CHARACTER SET utf8mb4       -- Supports all Unicode characters (emojis, accented letters etc.)
  COLLATE utf8mb4_unicode_ci; -- Case-insensitive comparison (so 'AMAKA' = 'amaka')

USE tsa_academy;


-- =============================================================
-- TABLE 1: USERS
-- Stores all accounts: students, teachers, and admins.
-- ONE table for all roles — a "role" column distinguishes them.
-- This is simpler than three separate tables and makes
-- cross-role queries (e.g. "all users") easy.
-- =============================================================
CREATE TABLE IF NOT EXISTS users (

  id            INT AUTO_INCREMENT PRIMARY KEY,
  -- AUTO_INCREMENT: each new user gets the next number automatically
  -- PRIMARY KEY: uniquely identifies each row — no two users share an id

  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  -- UNIQUE: no two users can share the same email
  -- NOT NULL: this column cannot be empty

  phone         VARCHAR(20),
  phone_prefix  VARCHAR(10) DEFAULT '+234',

  password_hash VARCHAR(255) NOT NULL,
  -- We NEVER store plain passwords — only the bcrypt hash.
  -- Even if the database is stolen, passwords are unreadable.

  role          ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  -- ENUM restricts the value to one of these three options only.
  -- New registrations always default to 'student'.
  -- Admin accounts are created manually by the owner.

  is_active     BOOLEAN DEFAULT FALSE,
  -- FALSE for all new students until admin confirms payment.
  -- TRUE for teachers once admin creates their account.
  -- TRUE for admins always.

  email_verified BOOLEAN DEFAULT FALSE,
  -- Will be set TRUE after email verification link is clicked.

  profile_image  VARCHAR(500),
  -- Path or URL to the user's profile picture (optional).

  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP NULL,

  -- Index on email: makes login queries much faster.
  -- Without this, MySQL scans every row to find a matching email.
  -- With it, MySQL jumps straight to the right row.
  INDEX idx_email (email),
  INDEX idx_role  (role)
);


-- =============================================================
-- TABLE 2: PASSWORD RESET TOKENS
-- When a user clicks "Forgot Password", we generate a token,
-- store it here, and email them a link containing it.
-- The link is only valid for 1 hour.
-- =============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- FOREIGN KEY: links this table to the users table.
  -- If a user is deleted, their reset tokens are deleted too (CASCADE).
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- =============================================================
-- TABLE 3: COURSES
-- The available courses at TSA.
-- Admins and teachers manage these from the dashboard.
-- =============================================================
CREATE TABLE IF NOT EXISTS courses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL UNIQUE,
  -- slug: URL-friendly version of the title.
  -- e.g. "Introduction to Coding" → "introduction-to-coding"
  -- Used in URLs: /courses/introduction-to-coding

  description  TEXT,
  category     ENUM('coding', 'mathematics', 'science', 'english', 'other') NOT NULL,
  level        ENUM('beginner', 'intermediate', 'advanced', 'all') DEFAULT 'all',
  duration_weeks INT DEFAULT 0,
  lesson_count INT DEFAULT 0,
  thumbnail    VARCHAR(500),
  instructor_id INT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);


-- =============================================================
-- TABLE 4: ENROLLMENTS
-- Which students are enrolled in which courses.
-- A student can be enrolled in many courses,
-- and a course can have many students.
-- This is called a MANY-TO-MANY relationship.
-- We resolve it with a "junction table" (this table).
-- =============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  course_id   INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active   BOOLEAN DEFAULT FALSE,
  -- FALSE until admin confirms payment for this course

  -- Prevent a student from being enrolled in the same course twice
  UNIQUE KEY unique_enrollment (student_id, course_id),

  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE
);


-- =============================================================
-- TABLE 5: PAYMENTS
-- Records every payment attempt (successful or not).
-- Supports both Paystack and manual bank transfer.
-- =============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  student_id          INT NOT NULL,
  course_id           INT,
  amount              DECIMAL(10, 2) NOT NULL,
  -- DECIMAL(10, 2): up to 10 digits total, 2 after decimal point
  -- e.g. 25000.00 (twenty-five thousand naira)

  currency            VARCHAR(10) DEFAULT 'NGN',
  payment_method      ENUM('paystack', 'manual') NOT NULL,

  -- Paystack-specific fields
  paystack_reference  VARCHAR(255) UNIQUE,
  -- Paystack generates a unique reference for each transaction.
  -- We use this to verify the payment with Paystack's API.

  paystack_status     VARCHAR(50),
  -- "success", "failed", "abandoned" — comes from Paystack

  -- Manual payment fields
  bank_name           VARCHAR(100),
  account_name        VARCHAR(200),
  transfer_date       DATE,
  proof_of_payment    VARCHAR(500),
  -- Path to uploaded screenshot/receipt of the bank transfer

  -- Admin confirmation
  status              ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
  confirmed_by        INT,
  -- ID of the admin who confirmed/rejected this payment
  confirmed_at        TIMESTAMP NULL,
  notes               TEXT,
  -- Admin notes (e.g. "Transfer verified — activated access 14 Jan")

  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)   REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_paystack_ref (paystack_reference),
  INDEX idx_student_payments (student_id)
);


-- =============================================================
-- TABLE 6: CAREER APPLICATIONS
-- Stores teacher job applications from the Careers page.
-- Admin reviews these and creates teacher accounts manually.
-- =============================================================
CREATE TABLE IF NOT EXISTS career_applications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  subject         VARCHAR(100),
  experience      VARCHAR(50),
  qualification   VARCHAR(50),
  availability    JSON,
  -- JSON column stores the array of selected availability slots.
  -- e.g. ["weekday-morning", "weekends"]
  -- MySQL supports JSON natively from version 5.7+

  bio             TEXT,
  cv_path         VARCHAR(500),
  -- Path to the uploaded CV file on our server

  status          ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired') DEFAULT 'pending',
  admin_notes     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_app_email (email),
  INDEX idx_app_status (status)
);


-- =============================================================
-- TABLE 7: CONTACT MESSAGES
-- Stores messages from the Contact page form.
-- Admin reads and responds to these from the dashboard.
-- =============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(100),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_msg_read (is_read)
);


-- =============================================================
-- TABLE 8: LIVE CLASSES
-- Scheduled live class sessions (Jitsi Meet).
-- Teachers clock in before each class — stored here.
-- =============================================================
CREATE TABLE IF NOT EXISTS live_classes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  course_id      INT NOT NULL,
  teacher_id     INT NOT NULL,
  title          VARCHAR(255) NOT NULL,
  jitsi_room     VARCHAR(255) NOT NULL UNIQUE,
  -- The unique Jitsi room name — generates the meeting URL.
  -- e.g. "tsa-mathematics-20250614" → meet.jit.si/tsa-mathematics-20250614

  scheduled_at   TIMESTAMP NOT NULL,
  duration_mins  INT DEFAULT 60,

  -- Teacher clock-in
  clocked_in_at  TIMESTAMP NULL,
  -- Set when teacher clicks "Start Class" / "Clock In"
  -- NULL means teacher hasn't started yet

  status         ENUM('scheduled', 'live', 'completed', 'cancelled') DEFAULT 'scheduled',
  -- 'live'    → teacher has clocked in, students see "LIVE" badge
  -- 'completed' → class ended
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_schedule (scheduled_at),
  INDEX idx_live_status (status)
);


-- =============================================================
-- TABLE 9: ATTENDANCE
-- Records which students attended which live classes.
-- Set automatically when a student joins a live Jitsi session.
-- =============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  live_class_id INT NOT NULL,
  student_id    INT NOT NULL,
  joined_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at       TIMESTAMP NULL,

  UNIQUE KEY unique_attendance (live_class_id, student_id),
  FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)    REFERENCES users(id) ON DELETE CASCADE
);


-- =============================================================
-- TABLE 10: COHORTS (BOOTCAMP TERMS/BATCHES)
-- TSA runs repeating cohorts each semester.
-- This lets admin manage "Summer 2025" vs "Autumn 2025" students.
-- =============================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  -- e.g. "Summer 2025", "Spring 2026"
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================
-- INSERT DEFAULT ADMIN ACCOUNT
-- This creates the first admin so you can log in immediately.
-- Password: Admin@TSA2025 (you MUST change this after first login)
--
-- The password hash below was generated with bcryptjs:
-- bcrypt.hashSync('Admin@TSA2025', 12)
-- =============================================================
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)
VALUES (
  'TSA',
  'Admin',
  'admin@snoogums.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/KeQ9Q2v6gY.F1YEiy',
  'admin',
  TRUE,
  TRUE
)
ON DUPLICATE KEY UPDATE id = id;
-- ON DUPLICATE KEY UPDATE id = id means:
-- "If this email already exists, do nothing (don't error out)."
-- Safe to run this file multiple times without duplicating the admin.


-- =============================================================
-- TABLE 11: PROGRAMMES
-- All available TSA programmes with pricing
-- =============================================================
CREATE TABLE IF NOT EXISTS programmes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  category         ENUM('academic', 'exam', 'international', 'skills', 'summer') NOT NULL,
  name             VARCHAR(255) NOT NULL,
  duration_per_contact VARCHAR(50) NOT NULL,
  price_per_contact DECIMAL(10,2) NOT NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all TSA programmes
INSERT INTO programmes (category, name, duration_per_contact, price_per_contact) VALUES
('academic',       'Primary Key Subject (Maths, English or Science)', '1 hr',   8500.00),
('academic',       'Primary Other Subject',                            '1 hr',   7500.00),
('academic',       'Primary Combo (2 Subjects)',                       '1 hr',   7500.00),
('academic',       'Primary Combo (3 Subjects)',                       '1 hr',   7000.00),
('academic',       'Secondary Key Subject',                            '1 hr',   10000.00),
('academic',       'Secondary Other Subject',                          '1 hr',   8500.00),
('academic',       'Secondary Combo (2 Subjects)',                     '1 hr',   9000.00),
('academic',       'Science Combo (3 Subjects)',                       '1 hr',   9000.00),
('exam',           'WAEC/NECO Single Subject',                         '1.5 hrs',10000.00),
('exam',           'WAEC/NECO 4 Subjects',                            '1.5 hrs',9500.00),
('exam',           'WAEC/NECO 6 Subjects',                            '1.5 hrs',9000.00),
('exam',           'JAMB Standard',                                    '1.5 hrs',9000.00),
('international',  'GCSE/IGCSE 1 Subject',                            '1.5 hrs',10000.00),
('international',  'IELTS',                                            '1.5 hrs',12500.00),
('skills',         'Python Programming',                               '1.5 hrs',8500.00),
('summer',         'Summer Holiday Lessons',                           '1.5 hrs',8500.00)
ON DUPLICATE KEY UPDATE id = id;

-- =============================================================
-- TABLE 12: STUDENT PROGRAMMES
-- Which programmes a student is enrolled in
-- =============================================================
CREATE TABLE IF NOT EXISTS student_programmes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  student_id        INT NOT NULL,
  programme_id      INT NOT NULL,
  contacts_per_week INT DEFAULT 1,
  payment_frequency ENUM('weekly', 'monthly') DEFAULT 'weekly',
  status            ENUM('pending', 'active', 'completed') DEFAULT 'pending',
  enrolled_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_programme (student_id, programme_id),
  FOREIGN KEY (student_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
);

-- Additional exam programmes added by partner request
INSERT IGNORE INTO programmes (id, category, name, duration_per_contact, price_per_contact) VALUES
(17, 'exam', 'IGCSE',      '1 hr', 8500.00),
(18, 'exam', 'GCSE',       '1 hr', 8500.00),
(19, 'exam', 'IELTS',      '1 hr', 8500.00),
(20, 'exam', 'Checkpoint',  '1 hr', 8500.00);

-- TABLE: COURSE CONTENT (videos, slides, documents uploaded by teachers)
CREATE TABLE IF NOT EXISTS course_content (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id  INT NOT NULL,
  course_id   INT,
  title       VARCHAR(255) NOT NULL,
  type        ENUM('video', 'slides', 'document') DEFAULT 'document',
  description TEXT,
  file_path   VARCHAR(500) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE SET NULL
);

-- TABLE: ANNOUNCEMENTS
-- Admin posts to all students, teachers post to students in their category
-- Messages expire after 24 hours automatically
CREATE TABLE IF NOT EXISTS announcements (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  body        TEXT NOT NULL,
  posted_by   INT NOT NULL,
  target      ENUM('all', 'academic', 'exam', 'international', 'skills', 'summer') DEFAULT 'all',
  expires_at  TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expires (expires_at)
);

-- Insert summer tech camp programmes
INSERT IGNORE INTO programmes (id, category, name, duration_per_contact, price_per_contact) VALUES
(17, 'summer', 'AI Fundamentals & Digital Productivity', '1.5 hrs', 25000.00),
(18, 'summer', 'Coding & Robotics',                      '1.5 hrs', 25000.00),
(19, 'summer', 'Digital Design & Content Creation',      '1.5 hrs', 25000.00);

-- Update old summer holiday lessons
UPDATE programmes SET name = 'Summer Holiday Lessons (Legacy)', is_active = FALSE WHERE id = 16;

-- Add target fields to course_content if not exists
ALTER TABLE course_content
  ADD COLUMN IF NOT EXISTS target_category ENUM('all','academic','exam','international','skills','summer') DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_programme VARCHAR(255) DEFAULT NULL;
