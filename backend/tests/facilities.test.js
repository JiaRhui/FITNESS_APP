/**
 * Unit tests — pure logic only. No database, no filesystem, no network.
 * These run anywhere, instantly, with no setup.
 *
 * Data-dependent behaviour (curated rows, public filter, ranking real venues)
 * is covered by tests/facilityModel.integration.test.js, which needs a database.
 */
const test = require('node:test');
const assert = require('node:assert');
const {
  calculateDistanceKm,
  osmElementToFacility,
  normaliseFee,
  isPubliclyAccessible,
  isDuplicate,
  rankByDistance
} = require('../lib/facilityUtils');

// Tampines Central 5 (postal 529509) — used as the search origin
const ORIGIN = { lat: 1.3521, lng: 103.9450 };

test('distance: same point is zero km', () => {
  assert.strictEqual(calculateDistanceKm(ORIGIN.lat, ORIGIN.lng, ORIGIN.lat, ORIGIN.lng), 0);
});

test('distance: known SG landmarks are within a sane range', () => {
  const d = calculateDistanceKm(1.3521, 103.9450, 1.3344, 103.7430);
  assert.ok(d > 18 && d < 28, `expected 18-28 km, got ${d.toFixed(2)}`);
});

test('distance: is symmetric (a->b equals b->a)', () => {
  const ab = calculateDistanceKm(1.3521, 103.9450, 1.3305, 103.9384);
  const ba = calculateDistanceKm(1.3305, 103.9384, 1.3521, 103.9450);
  assert.strictEqual(ab.toFixed(6), ba.toFixed(6));
});

test('osm mapping: a node element becomes a valid facility', () => {
  const facility = osmElementToFacility({
    type: 'node', lat: 1.3530, lon: 103.9440,
    tags: { name: 'Test Gym', amenity: 'gym', 'addr:street': 'Tampines Ave 1' }
  }, ORIGIN.lat, ORIGIN.lng);

  assert.strictEqual(facility.name, 'Test Gym');
  assert.strictEqual(facility.type, 'gym');
  assert.ok(facility.distance_km < 2, 'test gym should be close to origin');
});

test('osm mapping: a way element uses its center coordinates', () => {
  const facility = osmElementToFacility({
    type: 'way', center: { lat: 1.3540, lon: 103.9460 },
    tags: { name: 'Test Track', sport: 'running' }
  }, ORIGIN.lat, ORIGIN.lng);

  assert.strictEqual(facility.type, 'track');
  assert.strictEqual(facility.lat, 1.3540);
});

test('osm mapping: an element with no location is skipped', () => {
  const facility = osmElementToFacility({ type: 'way', tags: { name: 'No Location' } },
    ORIGIN.lat, ORIGIN.lng);
  assert.strictEqual(facility, null);
});

test('fee: OSM yes/no tags map to paid/free, unknown stays unknown', () => {
  assert.strictEqual(normaliseFee('no'), 'free');
  assert.strictEqual(normaliseFee('yes'), 'paid');
  assert.strictEqual(normaliseFee(undefined), 'unknown');
});

test('access: private and residents-only facilities are not public', () => {
  assert.strictEqual(isPubliclyAccessible({ access: 'private' }), false);
  assert.strictEqual(isPubliclyAccessible({ access: 'residents' }), false);
  assert.strictEqual(isPubliclyAccessible({}), true);
});

test('dedupe: same venue at slightly different coordinates is caught', () => {
  const live = [{ name: 'Anytime Fitness Tampines', lat: 1.3520847, lng: 103.9449512 }];
  const curated = { name: 'Anytime Fitness Tampines', lat: 1.3521, lng: 103.9450 };
  assert.strictEqual(isDuplicate(curated, live), true);
});

test('dedupe: a genuinely different venue is kept', () => {
  const live = [{ name: 'Anytime Fitness Tampines', lat: 1.3521, lng: 103.9450 }];
  const curated = { name: 'Bishan ActiveSG Gym', lat: 1.3508, lng: 103.8480 };
  assert.strictEqual(isDuplicate(curated, live), false);
});

test('ranking: results sort nearest-first', () => {
  const unsorted = [
    { name: 'far', distance_km: 8.78 },
    { name: 'near', distance_km: 0.07 },
    { name: 'middle', distance_km: 2.30 }
  ];
  assert.deepStrictEqual(rankByDistance(unsorted, 20).map((r) => r.name), ['near', 'middle', 'far']);
});

test('ranking: limit caps the number of results returned', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ name: 'F' + i, distance_km: i }));
  assert.strictEqual(rankByDistance(many, 5).length, 5);
  assert.strictEqual(rankByDistance(many, 5)[0].distance_km, 0);
});
