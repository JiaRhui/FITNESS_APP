async function searchFacilities({ lat, lng, type = 'both' }) {
  const response = await fetch(`/api/facilities?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&type=${encodeURIComponent(type)}&limit=20`);
  if (!response.ok) {
    throw new Error('Unable to load facilities');
  }
  const payload = await response.json();
  return payload.facilities || [];
}

window.__facilitiesService = { searchFacilities };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchFacilities };
}
