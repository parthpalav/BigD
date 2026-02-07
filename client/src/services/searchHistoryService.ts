// Search History Service - Manages user search history with localStorage persistence
import type { Location } from './predictionService';

export interface SearchHistoryItem {
    id: string;
    userId: string;
    source: Location;
    destination: Location;
    departureTime: Date;
    dateRange?: { start: Date; end: Date };
    timestamp: Date;
    searchCount: number;
}

interface SearchHistoryStorage {
    searches: SearchHistoryItem[];
}

const MAX_HISTORY_ITEMS = 50;
const STORAGE_KEY_PREFIX = 'orion_search_history_';

// Generate unique ID for search items
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get storage key for specific user
const getStorageKey = (userId: string): string => {
    return `${STORAGE_KEY_PREFIX}${userId}`;
};

// Load history from localStorage
const loadHistory = (userId: string): SearchHistoryItem[] => {
    try {
        const key = getStorageKey(userId);
        const data = localStorage.getItem(key);

        if (!data) return [];

        const storage: SearchHistoryStorage = JSON.parse(data);

        // Convert date strings back to Date objects
        return storage.searches.map(item => ({
            ...item,
            departureTime: new Date(item.departureTime),
            timestamp: new Date(item.timestamp),
            dateRange: item.dateRange ? {
                start: new Date(item.dateRange.start),
                end: new Date(item.dateRange.end),
            } : undefined,
        }));
    } catch (error) {
        console.error('Error loading search history:', error);
        return [];
    }
};

// Save history to localStorage
const saveHistory = (userId: string, searches: SearchHistoryItem[]): void => {
    try {
        const key = getStorageKey(userId);
        const storage: SearchHistoryStorage = { searches };
        localStorage.setItem(key, JSON.stringify(storage));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
};

// Check if two routes are the same (same source and destination)
const isSameRoute = (
    route1: { source: Location; destination: Location },
    route2: { source: Location; destination: Location }
): boolean => {
    const [srcLng1, srcLat1] = route1.source.coordinates;
    const [srcLng2, srcLat2] = route2.source.coordinates;
    const [destLng1, destLat1] = route1.destination.coordinates;
    const [destLng2, destLat2] = route2.destination.coordinates;

    // Consider routes the same if coordinates are within ~100m
    const threshold = 0.001; // ~111m at equator

    return (
        Math.abs(srcLng1 - srcLng2) < threshold &&
        Math.abs(srcLat1 - srcLat2) < threshold &&
        Math.abs(destLng1 - destLng2) < threshold &&
        Math.abs(destLat1 - destLat2) < threshold
    );
};

/**
 * Save a new search to history
 * If the same route exists, increment its search count
 */
export const saveSearch = (
    userId: string,
    source: Location,
    destination: Location,
    departureTime: Date,
    dateRange?: { start: Date; end: Date }
): void => {
    const searches = loadHistory(userId);

    // Check if this route already exists
    const existingIndex = searches.findIndex(item =>
        isSameRoute({ source, destination }, { source: item.source, destination: item.destination })
    );

    if (existingIndex !== -1) {
        // Route exists - increment count and update timestamp
        searches[existingIndex].searchCount += 1;
        searches[existingIndex].timestamp = new Date();
        searches[existingIndex].departureTime = departureTime;
        searches[existingIndex].dateRange = dateRange;

        // Move to front of array (most recent)
        const [updated] = searches.splice(existingIndex, 1);
        searches.unshift(updated);
    } else {
        // New route - add to beginning
        const newSearch: SearchHistoryItem = {
            id: generateId(),
            userId,
            source,
            destination,
            departureTime,
            dateRange,
            timestamp: new Date(),
            searchCount: 1,
        };

        searches.unshift(newSearch);
    }

    // Limit to MAX_HISTORY_ITEMS
    const trimmedSearches = searches.slice(0, MAX_HISTORY_ITEMS);

    saveHistory(userId, trimmedSearches);
};

/**
 * Get all search history for a user (sorted by most recent)
 */
export const getSearchHistory = (userId: string): SearchHistoryItem[] => {
    return loadHistory(userId);
};

/**
 * Get frequent routes (searched 3+ times)
 */
export const getFrequentRoutes = (userId: string): SearchHistoryItem[] => {
    const searches = loadHistory(userId);
    return searches.filter(item => item.searchCount >= 3);
};

/**
 * Delete a specific search from history
 */
export const deleteSearch = (userId: string, searchId: string): void => {
    const searches = loadHistory(userId);
    const filtered = searches.filter(item => item.id !== searchId);
    saveHistory(userId, filtered);
};

/**
 * Clear all search history for a user
 */
export const clearHistory = (userId: string): void => {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
};

/**
 * Get search count for a specific route
 */
export const getRouteSearchCount = (
    userId: string,
    source: Location,
    destination: Location
): number => {
    const searches = loadHistory(userId);
    const match = searches.find(item =>
        isSameRoute({ source, destination }, { source: item.source, destination: item.destination })
    );

    return match ? match.searchCount : 0;
};

/**
 * Check if a route is frequent (3+ searches)
 */
export const isFrequentRoute = (
    userId: string,
    source: Location,
    destination: Location
): boolean => {
    return getRouteSearchCount(userId, source, destination) >= 3;
};
