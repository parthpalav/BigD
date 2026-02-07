// MapView Page - Main AI-Powered Traffic Intelligence Platform
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MapContainer from '../components/map/MapContainer';
import InputPanel from '../components/map/InputPanel';
import InsightsPanel from '../components/map/InsightsPanel';
import TrafficTimeline from '../components/map/TrafficTimeline';
import SearchHistory from '../components/map/SearchHistory';
import type {
    Location,
    TrafficPrediction,
    Route,
} from '../services/predictionService';
import {
    predictTraffic,
    getRouteAtTime,
} from '../services/predictionService';
import { saveSearch } from '../services/searchHistoryService';
import type { SearchHistoryItem } from '../services/searchHistoryService';

type Theme = 'light' | 'dark';

const MapView: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [sourceLocation, setSourceLocation] = useState<[number, number] | undefined>();
    const [destinationLocation, setDestinationLocation] = useState<[number, number] | undefined>();
    const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
    const [prediction, setPrediction] = useState<TrafficPrediction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [selectedRouteType, setSelectedRouteType] = useState<'best' | 'fuel-efficient'>('best');
    const [showHistory, setShowHistory] = useState(true);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handlePredictionSubmit = async (data: {
        source: Location;
        destination: Location;
        departureTime: Date;
        dateRange?: { start: Date; end: Date };
    }) => {
        setIsLoading(true);
        setSourceLocation(data.source.coordinates);
        setDestinationLocation(data.destination.coordinates);

        try {
            const result = await predictTraffic(
                data.source,
                data.destination,
                data.departureTime,
                data.dateRange
            );

            setPrediction(result);
            setCurrentRoute(result.bestRoute);
            setCurrentHour(data.departureTime.getHours());

            // Auto-save search to history
            if (user?.id) {
                saveSearch(
                    user.id,
                    data.source,
                    data.destination,
                    data.departureTime,
                    data.dateRange
                );
            }
        } catch (error) {
            console.error('Prediction failed:', error);
            alert('Failed to generate traffic prediction. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHourChange = (hour: number) => {
        setCurrentHour(hour);

        // Update route based on new hour if we have prediction data
        if (prediction && sourceLocation && destinationLocation) {
            const source: Location = {
                name: 'Source',
                coordinates: sourceLocation,
            };
            const destination: Location = {
                name: 'Destination',
                coordinates: destinationLocation,
            };

            const newRoute = getRouteAtTime(source, destination, hour, selectedRouteType);
            setCurrentRoute(newRoute);
        }
    };

    const handleRouteTypeChange = (type: 'best' | 'fuel-efficient') => {
        setSelectedRouteType(type);

        if (prediction) {
            const route = type === 'best' ? prediction.bestRoute : prediction.fuelEfficientRoute;
            setCurrentRoute(route);
        }
    };

    const handleHistoryItemClick = async (item: SearchHistoryItem) => {
        // Reload route from history
        setIsLoading(true);
        setSourceLocation(item.source.coordinates);
        setDestinationLocation(item.destination.coordinates);

        try {
            const result = await predictTraffic(
                item.source,
                item.destination,
                item.departureTime,
                item.dateRange
            );

            setPrediction(result);
            setCurrentRoute(result.bestRoute);
            setCurrentHour(item.departureTime.getHours());
            setSelectedRouteType('best');
        } catch (error) {
            console.error('Failed to reload route:', error);
            alert('Failed to reload route. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                position: 'relative',
                overflow: 'hidden',
                background: theme === 'dark' ? '#000' : '#fff',
                transition: 'background 0.5s ease',
            }}
        >
            {/* Map Container */}
            <MapContainer
                sourceLocation={sourceLocation}
                destinationLocation={destinationLocation}
                route={currentRoute}
                currentHour={currentHour}
                theme={theme}
            />

            {/* Input Panel */}
            <InputPanel
                onSubmit={handlePredictionSubmit}
                isLoading={isLoading}
                theme={theme}
            />

            {/* Search History */}
            {user?.id && (
                <SearchHistory
                    userId={user.id}
                    onSelectSearch={handleHistoryItemClick}
                    theme={theme}
                    isVisible={showHistory}
                />
            )}

            {/* Insights Panel */}
            {prediction && (
                <InsightsPanel
                    prediction={prediction}
                    theme={theme}
                />
            )}

            {/* Traffic Timeline */}
            {currentRoute && (
                <TrafficTimeline
                    route={currentRoute}
                    currentHour={currentHour}
                    onHourChange={handleHourChange}
                    theme={theme}
                />
            )}

            {/* Route Type Selector */}
            {prediction && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    style={{
                        position: 'absolute',
                        top: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                        background: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '1rem',
                        padding: '0.5rem',
                        boxShadow: theme === 'dark' ? '0 4px 16px rgba(0, 0, 0, 0.6)' : '0 4px 16px rgba(0, 0, 0, 0.1)',
                        zIndex: 10,
                    }}
                >
                    <motion.button
                        onClick={() => handleRouteTypeChange('best')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: selectedRouteType === 'best'
                                ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                                : 'transparent',
                            color: selectedRouteType === 'best' ? 'white' : theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        ⚡ Fastest Route
                    </motion.button>
                    <motion.button
                        onClick={() => handleRouteTypeChange('fuel-efficient')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: selectedRouteType === 'fuel-efficient'
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'transparent',
                            color: selectedRouteType === 'fuel-efficient' ? 'white' : theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        🌿 Fuel Efficient
                    </motion.button>
                </motion.div>
            )}

            {/* History Toggle */}
            <motion.button
                onClick={() => setShowHistory(!showHistory)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '470px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: showHistory
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'rgba(100, 100, 100, 0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: showHistory
                        ? '0 0 20px rgba(16, 185, 129, 0.4)'
                        : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>
                    {showHistory ? '🕒' : '📋'}
                </span>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '400px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: theme === 'dark'
                        ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: theme === 'dark'
                        ? '0 0 20px rgba(59, 130, 246, 0.4)'
                        : '0 0 20px rgba(251, 191, 36, 0.4)',
                    transition: 'all 0.3s ease',
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </span>
            </motion.button>

            {/* Logout Button */}
            <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '2rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 100,
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                }}
            >
                ← Logout
            </motion.button>

            {/* Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    fontSize: '0.875rem',
                    color: theme === 'dark' ? '#666' : '#999',
                    zIndex: 100,
                    textAlign: 'right',
                }}
            >
                <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                    ORION
                </div>
                <div>AI-Powered Traffic Intelligence</div>
            </motion.div>
        </div>
    );
};

export default MapView;
