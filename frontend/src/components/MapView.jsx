(function () {
  var React = window.React;

  function MapView(props) {
    var facilities = props.facilities || [];
    var mapRef = React.useRef(null);
    var mapInstanceRef = React.useRef(null);

    React.useEffect(function () {
      if (!facilities.length || typeof window.L === 'undefined') {
        return;
      }

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = window.L.map(mapRef.current).setView([1.3521, 103.8198], 11);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }

      var markersLayer = window.L.layerGroup().addTo(mapInstanceRef.current);
      var bounds = [];

      facilities.forEach(function (facility) {
        bounds.push([facility.lat, facility.lng]);
        var marker = window.L.marker([facility.lat, facility.lng]);
        marker.bindPopup('<strong>' + facility.name + '</strong><br>' + facility.type + ' • ' + facility.distance_km.toFixed(1) + ' km');
        marker.addTo(markersLayer);
      });

      if (bounds.length) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24] });
      }

      return function () {
        markersLayer.clearLayers();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [facilities]);

    return React.createElement('div', {
      ref: mapRef,
      style: { height: '380px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #26352c', marginBottom: '16px' }
    });
  }

  window.GymMapView = MapView;
})();
