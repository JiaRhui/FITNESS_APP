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

router.get('/', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng query parameters are required'
    });
  }

  const typeFilter = (req.query.type || 'both').toLowerCase();
  const limit = parseInt(req.query.limit || '10', 10);

  let facilities = readFacilities().filter((facility) => facility.public === true);

  if (typeFilter === 'gym' || typeFilter === 'track') {
    facilities = facilities.filter((facility) => facility.type === typeFilter);
  }

  const ranked = facilities
    .map((facility) => ({
      ...facility,
      distance_km: Number(calculateDistanceKm(lat, lng, facility.lat, facility.lng).toFixed(2))
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, Number.isFinite(limit) ? limit : 10);

  return res.json({
    success: true,
    count: ranked.length,
    facilities: ranked
  });
});

module.exports = router;
