const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Preview AI analysis & duplicate check before submission
router.post('/analyze-preview', authenticate, upload.single('photo'), issueController.analyzePreview);

// Submit report
router.post('/', authenticate, upload.single('photo'), issueController.createIssue);

// My reported issues
router.get('/my', authenticate, issueController.getMyIssues);

// Get single issue details
router.get('/:id', authenticate, issueController.getIssueById);

// Confirm resolution (student closes issue)
router.post('/:id/confirm-resolution', authenticate, issueController.userConfirmResolution);

// Add comment to issue
router.post('/:id/comments', authenticate, issueController.addComment);

module.exports = router;
