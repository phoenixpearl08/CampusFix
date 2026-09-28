const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Full CampusFix E2E Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('1. Testing Health API...');
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert(healthRes.status === 'healthy', 'Health check returns healthy status');

  // 2. Authentication: Student, Maintenance, Admin logins
  console.log('\n2. Testing Authentication...');
  const studentLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@campusfix.edu', password: 'password123' })
  }).then(r => r.json());
  assert(studentLogin.token && studentLogin.user.role === 'STUDENT', 'Student authentication successful');

  const techLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tech@campusfix.edu', password: 'password123' })
  }).then(r => r.json());
  assert(techLogin.token && techLogin.user.role === 'MAINTENANCE', 'Maintenance authentication successful');

  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campusfix.edu', password: 'password123' })
  }).then(r => r.json());
  assert(adminLogin.token && adminLogin.user.role === 'ADMIN', 'Admin authentication successful');

  // 3. Testing RBAC
  console.log('\n3. Testing Role-Based Access Control (RBAC)...');
  const studentAccessAdmin = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${studentLogin.token}` }
  });
  assert(studentAccessAdmin.status === 403, 'Student blocked from admin route (403 Forbidden)');

  const studentAccessMaintenance = await fetch(`${BASE_URL}/maintenance/assigned`, {
    headers: { 'Authorization': `Bearer ${studentLogin.token}` }
  });
  assert(studentAccessMaintenance.status === 403, 'Student blocked from maintenance route (403 Forbidden)');

  const techAccessAdmin = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${techLogin.token}` }
  });
  assert(techAccessAdmin.status === 403, 'Maintenance tech blocked from admin route (403 Forbidden)');

  // 4. Testing AI Diagnostics & Priority Evaluation
  console.log('\n4. Testing AI Category & Priority Analysis...');
  const aiTestPayload = {
    title: 'Water leaking directly over high-voltage server power rack',
    description: 'Severe water leak from ceiling falling onto 240V power strip and server rack with visible sparks.',
    building: 'Engineering Complex',
    block: 'Block B',
    floor: 'Floor 2',
    room: 'Lab 210'
  };

  const aiPreviewRes = await fetch(`${BASE_URL}/issues/analyze-preview`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(aiTestPayload)
  }).then(r => r.json());

  assert(aiPreviewRes.aiAnalysis.detectedCategory === 'Electrical', 'AI correctly categorized as Electrical');
  assert(aiPreviewRes.aiAnalysis.suggestedPriority === 'CRITICAL', 'AI elevated compound hazard (water+electricity) to CRITICAL');
  assert(aiPreviewRes.aiAnalysis.reasoning.length > 20, 'AI generated clear explanation reasoning');

  // 5. Duplicate Detection
  console.log('\n5. Testing Duplicate Detection...');
  assert(aiPreviewRes.duplicates && aiPreviewRes.duplicates.length > 0, 'Duplicate check found existing issue in same block & room');
  if (aiPreviewRes.duplicates.length > 0) {
    console.log(`     Detected duplicate ticket: ${aiPreviewRes.duplicates[0].issueCode} (Match: ${aiPreviewRes.duplicates[0].similarityScore}%)`);
  }

  // 6. Issue Creation Flow
  console.log('\n6. Testing Issue Creation & Code Generation...');
  const createIssueRes = await fetch(`${BASE_URL}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...aiTestPayload,
      forceCreate: true
    })
  }).then(r => r.json());

  const createdIssue = createIssueRes.issue;
  assert(createdIssue && createdIssue.issue_code.startsWith('CF-'), `Issue created with unique code: ${createdIssue?.issue_code}`);
  assert(createdIssue.status === 'REPORTED', 'Initial status set to REPORTED');
  assert(createdIssue.timeline && createdIssue.timeline.length >= 2, 'Timeline logged initial submission and AI diagnostic milestone');

  // 7. Admin Review & AI Override
  console.log('\n7. Testing Admin AI Review & Override...');
  const reviewRes = await fetch(`${BASE_URL}/admin/issues/${createdIssue.id}/review`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      finalCategory: 'Electrical',
      finalPriority: 'CRITICAL',
      adminNotes: 'Admin confirmed high-voltage hazard.'
    })
  }).then(r => r.json());
  assert(reviewRes.issue.status === 'UNDER REVIEW', 'Issue transitioned to UNDER REVIEW upon admin evaluation');

  // 8. Admin Team Assignment
  console.log('\n8. Testing Maintenance Team Assignment...');
  const teams = await fetch(`${BASE_URL}/admin/teams`, {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  const elecTeam = teams.teams.find(t => t.category === 'Electrical') || teams.teams[0];

  const assignRes = await fetch(`${BASE_URL}/admin/issues/${createdIssue.id}/assign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      teamId: elecTeam.id,
      instructions: 'Urgent: isolate breakers first.'
    })
  }).then(r => r.json());
  assert(assignRes.issue.status === 'ASSIGNED', 'Status updated to ASSIGNED');
  assert(assignRes.issue.assigned_team_id === elecTeam.id, 'Assigned team ID updated');

  // 9. Maintenance Field Actions: Start Work, Progress, Resolve
  console.log('\n9. Testing Maintenance Operations (Start Work -> Progress -> Resolve)...');
  const startWorkRes = await fetch(`${BASE_URL}/maintenance/issues/${createdIssue.id}/start-work`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${techLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notes: 'Arrived at Lab 210 with voltage tester.' })
  }).then(r => r.json());
  assert(startWorkRes.issue.status === 'IN PROGRESS', 'Status transitioned to IN PROGRESS');

  const progressRes = await fetch(`${BASE_URL}/maintenance/issues/${createdIssue.id}/progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${techLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notes: 'Pipe leak sealed. Breakers dried and insulation resistance verified at 50 Megohms.' })
  }).then(r => r.json());
  assert(progressRes.issue.comments.length > 0, 'Progress update note appended to activity');

  const resolveRes = await fetch(`${BASE_URL}/maintenance/issues/${createdIssue.id}/resolve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${techLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resolutionNotes: 'Replaced damaged conduit, restored server rack power. All circuits safe.' })
  }).then(r => r.json());
  assert(resolveRes.issue.status === 'RESOLVED', 'Status transitioned to RESOLVED');

  // 10. Student Resolution Verification & Closure
  console.log('\n10. Testing Student Confirmation & Closure...');
  const closeRes = await fetch(`${BASE_URL}/issues/${createdIssue.id}/confirm-resolution`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentLogin.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feedbackNotes: 'Checked lab, power is back and ceiling is dry. Thank you!' })
  }).then(r => r.json());
  assert(closeRes.issue.status === 'CLOSED', 'Status transitioned to CLOSED by student reporter');

  // 11. Recurring Problems Analysis
  console.log('\n11. Testing Recurring Problem Analysis Calculation...');
  const recurringRes = await fetch(`${BASE_URL}/admin/recurring-problems`, {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  assert(recurringRes.insights.length > 0, 'Recurring patterns calculated from database');
  assert(recurringRes.categoryClusters.length > 0, 'Category clusters detected');
  console.log(`     Top pattern identified: "${recurringRes.insights[0]?.title}"`);

  // 12. Notifications System
  console.log('\n12. Testing Notifications System...');
  const notificationsRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${studentLogin.token}` }
  }).then(r => r.json());
  assert(notificationsRes.notifications.length > 0, 'Notifications created and received for student user');

  console.log(`\n==================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
