/*
  ============================================================
  THE SNOOGUMS ACADEMY - ADMIN ROUTES
  File: routes/admin.js
  All routes here require: logged in + role = admin
  ============================================================
*/
const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getPayments,
  confirmPayment,
  getApplications,
  updateApplication,
  getMessages,
  markMessageRead,
  getCourses,
  createTeacherAccount,
  scheduleLiveClass,
  getLiveClasses
} = require('../controllers/adminController');

// All admin routes require login + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats',                    getStats);
router.get('/users',                    getUsers);
router.patch('/users/:id/status',       updateUserStatus);
router.delete('/users/:id',             deleteUser);
router.get('/payments',                 getPayments);
router.patch('/payments/:id/confirm',   confirmPayment);
router.get('/applications',             getApplications);
router.patch('/applications/:id',       updateApplication);
router.get('/messages',                 getMessages);
router.patch('/messages/:id/read',      markMessageRead);
router.get('/courses',                  getCourses);
router.post('/applications/:applicationId/create-teacher', createTeacherAccount);
router.get('/live-classes',   getLiveClasses);
router.post('/live-classes',  scheduleLiveClass);

module.exports = router;
