const { getUserNotifications, markAsRead, markAllAsRead } = require('../services/notificationService');

exports.getMyNotifications = (req, res) => {
  try {
    const notifications = getUserNotifications(req.user.id, req.user.role);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
};

exports.markOneRead = (req, res) => {
  try {
    const { id } = req.params;
    markAsRead(id, req.user.id);
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
};

exports.markAllRead = (req, res) => {
  try {
    markAllAsRead(req.user.id, req.user.role);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
};
