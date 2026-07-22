/*
  ============================================================
  THE SNOOGUMS ACADEMY - STUDENT ROUTES
  File: routes/student.js
  ============================================================
*/
const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { getLiveClasses, getCourses, getMyProgrammes } = require('../controllers/studentController');

router.use(protect, restrictTo('student'));

router.get('/courses',      getCourses);
router.get('/live-classes', getLiveClasses);
router.get('/programmes',   getMyProgrammes);

module.exports = router;
