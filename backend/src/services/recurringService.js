/**
 * Recurring Problem Analysis Service for CampusFix
 * Calculates actual historical complaint patterns from database records.
 * Identifies high-frequency problem zones, repeated category failures, and chronic infrastructure issues.
 */

const db = require('../db/database');

function getRecurringPatterns() {
  // 1. Group by Building, Block, Category with 2 or more reports
  const categoryClusters = db.prepare(`
    SELECT 
      building,
      block,
      final_category AS category,
      COUNT(*) AS total_count,
      SUM(CASE WHEN status IN ('REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS') THEN 1 ELSE 0 END) AS active_count,
      SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS resolved_count,
      MIN(created_at) AS first_reported_at,
      MAX(created_at) AS latest_reported_at
    FROM issues
    GROUP BY building, block, final_category
    HAVING COUNT(*) >= 2
    ORDER BY total_count DESC, active_count DESC
  `).all();

  // 2. Group by exact Room/Floor hotspots with 2 or more reports
  const roomHotspots = db.prepare(`
    SELECT 
      building,
      block,
      floor,
      room,
      final_category AS category,
      COUNT(*) AS total_count,
      SUM(CASE WHEN status IN ('REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS') THEN 1 ELSE 0 END) AS active_count,
      SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS resolved_count,
      MIN(created_at) AS first_reported_at,
      MAX(created_at) AS latest_reported_at
    FROM issues
    WHERE room IS NOT NULL AND room != ''
    GROUP BY building, block, floor, room, final_category
    HAVING COUNT(*) >= 2
    ORDER BY total_count DESC
  `).all();

  // 3. Generate plain language human-friendly insights calculated strictly from database
  const insights = [];

  for (const cluster of categoryClusters) {
    let severity = 'MODERATE';
    if (cluster.total_count >= 4 || cluster.active_count >= 3) {
      severity = 'CRITICAL_ZONE';
    } else if (cluster.total_count >= 3) {
      severity = 'ELEVATED';
    }

    insights.push({
      id: `pat-${cluster.building}-${cluster.block}-${cluster.category}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      type: 'CATEGORY_CONCENTRATION',
      severity,
      title: `${cluster.building} (Block ${cluster.block}) repeated ${cluster.category} complaints`,
      description: `${cluster.building} Block ${cluster.block} has accumulated ${cluster.total_count} ${cluster.category.toLowerCase()} issues (${cluster.active_count} currently active, ${cluster.resolved_count} resolved).`,
      recommendation: cluster.active_count > 0 
        ? `Schedule a comprehensive preventative inspection with the ${cluster.category} maintenance team.`
        : `Monitor closely; frequent past failures indicate aging infrastructure in this zone.`,
      building: cluster.building,
      block: cluster.block,
      category: cluster.category,
      totalCount: cluster.total_count,
      activeCount: cluster.active_count,
      resolvedCount: cluster.resolved_count,
      latestReported: cluster.latest_reported_at
    });
  }

  for (let idx = 0; idx < roomHotspots.length; idx++) {
    const spot = roomHotspots[idx];
    insights.push({
      id: `spot-${spot.building}-${spot.block}-${spot.floor}-${spot.room}-${spot.category}-${idx}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      type: 'SPECIFIC_LOCATION_HOTSPOT',
      severity: spot.total_count >= 3 ? 'CRITICAL_ZONE' : 'ELEVATED',
      title: `${spot.building} Block ${spot.block} - Floor ${spot.floor}, Room ${spot.room} recurring failures`,
      description: `Room ${spot.room} has been cited in ${spot.total_count} distinct complaints regarding ${spot.category}.`,
      recommendation: `Conduct on-site root-cause audit of Room ${spot.room} fixtures and structural joints.`,
      building: spot.building,
      block: spot.block,
      floor: spot.floor,
      room: spot.room,
      category: spot.category,
      totalCount: spot.total_count,
      activeCount: spot.active_count,
      resolvedCount: spot.resolved_count,
      latestReported: spot.latest_reported_at
    });
  }

  return {
    summary: {
      totalRecurringZones: categoryClusters.length,
      specificHotspots: roomHotspots.length,
      highestFrequencyBuilding: categoryClusters[0]?.building || 'None'
    },
    categoryClusters,
    roomHotspots,
    insights
  };
}

module.exports = {
  getRecurringPatterns
};
