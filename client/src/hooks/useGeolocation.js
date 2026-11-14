import { useState, useCallback } from 'react';

export function useGeolocation(defaultCoords = { lat: 12.9716, lng: 77.5946 }) {
  const [coords, setCoords] = useState(defaultCoords);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  return { coords, setCoords, loading, error, getCurrentLocation };
}
