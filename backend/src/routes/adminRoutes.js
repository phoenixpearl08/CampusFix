const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// Dashboard stats & KPI metrics
router.get('/dashboard-stats', adminController.getDashboardStats);

// All issues with full filters & search
router.get('/issues', adminController.getAllIssues);

// Review AI evaluation (override category & priority)
router.patch('/issues/:id/review', adminController.reviewIssueAI);

// Assign maintenance team
router.post('/issues/:id/assign', adminController.assignTeam);

// Change issue status
router.patch('/issues/:id/status', adminController.updateStatus);

// Duplicate issue resolution (link/merge or keep independent)
router.post('/issues/:id/resolve-duplicate', adminController.resolveDuplicate);

// Maintenance teams management
router.get('/teams', adminController.getTeams);
router.post('/teams', adminController.createTeam);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);

// Recurring problems analysis
router.get('/recurring-problems', adminController.getRecurringProblems);

module.exports = router;
