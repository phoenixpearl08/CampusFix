const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { analyzeIssue } = require('../services/aiService');
const { findDuplicates } = require('../services/duplicateService');
const { createNotification } = require('../services/notificationService');

/**
 * Generate next formatted issue code CF-YYYY-XXXXX
 */
function generateIssueCode() {
  const currentYear = new Date().getFullYear();
  const prefix = `CF-${currentYear}-`;
  
  // Find highest existing sequence for the current year
  const lastIssue = db.prepare(`
    SELECT issue_code FROM issues 
    WHERE issue_code LIKE ? 
    ORDER BY issue_code DESC 
    LIMIT 1
  `).get(`${prefix}%`);

  let nextNum = 1;
  if (lastIssue && lastIssue.issue_code) {
    const parts = lastIssue.issue_code.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * AI Pre-submission Analysis & Duplicate Checking
 */
exports.analyzePreview = async (req, res) => {
  try {
    const { title, description, building, block, floor, room, category } = req.body;
    const hasImage = !!req.file;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required for AI analysis.' });
    }

    const aiResult = await analyzeIssue({
      title,
      description,
      userCategory: category,
      hasImage
    });

    const duplicates = findDuplicates({
      building,
      block,
      floor,
      room,
      category: category || aiResult.detectedCategory,
      title,
      description
    });

    return res.json({
      aiAnalysis: aiResult,
      duplicates,
      hasDuplicates: duplicates.length > 0
    });
  } catch (err) {
    console.error('Error during AI analysis preview:', err);
    return res.status(500).json({ error: 'Failed to analyze issue preview.' });
  }
};

/**
 * Submit New Issue Report
 */
exports.createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      building,
      block,
      floor,
      room,
      mapCoordinates,
      category: userCategory,
      forceCreate = false,
      duplicateOfId = null
    } = req.body;

    if (!title || !description || !building || !block || !floor) {
      return res.status(400).json({ error: 'Please provide title, description, building, block, and floor.' });
    }

    const hasImage = !!req.file;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Run AI analysis
    const aiResult = await analyzeIssue({
      title,
      description,
      userCategory,
      hasImage
    });

    const finalCategory = userCategory || aiResult.detectedCategory;
    const finalPriority = aiResult.suggestedPriority;

    // Check duplicates if not forced
    const duplicates = findDuplicates({
      building,
      block,
      floor,
      room,
      category: finalCategory,
      title,
      description
    });

    if (duplicates.length > 0 && !forceCreate && !duplicateOfId) {
      return res.status(409).json({
        message: 'Possible existing issue found in this zone.',
        duplicates,
        suggestedDuplicateId: duplicates[0].issueId,
        aiAnalysis: aiResult
      });
    }

    const issueId = uuidv4();
    const issueCode = generateIssueCode();

    // Insert Issue in a database transaction
    const insertTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO issues (
          id, issue_code, user_id, title, description,
          building, block, floor, room, map_coordinates,
          user_category, ai_category, final_category,
          ai_priority, final_priority, status,
          is_duplicate, duplicate_of_id,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, 'REPORTED',
          ?, ?,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        issueId,
        issueCode,
        req.user.id,
        title.trim(),
        description.trim(),
        building.trim(),
        block.trim(),
        floor.trim(),
        room ? room.trim() : null,
        mapCoordinates || null,
        userCategory || null,
        aiResult.detectedCategory,
        finalCategory,
        aiResult.suggestedPriority,
        finalPriority,
        duplicateOfId ? 1 : 0,
        duplicateOfId || null
      );

      // Save Image if uploaded
      if (imageUrl) {
        db.prepare(`
          INSERT INTO issue_images (id, issue_id, image_url, image_type, caption, created_at)
          VALUES (?, ?, ?, 'REPORT', 'Student initial complaint photo', CURRENT_TIMESTAMP)
        `).run(uuidv4(), issueId, imageUrl);
      }

      // Save AI Analysis
      db.prepare(`
        INSERT INTO ai_analyses (
          id, issue_id, detected_category, suggested_priority,
          confidence_score, reasoning, keywords_detected,
          image_analysis, duplicate_candidates, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        issueId,
        aiResult.detectedCategory,
        aiResult.suggestedPriority,
        aiResult.confidenceScore,
        aiResult.reasoning,
        JSON.stringify(aiResult.keywordsDetected || []),
        aiResult.imageAnalysis || null,
        JSON.stringify(duplicates.map(d => ({ id: d.issueId, code: d.issueCode, score: d.similarityScore })))
      );

      // Save Status History (Timeline entries)
      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, NULL, 'REPORTED', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        issueId,
        req.user.id,
        req.user.name,
        req.user.role,
        'Issue submitted by reporter.'
      );

      // AI Analysis timeline entry
      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, 'REPORTED', 'REPORTED', NULL, 'CampusFix AI Engine', 'AI_SYSTEM', ?, datetime('now', '+2 seconds'))
      `).run(
        uuidv4(),
        issueId,
        `AI Analysis completed: Category detected as "${aiResult.detectedCategory}", suggested priority "${aiResult.suggestedPriority}" (${aiResult.reasoning})`
      );
    });

    insertTx();

    // Dispatch Notifications
    createNotification({
      userId: req.user.id,
      issueId,
      title: `Issue ${issueCode} Logged`,
      message: `Your report "${title}" has been registered. AI prioritized it as ${finalPriority}.`,
      type: 'STATUS_UPDATE'
    });

    if (finalPriority === 'HIGH' || finalPriority === 'CRITICAL') {
      createNotification({
        roleTarget: 'ADMIN',
        issueId,
        title: `🚨 ${finalPriority} Priority Campus Hazard Reported`,
        message: `Issue ${issueCode} at ${building} Block ${block}: "${title}" requires review.`,
        type: 'ALERT'
      });
    }

    const createdIssue = exports.fetchFullIssue(issueId);

    return res.status(201).json({
      message: 'Issue report created successfully.',
      issue: createdIssue
    });
  } catch (err) {
    console.error('Error creating issue report:', err);
    return res.status(500).json({ error: 'Failed to submit issue report. Please check required fields.' });
  }
};

/**
 * Fetch full issue helper
 */
exports.fetchFullIssue = (issueId) => {
  const issue = db.prepare(`
    SELECT i.*, 
           u.name as reporter_name, u.email as reporter_email, u.phone as reporter_phone, u.department as reporter_department,
           t.name as assigned_team_name, t.category as assigned_team_category, t.lead_name as assigned_team_lead, t.phone as assigned_team_phone
    FROM issues i
    JOIN users u ON i.user_id = u.id
    LEFT JOIN maintenance_teams t ON i.assigned_team_id = t.id
    WHERE i.id = ?
  `).get(issueId);

  if (!issue) return null;

  const images = db.prepare(`
    SELECT id, image_url, image_type, caption, created_at 
    FROM issue_images 
    WHERE issue_id = ? 
    ORDER BY created_at ASC
  `).all(issueId);

  const timeline = db.prepare(`
    SELECT id, old_status, new_status, changed_by_name, changed_by_role, notes, created_at
    FROM issue_status_history
    WHERE issue_id = ?
    ORDER BY created_at ASC
  `).all(issueId);

  const aiAnalysis = db.prepare(`
    SELECT detected_category, suggested_priority, confidence_score, reasoning, keywords_detected, image_analysis, duplicate_candidates, created_at
    FROM ai_analyses
    WHERE issue_id = ?
  `).get(issueId);

  const comments = db.prepare(`
    SELECT id, user_id, user_name, user_role, comment, is_internal, created_at
    FROM issue_comments
    WHERE issue_id = ?
    ORDER BY created_at ASC
  `).all(issueId);

  // If duplicate, fetch parent issue preview
  let parentIssue = null;
  if (issue.duplicate_of_id) {
    parentIssue = db.prepare(`SELECT id, issue_code, title, status FROM issues WHERE id = ?`).get(issue.duplicate_of_id);
  }

  return {
    ...issue,
    images,
    timeline,
    aiAnalysis: aiAnalysis ? {
      ...aiAnalysis,
      keywordsDetected: aiAnalysis.keywords_detected ? JSON.parse(aiAnalysis.keywords_detected) : [],
      duplicateCandidates: aiAnalysis.duplicate_candidates ? JSON.parse(aiAnalysis.duplicate_candidates) : []
    } : null,
    comments,
    parentIssue
  };
};

/**
 * Get Issue by ID (with authorization check)
 */
exports.getIssueById = (req, res) => {
  try {
    const { id } = req.params;
    const issue = exports.fetchFullIssue(id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found.' });
    }

    // Role-based visibility check:
    // If STUDENT, can only see their own issues
    if (req.user.role === 'STUDENT' && issue.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view complaints submitted by your account.' });
    }

    // If MAINTENANCE, check if assigned to their team
    if (req.user.role === 'MAINTENANCE') {
      const userTeam = db.prepare(`
        SELECT team_id FROM user_team_members WHERE user_id = ?
      `).get(req.user.id);

      if (!userTeam || issue.assigned_team_id !== userTeam.team_id) {
        return res.status(403).json({ error: 'Access denied. You can only access issues assigned to your maintenance team.' });
      }
    }

    return res.json({ issue });
  } catch (err) {
    console.error('Error fetching issue details:', err);
    return res.status(500).json({ error: 'Failed to retrieve issue details.' });
  }
};

/**
 * Get Issues reported by logged in student/staff
 */
exports.getMyIssues = (req, res) => {
  try {
    const { status, search, category } = req.query;
    let query = `
      SELECT i.*, 
             t.name as assigned_team_name,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'REPORT' LIMIT 1) as report_image
      FROM issues i
      LEFT JOIN maintenance_teams t ON i.assigned_team_id = t.id
      WHERE i.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND i.final_category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.issue_code LIKE ? OR i.building LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY i.created_at DESC`;

    const issues = db.prepare(query).all(...params);

    // Summary statistics for reporter dashboard
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('REPORTED', 'UNDER REVIEW') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status IN ('ASSIGNED', 'IN PROGRESS') THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved
      FROM issues
      WHERE user_id = ?
    `).get(req.user.id);

    return res.json({ issues, stats });
  } catch (err) {
    console.error('Error fetching student issues:', err);
    return res.status(500).json({ error: 'Failed to fetch your reported issues.' });
  }
};

/**
 * Student confirms resolution and closes the issue
 */
exports.userConfirmResolution = (req, res) => {
  try {
    const { id } = req.params;
    const { feedbackNotes } = req.body;

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    if (issue.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the reporter or administrator can confirm issue resolution.' });
    }

    if (issue.status !== 'RESOLVED') {
      return res.status(400).json({ error: `Cannot close issue in status "${issue.status}". Issue must be marked RESOLVED first.` });
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE issues
        SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, 'RESOLVED', 'CLOSED', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        id,
        req.user.id,
        req.user.name,
        req.user.role,
        feedbackNotes ? `Reporter confirmed resolution. Notes: "${feedbackNotes}"` : 'Reporter confirmed resolution and closed the ticket.'
      );
    });

    tx();

    createNotification({
      roleTarget: 'ADMIN',
      issueId: id,
      title: `Issue ${issue.issue_code} Closed`,
      message: `Reporter confirmed fix for "${issue.title}".`,
      type: 'STATUS_UPDATE'
    });

    const updatedIssue = exports.fetchFullIssue(id);
    return res.json({ message: 'Issue verified and closed successfully.', issue: updatedIssue });
  } catch (err) {
    console.error('Error confirming resolution:', err);
    return res.status(500).json({ error: 'Failed to verify resolution.' });
  }
};

/**
 * Add Comment to Issue
 */
exports.addComment = (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal = false } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    // Role check:
    if (req.user.role === 'STUDENT' && issue.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Cannot comment on another user\'s issue.' });
    }

    // Only Admin & Maintenance can mark internal comments
    const internalFlag = (req.user.role === 'ADMIN' || req.user.role === 'MAINTENANCE') ? (isInternal ? 1 : 0) : 0;

    const commentId = uuidv4();
    db.prepare(`
      INSERT INTO issue_comments (id, issue_id, user_id, user_name, user_role, comment, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(commentId, id, req.user.id, req.user.name, req.user.role, comment.trim(), internalFlag);

    // Notify issue reporter if comment by staff/admin
    if (req.user.id !== issue.user_id && !internalFlag) {
      createNotification({
        userId: issue.user_id,
        issueId: id,
        title: `New Update on ${issue.issue_code}`,
        message: `${req.user.name} (${req.user.role}): "${comment.trim().slice(0, 70)}..."`,
        type: 'COMMENT'
      });
    }

    const updatedComments = db.prepare(`
      SELECT id, user_id, user_name, user_role, comment, is_internal, created_at
      FROM issue_comments
      WHERE issue_id = ?
      ORDER BY created_at ASC
    `).all(id);

    return res.status(201).json({ message: 'Comment added successfully.', comments: updatedComments });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
};
