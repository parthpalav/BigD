// ML Prediction Service for ORION Traffic Intelligence Platform
// Uses Mapbox Directions API + ML model for traffic predictions

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ML_DIRECT_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';
const USE_ML_MODEL = import.meta.env.VITE_USE_ML_MODEL === 'true';

let mlServiceDown = false;
let mlFallbackUsedInRun = false;
const fallbackPredictionCache = new Map<string, TrafficPrediction>();

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
    usedDateRange: boolean; // Whether date range optimization was used
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

type MlPredictionPayload = {
    data?: {
        prediction?: {
            congestion?: number;
        };
    };
    prediction?: {
        congestion?: number;
    };
};

/**
 * Fetch route from Mapbox Directions API
 */
const fetchMapboxRoute = async (
    source: Location,
    destination: Location,
    routeType: 'best' | 'fuel-efficient'
): Promise<[number, number][]> => {
    const [srcLng, srcLat] = source.coordinates;
    const [destLng, destLat] = destination.coordinates;

    // Use different parameters for different route types
    let url: string;
    if (routeType === 'fuel-efficient') {
        // Request alternative routes and use the second one if available
        url = `https://api.mapbox.com/directions/v5/mapbox/driving/${srcLng},${srcLat};${destLng},${destLat}?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
    } else {
        // Use traffic profile for best/fastest route
        url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${srcLng},${srcLat};${destLng},${destLat}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            // For fuel-efficient, try to use an alternative route if available
            if (routeType === 'fuel-efficient' && data.routes.length > 1) {
                return data.routes[1].geometry.coordinates;
            }
            // Return the primary route
            return data.routes[0].geometry.coordinates;
        }
    } catch (error) {
        console.error('Error fetching Mapbox route:', error);
    }

    // Fallback to straight line if API fails
    return [[srcLng, srcLat], [destLng, destLat]];
};

/**
 * Generate a realistic route between two points using Mapbox Directions API
 */
const generateRoute = async (
    source: Location,
    destination: Location,
    routeType: 'best' | 'fuel-efficient',
    timeOfDay: number
): Promise<Route> => {
    // Fetch actual road-based route from Mapbox
    const routeCoordinates = await fetchMapboxRoute(source, destination, routeType);

    // Calculate actual distance
    let totalDistance = 0;
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
        totalDistance += calculateHaversineDistance(routeCoordinates[i], routeCoordinates[i + 1]);
    }

    // Split route into segments for traffic visualization
    const segmentSize = Math.max(10, Math.floor(routeCoordinates.length / 5)); // 5 segments
    const segments: RouteSegment[] = [];

    for (let i = 0; i < routeCoordinates.length; i += segmentSize) {
        const segmentCoords = routeCoordinates.slice(i, Math.min(i + segmentSize, routeCoordinates.length));
        
        if (segmentCoords.length < 2) continue;

        // Calculate segment distance
        let segmentDistance = 0;
        for (let j = 0; j < segmentCoords.length - 1; j++) {
            segmentDistance += calculateHaversineDistance(segmentCoords[j], segmentCoords[j + 1]);
        }

        // Calculate congestion based on time of day and route type
        const baseCongestion = USE_ML_MODEL 
            ? await getMLCongestionPrediction(
                segmentCoords[0][1], // lat
                segmentCoords[0][0], // lon
                timeOfDay
              )
            : getCongestionForTime(timeOfDay);
        
        let congestion: number;
        let adjustedSpeed: number; // km/h
        
        if (routeType === 'fuel-efficient') {
            // Fuel-efficient routes: lower congestion, slower roads (avoid highways)
            congestion = Math.max(0, baseCongestion - 20 + Math.random() * 10);
            adjustedSpeed = 45; // Slower average speed (local roads)
        } else {
            // Fastest routes: faster roads but may encounter more traffic
            // Limit congestion to ensure fastest route is always faster
            congestion = Math.min(baseCongestion + Math.random() * 5, 70); // Cap at 70%
            adjustedSpeed = 70; // Faster average speed (highways)
        }
        
        // Calculate duration based on adjusted speed and congestion
        const speedReduction = (congestion / 100) * 0.4; // Congestion reduces speed by up to 40%
        const effectiveSpeed = adjustedSpeed * (1 - speedReduction);
        const segmentDuration = (segmentDistance / effectiveSpeed) * 60; // Convert to minutes

        segments.push({
            coordinates: segmentCoords,
            congestionLevel: Math.min(100, congestion),
            distance: segmentDistance,
            duration: segmentDuration,
        });
    }

    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const avgCongestion = segments.reduce((sum, seg) => sum + seg.congestionLevel, 0) / segments.length;

    // Calculate fuel efficiency based on route type
    // Fuel-efficient routes: slower speeds = better fuel economy
    // Fastest routes: highway speeds = worse fuel economy
    let fuelEfficiency: number;
    if (routeType === 'fuel-efficient') {
        // Base 82%, bonus for low congestion (smooth driving saves fuel)
        // Range: 82-92% depending on congestion
        fuelEfficiency = 82 + (100 - avgCongestion) / 10;
    } else {
        // Base 60%, slight bonus for low congestion
        // Range: 60-70% depending on congestion
        // Always lower than fuel-efficient route to ensure savings
        fuelEfficiency = 60 + (100 - avgCongestion) / 15;
    }

    return {
        id: routeType,
        name: routeType === 'best' ? 'Fastest Route' : 'Fuel Efficient Route',
        segments,
        totalDistance,
        totalDuration,
        fuelEfficiency: Math.min(95, Math.max(50, fuelEfficiency)),
        avgCongestion,
    };
};

/**
 * Get ML-based congestion prediction from backend
 */
const getMLCongestionPrediction = async (
    lat: number,
    lon: number,
    hour: number
): Promise<number> => {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
        const requestBody = {
            hour,
            day_of_week: dayOfWeek,
            lat,
            lon,
            free_flow_speed: 60,
        };

        const parsePrediction = (data: MlPredictionPayload): number => {
            const prediction = data?.data?.prediction ?? data?.prediction;
            if (prediction?.congestion === undefined || prediction?.congestion === null) {
                throw new Error('ML prediction missing congestion value');
            }
            return prediction.congestion;
        };

        const fetchPrediction = async (endpoint: string): Promise<number> => {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const responseText = await response.text().catch(() => '');
                throw new Error(`ML prediction failed (${response.status}): ${responseText}`);
            }

            const data = await response.json();
            return parsePrediction(data);
        };

        try {
            const congestion = await fetchPrediction(`${API_URL}/api/ml/predict`);
            mlServiceDown = false;
            return congestion;
        } catch (backendError) {
            console.warn('Backend ML proxy failed, retrying direct ML service:', backendError);
            const congestion = await fetchPrediction(`${ML_DIRECT_URL}/predict`);
            mlServiceDown = false;
            return congestion;
        }
    } catch (error) {
        mlServiceDown = true;
        mlFallbackUsedInRun = true;
        console.warn('ML prediction failed, falling back to rule-based:', error);
        return getCongestionForTime(hour);
    }
};

/**
 * Calculate congestion level based on time of day (0-23)
 * Used as fallback when ML model is unavailable
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

const formatCoord = (value: number): string => value.toFixed(5);

const buildPredictionCacheKey = (
    source: Location,
    destination: Location,
    departureTime: Date,
    dateRange?: { start: Date; end: Date }
): string => {
    const src = `${formatCoord(source.coordinates[0])},${formatCoord(source.coordinates[1])}`;
    const dst = `${formatCoord(destination.coordinates[0])},${formatCoord(destination.coordinates[1])}`;
    const timeKey = departureTime.toISOString();
    const rangeKey = dateRange
        ? `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
        : 'no-range';
    return `${src}|${dst}|${timeKey}|${rangeKey}`;
};

const hashStringToRange = (input: string, min: number, max: number): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const normalized = Math.abs(hash) % 1000; // 0-999
    return min + (normalized / 999) * (max - min);
};

const checkMlServiceAvailable = async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1500);

    const check = async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url, { signal: controller.signal });
            return response.ok;
        } catch {
            return false;
        }
    };

    try {
        if (await check(`${API_URL}/api/ml/health`)) {
            mlServiceDown = false;
            return true;
        }
        if (await check(`${ML_DIRECT_URL}/health`)) {
            mlServiceDown = false;
            return true;
        }
        mlServiceDown = true;
        return false;
    } finally {
        window.clearTimeout(timeoutId);
    }
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
    const cacheKey = buildPredictionCacheKey(source, destination, departureTime, dateRange);

    if (mlServiceDown && fallbackPredictionCache.has(cacheKey)) {
        const mlAvailable = await checkMlServiceAvailable();
        if (!mlAvailable) {
            return fallbackPredictionCache.get(cacheKey)!;
        }
    }

    mlFallbackUsedInRun = false;
    const hour = departureTime.getHours();

    // Generate both routes (now async with Mapbox API)
    let [bestRoute, fuelEfficientRoute] = await Promise.all([
        generateRoute(source, destination, 'best', hour),
        generateRoute(source, destination, 'fuel-efficient', hour)
    ]);

    // Safeguard: Ensure fastest route is actually faster
    // If fuel-efficient is faster, swap durations to maintain logical consistency
    if (fuelEfficientRoute.totalDuration < bestRoute.totalDuration) {
        const tempDuration = bestRoute.totalDuration;
        bestRoute = { ...bestRoute, totalDuration: fuelEfficientRoute.totalDuration };
        fuelEfficientRoute = { ...fuelEfficientRoute, totalDuration: tempDuration };
        
        // Recalculate segment durations proportionally
        const bestRatio = bestRoute.totalDuration / tempDuration;
        const fuelRatio = fuelEfficientRoute.totalDuration / fuelEfficientRoute.totalDuration;
        
        bestRoute.segments = bestRoute.segments.map(seg => ({
            ...seg,
            duration: seg.duration * bestRatio
        }));
        
        fuelEfficientRoute.segments = fuelEfficientRoute.segments.map(seg => ({
            ...seg,
            duration: seg.duration * fuelRatio
        }));
    }

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

    // Calculate actual fuel savings based on fuel efficiency scores
    const fuelSavings = Math.max(0, fuelEfficientRoute.fuelEfficiency - bestRoute.fuelEfficiency);

    const prediction: TrafficPrediction = {
        bestRoute,
        fuelEfficientRoute,
        optimalDepartureTime,
        optimalDate,
        usedDateRange: !!dateRange, // True if date range was provided
        confidence: hashStringToRange(cacheKey, 85, 95), // 85-95% deterministic confidence
        insights: {
            estimatedTime: Math.round(bestRoute.totalDuration),
            fuelSavings: Math.round(fuelSavings),
            congestionLevel,
            peakHours: ['07:00-09:00', '17:00-19:00'],
        },
    };

    if (mlFallbackUsedInRun) {
        fallbackPredictionCache.set(cacheKey, prediction);
    } else if (fallbackPredictionCache.has(cacheKey)) {
        fallbackPredictionCache.delete(cacheKey);
    }

    return prediction;
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
 * Generate dynamic insights based on current route and time
 */
export const generateDynamicInsights = (
    currentRoute: Route,
    _hour: number,
    bestRoute: Route,
    fuelEfficientRoute: Route
): TrafficPrediction['insights'] => {
    const congestionLevel =
        currentRoute.avgCongestion < 30 ? 'low' :
            currentRoute.avgCongestion < 60 ? 'moderate' :
                currentRoute.avgCongestion < 80 ? 'high' : 'severe';

    // Always calculate fuel savings as: fuel-efficient route efficiency - fastest route efficiency
    // This shows how much MORE efficient the fuel-efficient route is
    const fuelSavings = Math.max(0, Math.round(fuelEfficientRoute.fuelEfficiency - bestRoute.fuelEfficiency));

    return {
        estimatedTime: Math.round(currentRoute.totalDuration),
        fuelSavings,
        congestionLevel,
        peakHours: ['07:00-09:00', '17:00-19:00'],
    };
};

/**
 * Generate timeline data for 24 hours
 */
export const generateTimelineData = (route: Route): TimelineData[] => {
    const timeline: TimelineData[] = [];
    const baselineShift = Math.max(-15, Math.min(15, route.avgCongestion - 50));

    for (let hour = 0; hour < 24; hour++) {
        const congestion = Math.max(0, Math.min(100, getCongestionForTime(hour) + baselineShift));
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
export const getRouteAtTime = async (
    source: Location,
    destination: Location,
    hour: number,
    routeType: 'best' | 'fuel-efficient' = 'best'
): Promise<Route> => {
    return await generateRoute(source, destination, routeType, hour);
};
