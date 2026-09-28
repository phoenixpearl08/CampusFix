const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

function createNotification({ userId = null, roleTarget = null, issueId = null, title, message, type = 'INFO' }) {
  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, role_target, issue_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(id, userId, roleTarget, issueId, title, message, type);
    return id;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

function getUserNotifications(userId, userRole) {
  // Query notifications either explicitly targeted to the user or targeted to their role
  const rows = db.prepare(`
    SELECT n.*, i.issue_code, i.title as issue_title
    FROM notifications n
    LEFT JOIN issues i ON n.issue_id = i.id
    WHERE n.user_id = ? OR (n.user_id IS NULL AND n.role_target = ?)
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(userId, userRole);

  return rows;
}

function markAsRead(notificationId, userId) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND (user_id = ? OR user_id IS NULL)
  `).run(notificationId, userId);
}

function markAllAsRead(userId, userRole) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ? OR (user_id IS NULL AND role_target = ?)
  `).run(userId, userRole);
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
