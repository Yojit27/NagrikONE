/**
 * Haversine formula to compute geodesic distance between two points in metres.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance in a human-readable format (e.g., "140m away", "1.2km away").
 */
export function formatDistance(distanceMeters: number | null | undefined): string {
  if (distanceMeters === null || distanceMeters === undefined || !isFinite(distanceMeters)) {
    return 'Distance unknown';
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m away`;
  }
  return `${(distanceMeters / 1000).toFixed(1)}km away`;
}

/**
 * Filter reports strictly within a given radius in metres.
 * Excludes invalid or missing coordinates.
 */
export function filterReportsWithinRadius<T extends { latitude?: number; longitude?: number }>(
  reports: T[],
  userLocation: { latitude: number; longitude: number } | null | undefined,
  radiusMeters = 500
): { report: T; distance: number }[] {
  if (!userLocation || isNaN(userLocation.latitude) || isNaN(userLocation.longitude)) {
    return [];
  }

  return reports
    .map((report) => {
      if (
        typeof report.latitude !== 'number' ||
        typeof report.longitude !== 'number' ||
        isNaN(report.latitude) ||
        isNaN(report.longitude)
      ) {
        return null;
      }

      const distance = calculateHaversineDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        report.latitude,
        report.longitude
      );

      if (distance <= radiusMeters) {
        return { report, distance };
      }
      return null;
    })
    .filter((item): item is { report: T; distance: number } => item !== null)
    .sort((a, b) => a.distance - b.distance);
}
