const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { createNotification } = require('../services/notificationService');
const { fetchFullIssue } = require('./issueController');

/**
 * Get assigned issues for the current maintenance team member
 */
exports.getMyAssignedIssues = (req, res) => {
  try {
    const { status, priority, search } = req.query;

    // Get user's maintenance team
    const teamMember = db.prepare('SELECT team_id FROM user_team_members WHERE user_id = ?').get(req.user.id);
    if (!teamMember) {
      return res.json({ issues: [], stats: { total: 0, assigned: 0, in_progress: 0, resolved: 0 } });
    }

    let query = `
      SELECT i.*, 
             u.name as reporter_name, u.phone as reporter_phone,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'REPORT' LIMIT 1) as report_image,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'COMPLETION' LIMIT 1) as completion_image
      FROM issues i
      JOIN users u ON i.user_id = u.id
      WHERE i.assigned_team_id = ?
    `;
    const params = [teamMember.team_id];

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND i.final_priority = ?`;
      params.push(priority);
    }

    if (search) {
      query += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.issue_code LIKE ? OR i.room LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY CASE i.final_priority 
                WHEN 'CRITICAL' THEN 1 
                WHEN 'HIGH' THEN 2 
                WHEN 'MEDIUM' THEN 3 
                ELSE 4 END, i.created_at DESC`;

    const issues = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'IN PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved
      FROM issues
      WHERE assigned_team_id = ?
    `).get(teamMember.team_id);

    return res.json({ issues, stats });
  } catch (err) {
    console.error('Error in getMyAssignedIssues:', err);
    return res.status(500).json({ error: 'Failed to retrieve maintenance assignments.' });
  }
};

/**
 * Start Work on Issue (ASSIGNED -> IN PROGRESS)
 */
exports.startWork = (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    // Check team membership
    const teamMember = db.prepare('SELECT team_id FROM user_team_members WHERE user_id = ? AND team_id = ?')
      .get(req.user.id, issue.assigned_team_id);

    if (!teamMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to start work on an issue not assigned to your team.' });
    }

    if (issue.status !== 'ASSIGNED' && issue.status !== 'UNDER REVIEW') {
      return res.status(400).json({ error: `Cannot start work when issue is in "${issue.status}" status.` });
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE issues 
        SET status = 'IN PROGRESS', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, ?, 'IN PROGRESS', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        id,
        issue.status,
        req.user.id,
        req.user.name,
        req.user.role,
        notes || 'Maintenance team arrived on site and commenced repairs.'
      );
    });

    tx();

    createNotification({
      userId: issue.user_id,
      issueId: id,
      title: `Work Commenced: ${issue.issue_code}`,
      message: `Maintenance team has started working on "${issue.title}".`,
      type: 'STATUS_UPDATE'
    });

    const updated = fetchFullIssue(id);
    return res.json({ message: 'Issue status updated to IN PROGRESS.', issue: updated });
  } catch (err) {
    console.error('Error starting work:', err);
    return res.status(500).json({ error: 'Failed to update issue status.' });
  }
};

/**
 * Add Progress Update / Field Note
 */
exports.addProgressUpdate = (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({ error: 'Progress note is required.' });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const teamMember = db.prepare('SELECT team_id FROM user_team_members WHERE user_id = ? AND team_id = ?')
      .get(req.user.id, issue.assigned_team_id);

    if (!teamMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to update this issue.' });
    }

    const tx = db.transaction(() => {
      // Record progress note in status history
      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        id,
        issue.status,
        issue.status,
        req.user.id,
        req.user.name,
        req.user.role,
        `Field Progress Update: ${notes.trim()}`
      );

      // Also record as comment for transparency
      db.prepare(`
        INSERT INTO issue_comments (id, issue_id, user_id, user_name, user_role, comment, is_internal, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(uuidv4(), id, req.user.id, req.user.name, req.user.role, `[Maintenance Update]: ${notes.trim()}`);
    });

    tx();

    createNotification({
      userId: issue.user_id,
      issueId: id,
      title: `Progress Note: ${issue.issue_code}`,
      message: `Update from maintenance team: "${notes.trim().slice(0, 80)}"`,
      type: 'INFO'
    });

    const updated = fetchFullIssue(id);
    return res.json({ message: 'Progress update recorded.', issue: updated });
  } catch (err) {
    console.error('Error adding progress update:', err);
    return res.status(500).json({ error: 'Failed to record progress update.' });
  }
};

/**
 * Upload Completion Photo & Mark as RESOLVED
 */
exports.resolveIssue = (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const completionPhotoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!resolutionNotes || !resolutionNotes.trim()) {
      return res.status(400).json({ error: 'Please provide resolution summary notes detailing the work completed.' });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const teamMember = db.prepare('SELECT team_id FROM user_team_members WHERE user_id = ? AND team_id = ?')
      .get(req.user.id, issue.assigned_team_id);

    if (!teamMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to resolve this issue.' });
    }

    if (issue.status !== 'IN PROGRESS' && issue.status !== 'ASSIGNED') {
      return res.status(400).json({ error: `Cannot resolve issue from current state "${issue.status}".` });
    }

    const tx = db.transaction(() => {
      // 1. Update issue status
      db.prepare(`
        UPDATE issues 
        SET status = 'RESOLVED',
            resolution_notes = ?,
            resolved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(resolutionNotes.trim(), id);

      // 2. Save completion photo if uploaded
      if (completionPhotoUrl) {
        db.prepare(`
          INSERT INTO issue_images (id, issue_id, image_url, image_type, caption, created_at)
          VALUES (?, ?, ?, 'COMPLETION', 'Maintenance fix completion proof photo', CURRENT_TIMESTAMP)
        `).run(uuidv4(), id, completionPhotoUrl);
      }

      // 3. Log to timeline
      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, ?, 'RESOLVED', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        id,
        issue.status,
        req.user.id,
        req.user.name,
        req.user.role,
        `Marked RESOLVED by maintenance. Notes: "${resolutionNotes.trim()}". ${completionPhotoUrl ? 'Proof photo attached.' : ''}`
      );
    });

    tx();

    // Notify Reporter
    createNotification({
      userId: issue.user_id,
      issueId: id,
      title: `Issue ${issue.issue_code} Resolved!`,
      message: `Repairs for "${issue.title}" are complete. Please verify and confirm closure.`,
      type: 'STATUS_UPDATE'
    });

    // Notify Admin
    createNotification({
      roleTarget: 'ADMIN',
      issueId: id,
      title: `Issue ${issue.issue_code} Marked Resolved`,
      message: `Completed by maintenance team with note: "${resolutionNotes.trim().slice(0, 60)}"`,
      type: 'INFO'
    });

    const updated = fetchFullIssue(id);
    return res.json({ message: 'Issue marked as RESOLVED.', issue: updated });
  } catch (err) {
    console.error('Error resolving issue:', err);
    return res.status(500).json({ error: 'Failed to mark issue as resolved.' });
  }
};
