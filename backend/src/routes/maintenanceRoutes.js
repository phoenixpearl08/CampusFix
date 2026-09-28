const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All maintenance routes require MAINTENANCE or ADMIN role
router.use(authenticate, requireRole('MAINTENANCE', 'ADMIN'));

// Get assigned issues
router.get('/assigned', maintenanceController.getMyAssignedIssues);

// Start work on issue (ASSIGNED -> IN PROGRESS)
router.post('/issues/:id/start-work', maintenanceController.startWork);

// Add progress update note
router.post('/issues/:id/progress', maintenanceController.addProgressUpdate);

// Upload completion photo and mark as RESOLVED
router.post('/issues/:id/resolve', upload.single('completionPhoto'), maintenanceController.resolveIssue);

module.exports = router;
