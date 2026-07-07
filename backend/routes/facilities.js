const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const facilitiesPath = path.join(__dirname, '..', 'data', 'facilities.json');

function readFacilities() {
  const raw = fs.readFileSync(facilitiesPath, 'utf8');
  return JSON.parse(raw);
}

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
  if (tags.leisure === 'fitness_centre') type = 'gym';
  if (tags.amenity === 'gym') type = 'gym';
  if (tags.sport === 'running') type = 'track';
  if (tags.sport === 'gym') type = 'gym';

  return {
    name,
    address: address || (tags['addr:full'] || 'Nearby facility'),
    lat: location.lat,
    lng: location.lng,
    type,
    public: true,
    fee: tags.fee || 'paid',
    distance_km: Number(calculateDistanceKm(lat, lng, location.lat, location.lng).toFixed(2))
  };
}

async function searchDynamicFacilities(lat, lng, radiusKm, typeFilter) {
  const radiusMeters = Math.round(radiusKm * 1000);
  const searchFilters = [];

  if (typeFilter === 'track') {
    searchFilters.push('node["sport"="running"]', 'way["sport"="running"]');
  } else {
    searchFilters.push(
      'node["amenity"="gym"]',
      'way["amenity"="gym"]',
      'node["leisure"="fitness_centre"]',
      'way["leisure"="fitness_centre"]'
    );
    if (typeFilter === 'both') {
      searchFilters.push('node["sport"="running"]', 'way["sport"="running"]');
    }
  }

  const filtersQuery = searchFilters.map((filter) => `${filter}(around:${radiusMeters},${lat},${lng});`).join('');
  const query = `[out:json][timeout:25];(${filtersQuery})out center;`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({ data: query }).toString()
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch live facilities: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return payload.elements
    .map((element) => osmElementToFacility(element, lat, lng))
    .filter((item) => item !== null);
}

router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng query parameters are required'
    });
  }

  const typeFilter = (req.query.type || 'both').toLowerCase();
  const radiusKm = parseFloat(req.query.radius || '10');
  const limit = parseInt(req.query.limit || '20', 10);

  const staticFacilities = readFacilities().filter((facility) => facility.public === true);
  const filteredStatic = typeFilter === 'both'
    ? staticFacilities
    : staticFacilities.filter((facility) => facility.type === typeFilter);

  let facilities = [];

  try {
    const dynamicFacilities = await searchDynamicFacilities(lat, lng, radiusKm, typeFilter === 'both' ? 'both' : typeFilter);
    const existingKeys = new Set(dynamicFacilities.map((facility) => `${facility.name}-${facility.lat.toFixed(6)}-${facility.lng.toFixed(6)}`));
    facilities = dynamicFacilities.slice();

    filteredStatic.forEach((facility) => {
      const key = `${facility.name}-${facility.lat.toFixed(6)}-${facility.lng.toFixed(6)}`;
      const distance_km = Number(calculateDistanceKm(lat, lng, facility.lat, facility.lng).toFixed(2));
      if (!existingKeys.has(key) && distance_km <= radiusKm) {
        facilities.push({ ...facility, distance_km });
      }
    });
  } catch (err) {
    console.error('Facility lookup failed; using static fallback:', err.message || err);
    facilities = filteredStatic.map((facility) => ({
      ...facility,
      distance_km: Number(calculateDistanceKm(lat, lng, facility.lat, facility.lng).toFixed(2))
    }))
    .filter((facility) => Number.isFinite(radiusKm) ? facility.distance_km <= radiusKm : true);
  }

  const ranked = facilities
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, Number.isFinite(limit) ? limit : 20);

  return res.json({
    success: true,
    count: ranked.length,
    facilities: ranked
  });
});

module.exports = router;
