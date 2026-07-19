/**
 * Facility model — the data-access layer for the gym locator.
 *
 * REFERENCE IMPLEMENTATION. Other feature owners: copy this shape.
 *   - The model owns all SQL for its tables. Routes/controllers never see SQL.
 *   - Every query uses $1/$2 placeholders. Never concatenate user input.
 *   - The exported interface is per-record (find/create/update), not
 *     readAll/saveAll — that is the whole point of moving to a database.
 *
 * Owner: Nizam (gym locator)
 */
const { query } = require('../db/pool');
const { calculateDistanceKm } = require('../lib/facilityUtils');

// How long a cached Overpass response stays fresh.
const CACHE_TTL_HOURS = 24;
// Two searches within this distance reuse the same cache entry.
const CACHE_MATCH_KM = 0.5;

/**
 * Public curated facilities, optionally filtered by type.
 * Replaces the old readFacilities() + .filter() in the route.
 */
async function findCuratedFacilities(typeFilter = 'both') {
  const sql = typeFilter === 'both'
    ? `SELECT name, address, lat::float8, lng::float8, type, public, fee
         FROM curated_facilities
        WHERE public = TRUE`
    : `SELECT name, address, lat::float8, lng::float8, type, public, fee
         FROM curated_facilities
        WHERE public = TRUE AND type = $1`;

  const params = typeFilter === 'both' ? [] : [typeFilter];
  const { rows } = await query(sql, params);
  return rows;
}

/**
 * Looks for a fresh cached Overpass response near this search.
 * Returns the cached facilities array, or null on a miss.
 *
 * This is why the gym locator needs a database: the curated list is static,
 * but the cache is written on every new search.
 */
async function findCachedSearch(lat, lng, radiusKm, typeFilter) {
  const { rows } = await query(
    `SELECT query_lat::float8 AS query_lat,
            query_lng::float8 AS query_lng,
            payload
       FROM facility_cache
      WHERE radius_km   = $1
        AND type_filter = $2
        AND fetched_at > NOW() - ($3 || ' hours')::interval
      ORDER BY fetched_at DESC
      LIMIT 20`,
    [radiusKm, typeFilter, String(CACHE_TTL_HOURS)]
  );

  for (const row of rows) {
    const distance = calculateDistanceKm(lat, lng, row.query_lat, row.query_lng);
    if (distance <= CACHE_MATCH_KM) {
      return row.payload;
    }
  }
  return null;
}

/** Stores an Overpass response so the next nearby search skips the API. */
async function saveCachedSearch(lat, lng, radiusKm, typeFilter, facilities) {
  await query(
    `INSERT INTO facility_cache (query_lat, query_lng, radius_km, type_filter, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [lat, lng, radiusKm, typeFilter, JSON.stringify(facilities)]
  );
}

/** Removes cache entries past their TTL. Call from a scheduled job or on deploy. */
async function purgeExpiredCache() {
  const { rowCount } = await query(
    `DELETE FROM facility_cache
      WHERE fetched_at < NOW() - ($1 || ' hours')::interval`,
    [String(CACHE_TTL_HOURS)]
  );
  return rowCount;
}

/** Adds a curated venue. Idempotent — re-adding the same venue is a no-op. */
async function addCuratedFacility(facility) {
  const { rows } = await query(
    `INSERT INTO curated_facilities (name, address, lat, lng, type, public, fee)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (name, lat, lng) DO NOTHING
     RETURNING id`,
    [facility.name, facility.address, facility.lat, facility.lng,
     facility.type, facility.public, facility.fee]
  );
  return rows[0] || null;
}

module.exports = {
  findCuratedFacilities,
  findCachedSearch,
  saveCachedSearch,
  purgeExpiredCache,
  addCuratedFacility,
  CACHE_TTL_HOURS,
  CACHE_MATCH_KM
};
