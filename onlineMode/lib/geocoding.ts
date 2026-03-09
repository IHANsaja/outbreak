export async function getCityFromCoords(lat: number, lng: number): Promise<string> {
  const cacheKey = `geo_${lat}_${lng}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    // OpenStreetMap Nominatim API requires a User-Agent identifying the app
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'User-Agent': 'OutbreakDisasterManagementApp/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    );

    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    // Fallbacks from most specific to least specific geographic term
    const city = 
      data.address?.city || 
      data.address?.town || 
      data.address?.municipality || 
      data.address?.district || 
      data.address?.county || 
      data.address?.state || 
      "Unknown Location";

    sessionStorage.setItem(cacheKey, city);
    return city;
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Unknown Location";
  }
}
