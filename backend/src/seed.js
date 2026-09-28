const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/database');

async function runSeed() {
  console.log('🌱 Starting CampusFix database seed...');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Database already contains users. Skipping duplicate seeding.');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const adminId = uuidv4();
  const maintenanceId = uuidv4();
  const studentId = uuidv4();
  const student2Id = uuidv4();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, department, phone, created_at)
    VALUES 
      (?, 'Admin Director Vance', 'admin@campusfix.edu', ?, 'ADMIN', 'Campus Operations & Safety', '+1-555-0100', datetime('now', '-10 days')),
      (?, 'Senior Tech Sparks', 'tech@campusfix.edu', ?, 'MAINTENANCE', 'Facility Maintenance Division', '+1-555-0101', datetime('now', '-9 days')),
      (?, 'Alex Rivera', 'student@campusfix.edu', ?, 'STUDENT', 'Computer Science Dept', '+1-555-0102', datetime('now', '-8 days')),
      (?, 'Maya Patel', 'maya.patel@campusfix.edu', ?, 'STUDENT', 'Electrical Engineering Dept', '+1-555-0103', datetime('now', '-7 days'))
  `).run(
    adminId, passwordHash,
    maintenanceId, passwordHash,
    studentId, passwordHash,
    student2Id, passwordHash
  );

  // 2. Create Maintenance Teams
  const elecTeamId = uuidv4();
  const plumbTeamId = uuidv4();
  const carpTeamId = uuidv4();
  const sanitTeamId = uuidv4();
  const netTeamId = uuidv4();

  db.prepare(`
    INSERT INTO maintenance_teams (id, name, category, lead_name, contact_email, phone, active)
    VALUES
      (?, 'Campus Electrical Works', 'Electrical', 'Senior Tech Sparks', 'electrical@campusfix.edu', '+1-555-0201', 1),
      (?, 'Rapid Plumbing Response', 'Plumbing', 'Sarah Waters', 'plumbing@campusfix.edu', '+1-555-0202', 1),
      (?, 'Carpentry & Structural Team', 'Furniture & Carpentry', 'Mike Miller', 'carpentry@campusfix.edu', '+1-555-0203', 1),
      (?, 'Campus Sanitization Squad', 'Sanitation & Hygiene', 'Elena White', 'sanitation@campusfix.edu', '+1-555-0204', 1),
      (?, 'IT & Campus Networks', 'IT & Wi-Fi Network', 'David Byte', 'it-networks@campusfix.edu', '+1-555-0205', 1)
  `).run(elecTeamId, plumbTeamId, carpTeamId, sanitTeamId, netTeamId);

  // Bind tech user to Electrical Team
  db.prepare('INSERT INTO user_team_members (user_id, team_id) VALUES (?, ?)').run(maintenanceId, elecTeamId);

  // 3. Create Campus Locations
  const locations = [
    { b: 'Engineering Complex', bl: 'Block A', f: 'Floor 1', r: 'Room 101', d: 'Freshman Lecture Hall' },
    { b: 'Engineering Complex', bl: 'Block B', f: 'Floor 2', r: 'Washroom 204', d: 'East Wing Restroom' },
    { b: 'Engineering Complex', bl: 'Block B', f: 'Floor 2', r: 'Lab 210', d: 'Hydraulics & Fluid Dynamics Lab' },
    { b: 'Engineering Complex', bl: 'Block B', f: 'Floor 3', r: 'Room 305', d: 'Robotics Workshop' },
    { b: 'Science & Technology', bl: 'Block S1', f: 'Floor 2', r: 'Washroom 202', d: 'Main Chemistry Washroom' },
    { b: 'Central Academic Block', bl: 'Block CAB', f: 'Floor 1', r: 'Auditorium A', d: 'Main Campus Hall' },
    { b: 'Main Student Library', bl: 'East Wing', f: 'Floor 2', r: 'Study Pod 12', d: 'Silent Reading Zone' }
  ];

  for (const loc of locations) {
    db.prepare(`
      INSERT INTO locations (id, building, block, floor, room, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), loc.b, loc.bl, loc.f, loc.r, loc.d);
  }

  // 4. Create Issues with Complete Real Workflow Lifecycles
  // Issue 1: CRITICAL Water Leak near Electrical Panel (IN PROGRESS)
  const issue1Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room, map_coordinates,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00001', ?, 'Water dripping directly onto electrical fuse junction box',
      'Ceiling pipe joint is leaking heavily directly above the main 415V distribution board. Noticeable dampness and slight sizzling sound.',
      'Engineering Complex', 'Block B', 'Floor 2', 'Lab 210', '37.7749,-122.4194',
      'Electrical', 'Electrical', 'Electrical',
      'CRITICAL', 'CRITICAL', 'IN PROGRESS', ?,
      datetime('now', '-5 hours'), datetime('now', '-1 hour')
    )
  `).run(issue1Id, studentId, elecTeamId);

  // AI Analysis for Issue 1
  db.prepare(`
    INSERT INTO ai_analyses (id, issue_id, detected_category, suggested_priority, confidence_score, reasoning, keywords_detected, image_analysis, duplicate_candidates)
    VALUES (?, ?, 'Electrical', 'CRITICAL', 0.98, 'Compound hazard detected: Water leakage co-located with high-voltage distribution board presents immediate threat of arc-flash, fire, and electrocution.', ?, ?, '[]')
  `).run(uuidv4(), issue1Id, JSON.stringify(['water leak', 'fuse junction box', 'sizzling']), JSON.stringify({ verifiedHazard: true, riskClass: 'Life-Safety' }));

  // Timeline for Issue 1
  db.prepare(`
    INSERT INTO issue_status_history (id, issue_id, old_status, new_status, changed_by_user_id, changed_by_name, changed_by_role, notes, created_at)
    VALUES 
      (?, ?, NULL, 'REPORTED', ?, 'Alex Rivera', 'STUDENT', 'Issue submitted via mobile app.', datetime('now', '-5 hours')),
      (?, ?, 'REPORTED', 'REPORTED', NULL, 'CampusFix AI Engine', 'AI_SYSTEM', 'AI classified as Electrical / CRITICAL priority due to electrocution risk.', datetime('now', '-4 hours 58 minutes')),
      (?, ?, 'REPORTED', 'UNDER REVIEW', ?, 'Admin Director Vance', 'ADMIN', 'Urgent review triggered. Safety team informed.', datetime('now', '-4 hours 40 minutes')),
      (?, ?, 'UNDER REVIEW', 'ASSIGNED', ?, 'Admin Director Vance', 'ADMIN', 'Dispatched to Campus Electrical Works emergency response.', datetime('now', '-4 hours 30 minutes')),
      (?, ?, 'ASSIGNED', 'IN PROGRESS', ?, 'Senior Tech Sparks', 'MAINTENANCE', 'Crew on site. Main breaker isolated. Commencing leak containment and wiring inspection.', datetime('now', '-1 hour'))
  `).run(
    uuidv4(), issue1Id, studentId,
    uuidv4(), issue1Id,
    uuidv4(), issue1Id, adminId,
    uuidv4(), issue1Id, adminId,
    uuidv4(), issue1Id, maintenanceId
  );

  // Issue 2: Broken Projector & Wi-Fi in Lecture Hall (RESOLVED, waiting student confirm)
  const issue2Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room, map_coordinates,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      resolution_notes, resolved_at, created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00002', ?, 'Ceiling HDMI projector flickering and Access Point offline',
      'The overhead projector in Room 101 loses video feed every 2 minutes. The nearest ceiling Cisco Wi-Fi pod also shows an amber fault light.',
      'Engineering Complex', 'Block A', 'Floor 1', 'Room 101', '37.7752,-122.4180',
      'IT & Wi-Fi Network', 'IT & Wi-Fi Network', 'IT & Wi-Fi Network',
      'HIGH', 'HIGH', 'RESOLVED', ?,
      'Replaced damaged HDMI splitter module, reset PoE switch port for Cisco AP pod. Both video and 5GHz Wi-Fi tested operational.',
      datetime('now', '-2 hours'), datetime('now', '-1 day'), datetime('now', '-2 hours')
    )
  `).run(issue2Id, studentId, netTeamId);

  db.prepare(`
    INSERT INTO ai_analyses (id, issue_id, detected_category, suggested_priority, confidence_score, reasoning, keywords_detected, image_analysis, duplicate_candidates)
    VALUES (?, ?, 'IT & Wi-Fi Network', 'HIGH', 0.94, 'High priority assigned due to impact on large-scale lecture delivery in Room 101.', ?, null, '[]')
  `).run(uuidv4(), issue2Id, JSON.stringify(['projector', 'hdmi', 'access point', 'wifi']));

  db.prepare(`
    INSERT INTO issue_status_history (id, issue_id, old_status, new_status, changed_by_user_id, changed_by_name, changed_by_role, notes, created_at)
    VALUES 
      (?, ?, NULL, 'REPORTED', ?, 'Alex Rivera', 'STUDENT', 'Reported during 9 AM physics lecture.', datetime('now', '-1 day')),
      (?, ?, 'REPORTED', 'ASSIGNED', ?, 'Admin Director Vance', 'ADMIN', 'Assigned to IT & Campus Networks.', datetime('now', '-22 hours')),
      (?, ?, 'ASSIGNED', 'IN PROGRESS', ?, 'David Byte', 'MAINTENANCE', 'Technician testing cables and switch ports.', datetime('now', '-4 hours')),
      (?, ?, 'IN PROGRESS', 'RESOLVED', ?, 'David Byte', 'MAINTENANCE', 'Replaced damaged HDMI splitter and restarted AP.', datetime('now', '-2 hours'))
  `).run(
    uuidv4(), issue2Id, studentId,
    uuidv4(), issue2Id, adminId,
    uuidv4(), issue2Id, maintenanceId,
    uuidv4(), issue2Id, maintenanceId
  );

  // Issue 3: Recurring Plumbing Leak in Block B Washroom 204 (CLOSED)
  const issue3Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      resolution_notes, resolved_at, closed_at, created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00003', ?, 'Persistent faucet pressure leak flooding floor tiles',
      'The center basin faucet in Washroom 204 does not shut off completely and has leaked a pool of water across the entryway.',
      'Engineering Complex', 'Block B', 'Floor 2', 'Washroom 204',
      'Plumbing', 'Plumbing', 'Plumbing',
      'MEDIUM', 'MEDIUM', 'CLOSED', ?,
      'Replaced internal washer and shutoff cartridge valve. Sanitized floor puddle.',
      datetime('now', '-3 days'), datetime('now', '-2 days'), datetime('now', '-4 days'), datetime('now', '-2 days')
    )
  `).run(issue3Id, student2Id, plumbTeamId);

  // Issue 4: Another Plumbing report in Block B Washroom (To form authentic recurring pattern!)
  const issue4Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00004', ?, 'Flush valve stuck running continuously in stall 3',
      'Toilet flush mechanism in Washroom 204 is jammed and overflowing onto the drainage grate.',
      'Engineering Complex', 'Block B', 'Floor 2', 'Washroom 204',
      'Plumbing', 'Plumbing', 'Plumbing',
      'MEDIUM', 'MEDIUM', 'REPORTED', ?,
      datetime('now', '-2 days'), datetime('now', '-2 days')
    )
  `).run(issue4Id, student2Id, plumbTeamId);

  // Issue 5: Third plumbing issue in Block B (Solidifying recurring cluster!)
  const issue5Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00005', ?, 'Drain blockage and sewage smell in Block B utility duct',
      'Water backing up in the floor trap outside Room 305 with unpleasant sewer gas odor.',
      'Engineering Complex', 'Block B', 'Floor 3', 'Room 305',
      'Plumbing', 'Plumbing', 'Plumbing',
      'HIGH', 'HIGH', 'ASSIGNED', ?,
      datetime('now', '-18 hours'), datetime('now', '-6 hours')
    )
  `).run(issue5Id, studentId, plumbTeamId);

  // Issue 6: Science Block S1 Washroom Leak (Another recurring cluster)
  const issue6Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00006', ?, 'Under-sink pipe leakage in Chemistry Washroom 202',
      'Continuous stream of water pooling under the three main sinks in Washroom 202.',
      'Science & Technology', 'Block S1', 'Floor 2', 'Washroom 202',
      'Plumbing', 'Plumbing', 'Plumbing',
      'MEDIUM', 'MEDIUM', 'UNDER REVIEW', ?,
      datetime('now', '-1 day'), datetime('now', '-12 hours')
    )
  `).run(issue6Id, student2Id, plumbTeamId);

  // Issue 7: Science Block S1 Washroom secondary complaint (Duplicate candidate demo)
  const issue7Id = uuidv4();
  db.prepare(`
    INSERT INTO issues (
      id, issue_code, user_id, title, description,
      building, block, floor, room,
      user_category, ai_category, final_category,
      ai_priority, final_priority, status, assigned_team_id,
      created_at, updated_at
    ) VALUES (
      ?, 'CF-2026-00007', ?, 'Water pipe leaking under sinks in second floor restroom',
      'Water on the floor under sinks in Washroom 202 S1. Slip hazard for students.',
      'Science & Technology', 'Block S1', 'Floor 2', 'Washroom 202',
      'Plumbing', 'Plumbing', 'Plumbing',
      'MEDIUM', 'MEDIUM', 'REPORTED', null,
      datetime('now', '-10 hours'), datetime('now', '-10 hours')
    )
  `).run(issue7Id, studentId);

  // Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, role_target, issue_id, title, message, type, is_read, created_at)
    VALUES
      (?, ?, NULL, ?, 'Work Started on CF-2026-00001', 'Technician arrived at Lab 210 for emergency electrical containment.', 'STATUS_UPDATE', 0, datetime('now', '-1 hour')),
      (?, ?, NULL, ?, 'Issue CF-2026-00002 Marked Resolved', 'HDMI and Wi-Fi in Room 101 repaired. Please verify and confirm resolution.', 'STATUS_UPDATE', 0, datetime('now', '-2 hours')),
      (?, NULL, 'ADMIN', ?, '🚨 CRITICAL Hazard Reported: CF-2026-00001', 'Water leak near electrical distribution board in Block B Lab 210.', 'ALERT', 0, datetime('now', '-5 hours'))
  `).run(
    uuidv4(), studentId, issue1Id,
    uuidv4(), studentId, issue2Id,
    uuidv4(), issue1Id
  );

  console.log('✅ CampusFix database successfully seeded with realistic campus issues, roles, and recurring patterns!');
}

module.exports = { runSeed };

if (require.main === module) {
  runSeed().catch(console.error);
}
