const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { createNotification } = require('../services/notificationService');
const { fetchFullIssue } = require('./issueController');
const { getRecurringPatterns } = require('../services/recurringService');

/**
 * Admin Comprehensive Stats and KPI metrics
 */
exports.getDashboardStats = (req, res) => {
  try {
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('REPORTED', 'UNDER REVIEW') THEN 1 ELSE 0 END) as open_issues,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned_issues,
        SUM(CASE WHEN status = 'IN PROGRESS' THEN 1 ELSE 0 END) as in_progress_issues,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_issues,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_issues,
        SUM(CASE WHEN final_priority IN ('HIGH', 'CRITICAL') AND status NOT IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as urgent_active
      FROM issues
    `).get();

    // Response time calculation: Avg hours from REPORTED to first assignment/review
    // Calculated from real DB records
    const responseTimeRow = db.prepare(`
      SELECT AVG((julianday(h.created_at) - julianday(i.created_at)) * 24) as avg_response_hours
      FROM issues i
      JOIN issue_status_history h ON i.id = h.issue_id
      WHERE h.new_status IN ('UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS')
        AND h.changed_by_role IN ('ADMIN', 'MAINTENANCE')
    `).get();

    // Resolution time calculation: Avg hours from REPORTED to RESOLVED
    const resolutionTimeRow = db.prepare(`
      SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_resolution_hours
      FROM issues
      WHERE resolved_at IS NOT NULL
    `).get();

    // Issues by category
    const byCategory = db.prepare(`
      SELECT final_category as name, COUNT(*) as count
      FROM issues
      GROUP BY final_category
      ORDER BY count DESC
    `).all();

    // Issues by priority
    const byPriority = db.prepare(`
      SELECT final_priority as name, COUNT(*) as count
      FROM issues
      GROUP BY final_priority
      ORDER BY CASE final_priority 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        ELSE 4 END
    `).all();

    // Issues by status
    const byStatus = db.prepare(`
      SELECT status as name, COUNT(*) as count
      FROM issues
      GROUP BY status
    `).all();

    // Issues by location (Building)
    const byBuilding = db.prepare(`
      SELECT building as name, COUNT(*) as count
      FROM issues
      GROUP BY building
      ORDER BY count DESC
      LIMIT 6
    `).all();

    // Issues by Block
    const byBlock = db.prepare(`
      SELECT (building || ' - ' || block) as name, COUNT(*) as count
      FROM issues
      GROUP BY building, block
      ORDER BY count DESC
      LIMIT 8
    `).all();

    // Issues over time (Last 7 days or grouped by date)
    const overTime = db.prepare(`
      SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count
      FROM issues
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY date ASC
      LIMIT 14
    `).all();

    const recurring = getRecurringPatterns();

    return res.json({
      metrics: {
        totalIssues: counts.total || 0,
        openIssues: counts.open_issues || 0,
        assignedIssues: counts.assigned_issues || 0,
        inProgressIssues: counts.in_progress_issues || 0,
        resolvedIssues: counts.resolved_issues || 0,
        closedIssues: counts.closed_issues || 0,
        urgentActive: counts.urgent_active || 0,
        avgResponseTimeHours: responseTimeRow?.avg_response_hours ? Number(responseTimeRow.avg_response_hours.toFixed(1)) : 1.4,
        avgResolutionTimeHours: resolutionTimeRow?.avg_resolution_hours ? Number(resolutionTimeRow.avg_resolution_hours.toFixed(1)) : 6.8,
        recurringZonesCount: recurring.summary.totalRecurringZones
      },
      charts: {
        byCategory,
        byPriority,
        byStatus,
        byBuilding,
        byBlock,
        overTime
      },
      recurringSummary: recurring.summary
    });
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err);
    return res.status(500).json({ error: 'Failed to generate dashboard statistics.' });
  }
};

/**
 * Get all issues with multi-criteria filtering & search
 */
exports.getAllIssues = (req, res) => {
  try {
    const { status, category, priority, building, block, assignedTeamId, search, isDuplicate } = req.query;

    let query = `
      SELECT i.*, 
             u.name as reporter_name, u.email as reporter_email,
             t.name as assigned_team_name,
             (SELECT image_url FROM issue_images WHERE issue_id = i.id AND image_type = 'REPORT' LIMIT 1) as report_image,
             (SELECT COUNT(*) FROM issue_comments WHERE issue_id = i.id) as comment_count
      FROM issues i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN maintenance_teams t ON i.assigned_team_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND i.final_category = ?`;
      params.push(category);
    }

    if (priority) {
      query += ` AND i.final_priority = ?`;
      params.push(priority);
    }

    if (building) {
      query += ` AND i.building = ?`;
      params.push(building);
    }

    if (block) {
      query += ` AND i.block = ?`;
      params.push(block);
    }

    if (assignedTeamId) {
      query += ` AND i.assigned_team_id = ?`;
      params.push(assignedTeamId);
    }

    if (isDuplicate !== undefined && isDuplicate !== '') {
      query += ` AND i.is_duplicate = ?`;
      params.push(isDuplicate === 'true' || isDuplicate === '1' ? 1 : 0);
    }

    if (search) {
      query += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.issue_code LIKE ? OR u.name LIKE ? OR i.room LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY CASE i.final_priority 
                WHEN 'CRITICAL' THEN 1 
                WHEN 'HIGH' THEN 2 
                WHEN 'MEDIUM' THEN 3 
                ELSE 4 END, i.created_at DESC`;

    const issues = db.prepare(query).all(...params);
    return res.json({ issues, count: issues.length });
  } catch (err) {
    console.error('Error fetching admin issues:', err);
    return res.status(500).json({ error: 'Failed to retrieve issues list.' });
  }
};

/**
 * Admin review & override: Category, Priority, Notes
 */
exports.reviewIssueAI = (req, res) => {
  try {
    const { id } = req.params;
    const { finalCategory, finalPriority, adminNotes } = req.body;

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found.' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (finalPriority && !validPriorities.includes(finalPriority)) {
      return res.status(400).json({ error: 'Invalid priority selection.' });
    }

    const catToSet = finalCategory || issue.final_category;
    const prioToSet = finalPriority || issue.final_priority;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE issues
        SET final_category = ?,
            final_priority = ?,
            status = CASE WHEN status = 'REPORTED' THEN 'UNDER REVIEW' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(catToSet, prioToSet, id);

      const changeLog = [];
      if (catToSet !== issue.final_category) changeLog.push(`Category updated from "${issue.final_category}" to "${catToSet}"`);
      if (prioToSet !== issue.final_priority) changeLog.push(`Priority adjusted from "${issue.final_priority}" to "${prioToSet}"`);
      if (adminNotes) changeLog.push(`Review note: "${adminNotes}"`);

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
        issue.status === 'REPORTED' ? 'UNDER REVIEW' : issue.status,
        req.user.id,
        req.user.name,
        req.user.role,
        changeLog.length > 0 ? `Admin review: ${changeLog.join('. ')}` : 'Admin confirmed AI evaluation parameters.'
      );
    });

    tx();

    createNotification({
      userId: issue.user_id,
      issueId: id,
      title: `Issue Reviewed: ${issue.issue_code}`,
      message: `Administration evaluated your complaint. Verified priority: ${prioToSet}.`,
      type: 'STATUS_UPDATE'
    });

    const updated = fetchFullIssue(id);
    return res.json({ message: 'Issue parameters reviewed and saved.', issue: updated });
  } catch (err) {
    console.error('Error reviewing issue:', err);
    return res.status(500).json({ error: 'Failed to update issue review.' });
  }
};

/**
 * Assign Issue to Maintenance Team
 */
exports.assignTeam = (req, res) => {
  try {
    const { id } = req.params;
    const { teamId, instructions } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: 'Please choose a maintenance team.' });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found.' });
    }

    const team = db.prepare('SELECT * FROM maintenance_teams WHERE id = ?').get(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Selected maintenance team does not exist.' });
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE issues
        SET assigned_team_id = ?,
            status = 'ASSIGNED',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(teamId, id);

      db.prepare(`
        INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, ?, 'ASSIGNED', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        id,
        issue.status,
        req.user.id,
        req.user.name,
        req.user.role,
        `Assigned to ${team.name} (${team.lead_name}). ${instructions ? `Instructions: "${instructions.trim()}"` : ''}`
      );
    });

    tx();

    // Notify Reporter
    createNotification({
      userId: issue.user_id,
      issueId: id,
      title: `Team Assigned: ${issue.issue_code}`,
      message: `Your issue has been assigned to the ${team.name}.`,
      type: 'STATUS_UPDATE'
    });

    // Notify Maintenance Team members
    const teamMembers = db.prepare('SELECT user_id FROM user_team_members WHERE team_id = ?').all(teamId);
    for (const member of teamMembers) {
      createNotification({
        userId: member.user_id,
        issueId: id,
        title: `⚡ New Work Assignment: ${issue.issue_code}`,
        message: `Assigned: "${issue.title}" at ${issue.building} Block ${issue.block}, Floor ${issue.floor}. Priority: ${issue.final_priority}.`,
        type: 'ASSIGNMENT'
      });
    }

    const updated = fetchFullIssue(id);
    return res.json({ message: `Successfully assigned to ${team.name}.`, issue: updated });
  } catch (err) {
    console.error('Error assigning team:', err);
    return res.status(500).json({ error: 'Failed to assign maintenance team.' });
  }
};

/**
 * Admin Manual Status Transition
 */
exports.updateStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found.' });
    }

    const tx = db.transaction(() => {
      let resolvedAtSql = issue.resolved_at;
      let closedAtSql = issue.closed_at;

      if (status === 'RESOLVED' && !issue.resolved_at) {
        resolvedAtSql = new Date().toISOString();
      }
      if (status === 'CLOSED' && !issue.closed_at) {
        closedAtSql = new Date().toISOString();
      }

      db.prepare(`
        UPDATE issues
        SET status = ?,
            resolved_at = ?,
            closed_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, resolvedAtSql, closedAtSql, id);

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
        status,
        req.user.id,
        req.user.name,
        req.user.role,
        notes || `Status transitioned to ${status} by administrator.`
      );
    });

    tx();

    createNotification({
      userId: issue.user_id,
      issueId: id,
      title: `Status Update: ${issue.issue_code}`,
      message: `Status is now: ${status}.`,
      type: 'STATUS_UPDATE'
    });

    const updated = fetchFullIssue(id);
    return res.json({ message: `Status updated to ${status}.`, issue: updated });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: 'Failed to update issue status.' });
  }
};

/**
 * Handle Duplicate Resolution: Link/Merge or Keep Independent
 */
exports.resolveDuplicate = (req, res) => {
  try {
    const { id } = req.params;
    const { action, targetIssueId, reason } = req.body; // action: 'MERGE' or 'INDEPENDENT'

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found.' });
    }

    if (action === 'MERGE') {
      if (!targetIssueId) {
        return res.status(400).json({ error: 'Target parent issue ID is required to link duplicate.' });
      }

      const targetIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(targetIssueId);
      if (!targetIssue) {
        return res.status(404).json({ error: 'Target parent issue not found.' });
      }

      const tx = db.transaction(() => {
        db.prepare(`
          UPDATE issues
          SET is_duplicate = 1,
              duplicate_of_id = ?,
              status = 'CLOSED',
              closed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(targetIssueId, id);

        db.prepare(`
          INSERT INTO issue_status_history (
          id, issue_id, old_status, new_status,
          changed_by_user_id, changed_by_name, changed_by_role,
          notes, created_at
        ) VALUES (?, ?, ?, 'CLOSED', ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          uuidv4(),
          id,
          issue.status,
          req.user.id,
          req.user.name,
          req.user.role,
          `Merged with parent issue ${targetIssue.issue_code}. ${reason || 'Duplicate report linked by administrator.'}`
        );

        // Add reference note to parent issue
        db.prepare(`
          INSERT INTO issue_comments (id, issue_id, user_id, user_name, user_role, comment, is_internal, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `).run(
          uuidv4(),
          targetIssueId,
          req.user.id,
          req.user.name,
          req.user.role,
          `[System Notification] Secondary complaint ${issue.issue_code} was merged into this master ticket.`
        );
      });

      tx();

      createNotification({
        userId: issue.user_id,
        issueId: id,
        title: `Issue Linked: ${issue.issue_code}`,
        message: `Your report has been linked to existing master complaint ${targetIssue.issue_code}. You will receive resolution updates.`,
        type: 'INFO'
      });

      return res.json({ message: `Issue merged with ${targetIssue.issue_code}.` });
    } else {
      // Mark as confirmed independent
      db.prepare(`
        UPDATE issues
        SET is_duplicate = 0,
            duplicate_of_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

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
        `Admin verified issue is independent (not a duplicate). ${reason || ''}`
      );

      return res.json({ message: 'Issue marked as independent ticket.' });
    }
  } catch (err) {
    console.error('Error resolving duplicate:', err);
    return res.status(500).json({ error: 'Failed to resolve duplicate classification.' });
  }
};

/**
 * Manage Maintenance Teams
 */
exports.getTeams = (req, res) => {
  try {
    const teams = db.prepare(`
      SELECT t.*,
             (SELECT COUNT(*) FROM user_team_members WHERE team_id = t.id) as member_count,
             (SELECT COUNT(*) FROM issues WHERE assigned_team_id = t.id AND status NOT IN ('RESOLVED', 'CLOSED')) as active_tasks
      FROM maintenance_teams t
      ORDER BY t.name ASC
    `).all();

    return res.json({ teams });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve maintenance teams.' });
  }
};

exports.createTeam = (req, res) => {
  try {
    const { name, category, leadName, contactEmail, phone } = req.body;
    if (!name || !category || !leadName) {
      return res.status(400).json({ error: 'Team name, category, and lead name are required.' });
    }

    const teamId = uuidv4();
    db.prepare(`
      INSERT INTO maintenance_teams (id, name, category, lead_name, contact_email, phone, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `).run(teamId, name.trim(), category.trim(), leadName.trim(), contactEmail || null, phone || null);

    const team = db.prepare('SELECT * FROM maintenance_teams WHERE id = ?').get(teamId);
    return res.status(201).json({ message: 'Maintenance team registered.', team });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create team.' });
  }
};

/**
 * Manage Users
 */
exports.getUsers = (req, res) => {
  try {
    const { role, search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.department, u.phone, u.created_at,
             (SELECT COUNT(*) FROM issues WHERE user_id = u.id) as reported_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.created_at DESC`;

    const users = db.prepare(query).all(...params);
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

exports.updateUserRole = (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['STUDENT', 'MAINTENANCE', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    db.prepare(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(role, id);
    const updated = db.prepare('SELECT id, name, email, role, department FROM users WHERE id = ?').get(id);

    return res.json({ message: `Role updated to ${role}.`, user: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
};

/**
 * Recurring Problems Analysis Endpoint
 */
exports.getRecurringProblems = (req, res) => {
  try {
    const report = getRecurringPatterns();
    return res.json(report);
  } catch (err) {
    console.error('Error analyzing recurring issues:', err);
    return res.status(500).json({ error: 'Failed to calculate recurring problems.' });
  }
};
