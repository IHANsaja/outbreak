"use client";

import { useState, useEffect, useRef } from "react";
import { updateUserLocation } from "@/app/actions/data";

type Coordinates = [number, number];

export function useLiveLocation(enabled: boolean = true) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      if (!navigator.geolocation) setError("Geolocation not supported");
      return;
    }

    const updatePosition = (position: GeolocationPosition) => {
      const newCoords: Coordinates = [position.coords.latitude, position.coords.longitude];
      setLocation(newCoords);
      
      const now = Date.now();
      // Throttling database update to 5 seconds
      if (now - lastUpdateRef.current >= 5000) {
        lastUpdateRef.current = now;
        updateUserLocation(newCoords[0], newCoords[1]).catch(console.error);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(error.message);
    };

    // Initial position
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
    });

    // Continuous tracking
    const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { location, error };
}
