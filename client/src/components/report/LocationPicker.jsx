import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';

// Custom Pin Icon using Leaflet DivIcon
const customPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="background-color:#0f766e;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function DraggableMapMarker({ coords, setCoords }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setCoords({
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          });
        }
      },
    }),
    [setCoords]
  );

  useMapEvents({
    click(e) {
      setCoords({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    },
  });

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[coords.lat, coords.lng]}
      ref={markerRef}
      icon={customPinIcon}
    />
  );
}

// Controller to pan map view when coordinates change
function MapCenterController({ coords }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView([coords.lat, coords.lng], map.getZoom(), { animate: true });
  }, [coords.lat, coords.lng, map]);
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onChangeCoords,
  addressText,
  onChangeAddress,
  landmark,
  onChangeLandmark,
}) {
  const { coords, setCoords, loading: geoLoading, error: geoError, getCurrentLocation } = useGeolocation({
    lat: latitude || 12.9716,
    lng: longitude || 77.5946,
  });

  const handleCoordsChange = (newCoords) => {
    setCoords(newCoords);
    onChangeCoords(newCoords.lat, newCoords.lng);
  };

  const handleGpsClick = () => {
    getCurrentLocation();
  };

  useEffect(() => {
    if (coords.lat && coords.lng) {
      onChangeCoords(coords.lat, coords.lng);
    }
  }, [coords.lat, coords.lng]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Location Pin <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500">Tap anywhere on the map or drag the pin to pinpoint the issue</p>
        </div>
        <button
          type="button"
          onClick={handleGpsClick}
          disabled={geoLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-colors shadow-sm"
        >
          <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          {geoLoading ? 'Acquiring GPS...' : 'Use My GPS'}
        </button>
      </div>

      {geoError && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{geoError}</p>}

      {/* Map View */}
      <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative z-0">
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMapMarker coords={coords} setCoords={handleCoordsChange} />
          <MapCenterController coords={coords} />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
        <span>Lat: {coords.lat.toFixed(5)}</span>
        <span>Lng: {coords.lng.toFixed(5)}</span>
      </div>

      {/* Manual Address & Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Street Address or Road Name (Optional)
          </label>
          <input
            type="text"
            value={addressText || ''}
            onChange={(e) => onChangeAddress(e.target.value)}
            placeholder="e.g. 104 MG Road, near bus shelter"
            maxLength={300}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nearest Landmark (Optional)
          </label>
          <input
            type="text"
            value={landmark || ''}
            onChange={(e) => onChangeLandmark(e.target.value)}
            placeholder="e.g. Opposite City Hospital Gate 3"
            maxLength={150}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
