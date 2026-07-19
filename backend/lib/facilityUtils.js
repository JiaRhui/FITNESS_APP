// Pure helpers only — no file or database access.
// Curated data now comes from the database via models/facilityModel.js.

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function normaliseFee(feeTag) {
  if (feeTag === 'no') return 'free';
  if (feeTag === 'yes') return 'paid';
  return 'unknown';
}

function isPubliclyAccessible(tags) {
  return tags.access !== 'private' && tags.access !== 'residents';
}

function osmElementToFacility(element, lat, lng) {
  const tags = element.tags || {};
  const location = element.type === 'node'
    ? { lat: element.lat, lng: element.lon }
    : element.center
      ? { lat: element.center.lat, lng: element.center.lon }
      : null;

  if (!location) {
    return null;
  }

  const name = tags.name || tags.building || tags.operator || 'Gym';
  const addressParts = [];
  if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
  if (tags['addr:street']) addressParts.push(tags['addr:street']);
  if (tags['addr:city']) addressParts.push(tags['addr:city']);
  if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
  const address = addressParts.length ? addressParts.join(', ') : tags['addr:full'] || tags.street || '';

  let type = 'gym';
  if (tags.sport === 'running') type = 'track';

  return {
    name,
    address: address || (tags['addr:full'] || 'Nearby facility'),
    lat: location.lat,
    lng: location.lng,
    type,
    public: isPubliclyAccessible(tags),
    fee: normaliseFee(tags.fee),
    distance_km: Number(calculateDistanceKm(lat, lng, location.lat, location.lng).toFixed(2))
  };
}

// Proximity-based dedupe. The previous exact-coordinate key could never match,
// because curated coordinates are 4dp and OpenStreetMap returns ~7dp.
function isDuplicate(candidate, existing) {
  return existing.some((item) =>
    item.name.trim().toLowerCase() === candidate.name.trim().toLowerCase() ||
    calculateDistanceKm(item.lat, item.lng, candidate.lat, candidate.lng) < 0.1
  );
}

function rankByDistance(facilities, limit) {
  return facilities
    .slice()
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, Number.isFinite(limit) ? limit : 20);
}

module.exports = {
  calculateDistanceKm,
  osmElementToFacility,
  normaliseFee,
  isPubliclyAccessible,
  isDuplicate,
  rankByDistance
};
