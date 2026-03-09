"use client";
import { useEffect } from "react";
import { updateUserLocation } from "@/app/actions/data";

export default function LocationTracker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(position.coords.latitude, position.coords.longitude).catch(console.error);
        },
        (error) => {
          console.warn("Location tracking disabled or failed:", error.message);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
      );
    }
  }, []);

  return null;
}
