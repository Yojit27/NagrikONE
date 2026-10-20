import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceMeters, formatDistance, filterReportsWithinRadius } from './geo';

describe('geo - Haversine Geolocation & 500m Duplicate Proximity Engine', () => {
  // New Delhi Connaught Place coordinates
  const cpLat = 28.6315;
  const cpLon = 77.2167;

  it('calculates 0 distance for identical coordinates', () => {
    const dist = calculateHaversineDistanceMeters(cpLat, cpLon, cpLat, cpLon);
    expect(dist).toBe(0);
  });

  it('accurately calculates distance for known geographic offset (~111km per latitude degree)', () => {
    // 0.001 deg latitude is roughly ~111 metres
    const dist = calculateHaversineDistanceMeters(cpLat, cpLon, cpLat + 0.001, cpLon);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });

  it('safely handles non-finite or invalid coordinates without crashing', () => {
    expect(calculateHaversineDistanceMeters(NaN, cpLon, cpLat, cpLon)).toBe(Infinity);
    expect(calculateHaversineDistanceMeters(cpLat, cpLon, null as any, cpLon)).toBe(Infinity);
  });

  it('formats distance in human-readable metre and kilometre representations', () => {
    expect(formatDistance(150)).toBe('150m away');
    expect(formatDistance(1250)).toBe('1.3km away');
    expect(formatDistance(null)).toBe('Distance unknown');
  });

  it('filters reports strictly within 500m radius for civic duplicate detection', () => {
    const reports = [
      { id: '1', latitude: cpLat + 0.002, longitude: cpLon }, // ~222m away (within 500m)
      { id: '2', latitude: cpLat + 0.01, longitude: cpLon }, // ~1.1km away (outside 500m)
      { id: '3', latitude: cpLat + 0.001, longitude: cpLon }, // ~111m away (within 500m)
    ];

    const nearby = filterReportsWithinRadius(reports, { latitude: cpLat, longitude: cpLon }, 500);

    expect(nearby).toHaveLength(2);
    expect(nearby[0].report.id).toBe('3'); // Closest first
    expect(nearby[1].report.id).toBe('1');
  });
});
