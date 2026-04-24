export const sriLankaDistricts = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Northern Watch" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [79.72, 9.88],
          [80.38, 9.8],
          [80.85, 9.42],
          [80.72, 8.95],
          [80.08, 8.88],
          [79.66, 9.18],
          [79.72, 9.88]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "North Central Belt" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.08, 8.88],
          [80.72, 8.95],
          [81.18, 8.68],
          [81.08, 7.98],
          [80.3, 7.9],
          [79.9, 8.28],
          [80.08, 8.88]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Western Corridor" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [79.62, 8.6],
          [79.9, 8.28],
          [80.3, 7.9],
          [80.18, 7.1],
          [79.92, 6.4],
          [79.62, 6.2],
          [79.44, 6.92],
          [79.46, 7.86],
          [79.62, 8.6]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Central Highlands" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.3, 7.9],
          [81.08, 7.98],
          [81.14, 7.28],
          [80.92, 6.74],
          [80.34, 6.64],
          [80.18, 7.1],
          [80.3, 7.9]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Eastern Arc" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [81.18, 8.68],
          [81.64, 8.06],
          [81.62, 7.28],
          [81.14, 7.28],
          [81.08, 7.98],
          [81.18, 8.68]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Southern Coast" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [79.62, 6.2],
          [79.92, 6.4],
          [80.34, 6.64],
          [80.92, 6.74],
          [81.2, 6.4],
          [81.04, 5.92],
          [80.48, 5.82],
          [79.92, 5.86],
          [79.62, 6.2]
        ]]
      }
    }
  ]
} as const;
