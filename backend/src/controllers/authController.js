const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT', department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
    }

    const validRoles = ['STUDENT', 'MAINTENANCE', 'ADMIN'];
    const assignedRole = validRoles.includes(role) ? role : 'STUDENT';

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, department, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(userId, name.trim(), email.trim().toLowerCase(), passwordHash, assignedRole, department || null, phone || null);

    // If maintenance user, assign to default team if available
    if (assignedRole === 'MAINTENANCE') {
      const defaultTeam = db.prepare('SELECT id FROM maintenance_teams WHERE active = 1 LIMIT 1').get();
      if (defaultTeam) {
        db.prepare('INSERT OR IGNORE INTO user_team_members (user_id, team_id) VALUES (?, ?)').run(userId, defaultTeam.id);
      }
    }

    const token = jwt.sign({ id: userId, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: assignedRole,
        department: department || null,
        phone: phone || null
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Fetch team memberships if maintenance user
    let team = null;
    if (user.role === 'MAINTENANCE') {
      team = db.prepare(`
        SELECT t.id, t.name, t.category 
        FROM maintenance_teams t
        JOIN user_team_members utm ON t.id = utm.team_id
        WHERE utm.user_id = ?
        LIMIT 1
      `).get(user.id);
    }

    return res.json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        team
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
};

exports.getMe = (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, department, phone, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    let team = null;
    if (user.role === 'MAINTENANCE') {
      team = db.prepare(`
        SELECT t.id, t.name, t.category 
        FROM maintenance_teams t
        JOIN user_team_members utm ON t.id = utm.team_id
        WHERE utm.user_id = ?
        LIMIT 1
      `).get(user.id);
    }

    return res.json({ user: { ...user, team } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
};

exports.updateProfile = (req, res) => {
  try {
    const { name, department, phone } = req.body;
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          department = COALESCE(?, department),
          phone = COALESCE(?, phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name ? name.trim() : null, department ? department.trim() : null, phone ? phone.trim() : null, req.user.id);

    const updated = db.prepare('SELECT id, name, email, role, department, phone FROM users WHERE id = ?').get(req.user.id);
    return res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};
