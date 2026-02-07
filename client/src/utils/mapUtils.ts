// Map-related utility functions for ORION Traffic Intelligence Platform

import mapboxgl from 'mapbox-gl';

/**
 * Calculate traffic color based on congestion level (0-100)
 */
export const getTrafficColor = (congestionLevel: number): string => {
    if (congestionLevel < 30) return '#10b981'; // Green - light traffic
    if (congestionLevel < 60) return '#f59e0b'; // Yellow - moderate traffic
    if (congestionLevel < 80) return '#f97316'; // Orange - heavy traffic
    return '#ef4444'; // Red - severe congestion
};

/**
 * Calculate traffic opacity based on congestion level
 */
export const getTrafficOpacity = (congestionLevel: number): number => {
    return Math.min(0.3 + (congestionLevel / 100) * 0.5, 0.8);
};

/**
 * Smooth a route path using interpolation
 */
export const smoothRoute = (coordinates: [number, number][], smoothness: number = 0.5): [number, number][] => {
    if (coordinates.length < 3) return coordinates;

    const smoothed: [number, number][] = [coordinates[0]];

    for (let i = 1; i < coordinates.length - 1; i++) {
        const prev = coordinates[i - 1];
        const curr = coordinates[i];
        const next = coordinates[i + 1];

        const smoothedPoint: [number, number] = [
            curr[0] * (1 - smoothness) + (prev[0] + next[0]) * smoothness / 2,
            curr[1] * (1 - smoothness) + (prev[1] + next[1]) * smoothness / 2,
        ];

        smoothed.push(smoothedPoint);
    }

    smoothed.push(coordinates[coordinates.length - 1]);
    return smoothed;
};

/**
 * Calculate distance between two coordinates in kilometers
 */
export const calculateDistance = (
    coord1: [number, number],
    coord2: [number, number]
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2[1] - coord1[1]);
    const dLon = toRad(coord2[0] - coord1[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1[1])) *
        Math.cos(toRad(coord2[1])) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

/**
 * Generate GeoJSON for a route
 */
export const createRouteGeoJSON = (coordinates: [number, number][]) => {
    return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
            type: 'LineString' as const,
            coordinates,
        },
    };
};

/**
 * Generate GeoJSON for traffic overlay
 */
export const createTrafficGeoJSON = (
    coordinates: [number, number][],
    congestionLevel: number
) => {
    return {
        type: 'Feature' as const,
        properties: {
            congestion: congestionLevel,
            color: getTrafficColor(congestionLevel),
        },
        geometry: {
            type: 'LineString' as const,
            coordinates,
        },
    };
};

/**
 * Calculate bounds for multiple coordinates
 */
export const calculateBounds = (coordinates: [number, number][]): mapboxgl.LngLatBoundsLike => {
    if (coordinates.length === 0) {
        return [[-180, -90], [180, 90]];
    }

    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];

    coordinates.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
    });

    return [[minLng, minLat], [maxLng, maxLat]];
};

/**
 * Interpolate coordinates for smooth animation
 */
export const interpolateCoordinates = (
    start: [number, number],
    end: [number, number],
    progress: number
): [number, number] => {
    return [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress,
    ];
};

/**
 * Format duration in minutes to human-readable string
 */
export const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Format distance in kilometers
 */
export const formatDistance = (km: number): string => {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
};
