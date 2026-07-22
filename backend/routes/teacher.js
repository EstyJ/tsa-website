/*
  ============================================================
  THE SNOOGUMS ACADEMY - TEACHER ROUTES
  File: routes/teacher.js
  ============================================================
*/
const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getClasses,
  clockIn,
  getStudents,
  getAttendance
} = require('../controllers/teacherController');

router.use(protect, restrictTo('teacher'));

router.get('/classes',                    getClasses);
router.patch('/classes/:id/clockin',      clockIn);
router.get('/students',                   getStudents);
router.get('/attendance',                 getAttendance);

module.exports = router;
