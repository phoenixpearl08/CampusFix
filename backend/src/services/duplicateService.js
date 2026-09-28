/**
 * Duplicate Detection Service for CampusFix
 * Uses multi-factor matching: Location hierarchy, Category match, and Text token similarity.
 */

const db = require('../db/database');

/**
 * Tokenize and normalize text into clean unique words
 */
function tokenize(text = '') {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

/**
 * Jaccard similarity between two token sets
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Find active issues matching location, category and description
 */
function findDuplicates({
  excludeIssueId = null,
  building = '',
  block = '',
  floor = '',
  room = '',
  category = '',
  title = '',
  description = ''
}) {
  // Query active issues
  let query = `
    SELECT id, issue_code, title, description, building, block, floor, room,
           final_category, final_priority, status, created_at, user_id
    FROM issues
    WHERE status IN ('REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS')
  `;
  const params = [];

  if (excludeIssueId) {
    query += ` AND id != ?`;
    params.push(excludeIssueId);
  }

  const activeIssues = db.prepare(query).all(...params);

  const inputTokens = tokenize(`${title} ${description}`);
  const matches = [];

  for (const issue of activeIssues) {
    let score = 0;
    const matchReasons = [];

    // 1. Location match scoring
    const sameBuilding = issue.building && building && issue.building.toLowerCase() === building.toLowerCase();
    const sameBlock = issue.block && block && issue.block.toLowerCase() === block.toLowerCase();
    const sameFloor = issue.floor && floor && issue.floor.toLowerCase() === floor.toLowerCase();
    const sameRoom = issue.room && room && issue.room.toLowerCase() === room.toLowerCase();

    if (sameBuilding && sameBlock && sameFloor && sameRoom) {
      score += 45;
      matchReasons.push('Exact room and floor location match');
    } else if (sameBuilding && sameBlock && sameFloor) {
      score += 30;
      matchReasons.push('Same building block and floor');
    } else if (sameBuilding && sameBlock) {
      score += 15;
      matchReasons.push('Same building and block');
    }

    // 2. Category match scoring
    if (category && issue.final_category && category.toLowerCase() === issue.final_category.toLowerCase()) {
      score += 25;
      matchReasons.push(`Matching category (${issue.final_category})`);
    }

    // 3. Text description similarity
    const existingTokens = tokenize(`${issue.title} ${issue.description}`);
    const textSim = jaccardSimilarity(inputTokens, existingTokens);
    const textPoints = Math.round(textSim * 30);
    score += textPoints;

    if (textSim > 0.25) {
      matchReasons.push(`High textual similarity (${Math.round(textSim * 100)}% match)`);
    }

    // Threshold: 40% match
    if (score >= 40) {
      // Get report image if any
      const imageRow = db.prepare(`SELECT image_url FROM issue_images WHERE issue_id = ? AND image_type = 'REPORT' LIMIT 1`).get(issue.id);

      matches.push({
        issueId: issue.id,
        issueCode: issue.issue_code,
        title: issue.title,
        description: issue.description,
        location: `${issue.building} - Block ${issue.block}, Floor ${issue.floor}${issue.room ? `, Room ${issue.room}` : ''}`,
        category: issue.final_category,
        priority: issue.final_priority,
        status: issue.status,
        createdAt: issue.created_at,
        imageUrl: imageRow ? imageRow.image_url : null,
        similarityScore: Math.min(score, 99),
        reasons: matchReasons
      });
    }
  }

  // Sort descending by similarity score
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  return matches;
}

module.exports = {
  findDuplicates
};
