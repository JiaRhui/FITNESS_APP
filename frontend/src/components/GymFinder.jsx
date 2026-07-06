(function () {
  var React = window.React;
  var useState = React.useState;
  var useMemo = React.useMemo;
  var searchFacilities = window.__facilitiesService && window.__facilitiesService.searchFacilities;
  var MapView = window.GymMapView;

  function GymFinder() {
    var _a = useState(''), postalCode = _a[0], setPostalCode = _a[1];
    var _b = useState('both'), type = _b[0], setType = _b[1];
    var _c = useState([]), results = _c[0], setResults = _c[1];
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(''), message = _e[0], setMessage = _e[1];

    var handleSubmit = function (event) {
      event.preventDefault();
      if (!postalCode.trim()) {
        setMessage('Please enter a postal code.');
        setResults([]);
        return;
      }

      setLoading(true);
      setMessage('');

      fetch('https://www.onemap.gov.sg/api/common/elastic/search?searchVal=' + encodeURIComponent(postalCode) + '&returnGeom=Y&getAddrDetails=Y')
        .then(function (response) { return response.json(); })
        .then(function (geocodePayload) {
          var firstMatch = geocodePayload && geocodePayload.results && geocodePayload.results[0];
          if (!firstMatch || !firstMatch.LATITUDE || !firstMatch.LONGITUDE) {
            setResults([]);
            setMessage('Invalid postal code');
            setLoading(false);
            return;
          }

          return searchFacilities({ lat: firstMatch.LATITUDE, lng: firstMatch.LONGITUDE, type: type }).then(function (facilities) {
            setResults(facilities);
            setMessage(postalCode + ' • ' + facilities.length + ' result' + (facilities.length === 1 ? '' : 's'));
          });
        })
        .catch(function () {
          setResults([]);
          setMessage('Unable to search facilities right now.');
        })
        .finally(function () {
          setLoading(false);
        });
    };

    var searchSummary = useMemo(function () {
      return message;
    }, [message]);

    return React.createElement(
      'section',
      { className: 'card tracker-card', style: { gap: '1rem' } },
      React.createElement('div', { className: 'tracker-section-header' },
        React.createElement('h2', null, 'Gym & Running Track Finder'),
        React.createElement('p', null, 'Find public gyms and running tracks near your Singapore postal code.')
      ),
      React.createElement('form', { onSubmit: handleSubmit, style: { display: 'grid', gap: '0.9rem' } },
        React.createElement('div', { className: 'form-row' },
          React.createElement('div', { style: { flex: '1 1 220px' } },
            React.createElement('label', { htmlFor: 'postalCode', style: { display: 'block', marginBottom: '0.4rem' } }, 'Singapore postal code'),
            React.createElement('input', { id: 'postalCode', value: postalCode, onChange: function (event) { return setPostalCode(event.target.value); }, placeholder: 'e.g. 738600' })
          ),
          React.createElement('div', { style: { flex: '0 0 180px' } },
            React.createElement('label', { htmlFor: 'type', style: { display: 'block', marginBottom: '0.4rem' } }, 'Facility type'),
            React.createElement('select', { id: 'type', value: type, onChange: function (event) { return setType(event.target.value); } },
              React.createElement('option', { value: 'both' }, 'Both'),
              React.createElement('option', { value: 'gym' }, 'Gym'),
              React.createElement('option', { value: 'track' }, 'Running Track')
            )
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end' } },
            React.createElement('button', { type: 'submit', disabled: loading }, loading ? 'Searching…' : 'Search')
          )
        )
      ),
      searchSummary ? React.createElement('h3', { style: { margin: '0.5rem 0 0' } }, searchSummary) : null,
      React.createElement('div', { style: { width: '100%' } },
        React.createElement(MapView, { facilities: results })
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' } },
        results.length ? results.map(function (facility) {
          return React.createElement('article', { key: facility.name, className: 'card', style: { padding: '1rem' } },
            React.createElement('h3', { style: { marginBottom: '0.35rem' } }, facility.name),
            React.createElement('p', { style: { marginBottom: '0.25rem' } }, 'Type: ' + (facility.type === 'track' ? 'Running Track' : 'Gym')),
            React.createElement('p', { style: { marginBottom: '0.25rem' } }, 'Distance: ' + facility.distance_km.toFixed(2) + ' km'),
            React.createElement('p', { style: { marginBottom: 0 } }, 'Fee: ' + facility.fee)
          );
        }) : React.createElement('p', { style: { color: '#9fafaa' } }, 'Search for a postal code to view nearby public facilities.')
      )
    );
  }

  window.GymFinder = GymFinder;
})();
