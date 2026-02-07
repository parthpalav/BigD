// ML Prediction Service for ORION Traffic Intelligence Platform
// Simulates ML predictions - can be connected to backend API later

export interface Location {
    name: string;
    coordinates: [number, number]; // [lng, lat]
}

export interface RouteSegment {
    coordinates: [number, number][];
    congestionLevel: number; // 0-100
    distance: number; // in km
    duration: number; // in minutes
}

export interface Route {
    id: string;
    name: string;
    segments: RouteSegment[];
    totalDistance: number;
    totalDuration: number;
    fuelEfficiency: number; // 0-100 score
    avgCongestion: number;
}

export interface TrafficPrediction {
    bestRoute: Route;
    fuelEfficientRoute: Route;
    optimalDepartureTime: string;
    optimalDate: string;
    confidence: number; // 0-100
    insights: {
        estimatedTime: number; // minutes
        fuelSavings: number; // percentage
        congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
        peakHours: string[];
    };
}

export interface TimelineData {
    hour: number;
    congestionLevel: number;
    avgSpeed: number; // km/h
}

/**
 * Generate a realistic route between two points
 */
const generateRoute = (
    source: Location,
    destination: Location,
    routeType: 'best' | 'fuel-efficient',
    timeOfDay: number
): Route => {
    const [srcLng, srcLat] = source.coordinates;
    const [destLng, destLat] = destination.coordinates;

    // Calculate base distance
    const distance = calculateHaversineDistance(source.coordinates, destination.coordinates);

    // Generate waypoints for the route
    const numSegments = Math.max(3, Math.floor(distance / 5)); // Segment every ~5km
    const segments: RouteSegment[] = [];

    // Add some variation for fuel-efficient route
    const routeVariation = routeType === 'fuel-efficient' ? 0.1 : 0.05;

    for (let i = 0; i < numSegments; i++) {
        const progress = i / numSegments;
        const nextProgress = (i + 1) / numSegments;

        // Interpolate with some randomness
        const segmentCoords: [number, number][] = [];
        const steps = 5;

        for (let j = 0; j <= steps; j++) {
            const stepProgress = progress + (nextProgress - progress) * (j / steps);
            const lng = srcLng + (destLng - srcLng) * stepProgress + (Math.random() - 0.5) * routeVariation;
            const lat = srcLat + (destLat - srcLat) * stepProgress + (Math.random() - 0.5) * routeVariation;
            segmentCoords.push([lng, lat]);
        }

        // Calculate congestion based on time of day and route type
        const baseCongestion = getCongestionForTime(timeOfDay);
        const congestion = routeType === 'fuel-efficient'
            ? Math.max(0, baseCongestion - 15 + Math.random() * 10)
            : baseCongestion + Math.random() * 10;

        const segmentDistance = distance / numSegments;
        const segmentDuration = calculateDuration(segmentDistance, congestion);

        segments.push({
            coordinates: segmentCoords,
            congestionLevel: Math.min(100, congestion),
            distance: segmentDistance,
            duration: segmentDuration,
        });
    }

    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const avgCongestion = segments.reduce((sum, seg) => sum + seg.congestionLevel, 0) / segments.length;

    return {
        id: routeType,
        name: routeType === 'best' ? 'Fastest Route' : 'Fuel Efficient Route',
        segments,
        totalDistance,
        totalDuration,
        fuelEfficiency: routeType === 'fuel-efficient' ? 85 + Math.random() * 10 : 70 + Math.random() * 10,
        avgCongestion,
    };
};

/**
 * Calculate congestion level based on time of day (0-23)
 */
const getCongestionForTime = (hour: number): number => {
    // Morning rush: 7-9 AM
    if (hour >= 7 && hour <= 9) return 70 + Math.random() * 20;
    // Evening rush: 5-7 PM
    if (hour >= 17 && hour <= 19) return 75 + Math.random() * 20;
    // Midday: 11 AM - 2 PM
    if (hour >= 11 && hour <= 14) return 40 + Math.random() * 20;
    // Night: 10 PM - 5 AM
    if (hour >= 22 || hour <= 5) return 10 + Math.random() * 15;
    // Other times
    return 30 + Math.random() * 20;
};

/**
 * Calculate duration based on distance and congestion
 */
const calculateDuration = (distanceKm: number, congestion: number): number => {
    // Base speed: 60 km/h
    // Reduce speed based on congestion
    const speedFactor = 1 - (congestion / 100) * 0.6; // Max 60% reduction
    const speed = 60 * speedFactor;
    return (distanceKm / speed) * 60; // Convert to minutes
};

/**
 * Haversine distance calculation
 */
const calculateHaversineDistance = (
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
 * Main prediction function
 */
export const predictTraffic = async (
    source: Location,
    destination: Location,
    departureTime: Date,
    dateRange?: { start: Date; end: Date }
): Promise<TrafficPrediction> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const hour = departureTime.getHours();

    // Generate both routes
    const bestRoute = generateRoute(source, destination, 'best', hour);
    const fuelEfficientRoute = generateRoute(source, destination, 'fuel-efficient', hour);

    // Find optimal departure time (avoid rush hours)
    const optimalHour = findOptimalDepartureTime(hour);
    const optimalDepartureTime = `${optimalHour.toString().padStart(2, '0')}:00`;

    // Find optimal date (simulate - just pick a weekday)
    const optimalDate = findOptimalDate(dateRange);

    // Calculate insights
    const avgCongestion = bestRoute.avgCongestion;
    const congestionLevel =
        avgCongestion < 30 ? 'low' :
            avgCongestion < 60 ? 'moderate' :
                avgCongestion < 80 ? 'high' : 'severe';

    const fuelSavings = ((bestRoute.totalDuration - fuelEfficientRoute.totalDuration) / bestRoute.totalDuration) * 100;

    return {
        bestRoute,
        fuelEfficientRoute,
        optimalDepartureTime,
        optimalDate,
        confidence: 85 + Math.random() * 10, // 85-95% confidence
        insights: {
            estimatedTime: Math.round(bestRoute.totalDuration),
            fuelSavings: Math.max(0, Math.round(fuelSavings)),
            congestionLevel,
            peakHours: ['07:00-09:00', '17:00-19:00'],
        },
    };
};

/**
 * Find optimal departure time to avoid congestion
 */
const findOptimalDepartureTime = (currentHour: number): number => {
    // Avoid rush hours (7-9 AM, 5-7 PM)
    if (currentHour >= 7 && currentHour <= 9) return 10;
    if (currentHour >= 17 && currentHour <= 19) return 20;
    return currentHour;
};

/**
 * Find optimal date within range
 */
const findOptimalDate = (dateRange?: { start: Date; end: Date }): string => {
    if (!dateRange) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    // Find a Tuesday or Wednesday (typically less traffic)
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
        const day = current.getDay();
        if (day === 2 || day === 3) { // Tuesday or Wednesday
            return current.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }
        current.setDate(current.getDate() + 1);
    }

    return dateRange.start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

/**
 * Generate timeline data for 24 hours
 */
export const generateTimelineData = (_route: Route): TimelineData[] => {
    const timeline: TimelineData[] = [];

    for (let hour = 0; hour < 24; hour++) {
        const congestion = getCongestionForTime(hour);
        const avgSpeed = 60 * (1 - (congestion / 100) * 0.6);

        timeline.push({
            hour,
            congestionLevel: congestion,
            avgSpeed,
        });
    }

    return timeline;
};

/**
 * Get route at specific time
 */
export const getRouteAtTime = (
    source: Location,
    destination: Location,
    hour: number,
    routeType: 'best' | 'fuel-efficient' = 'best'
): Route => {
    return generateRoute(source, destination, routeType, hour);
};
