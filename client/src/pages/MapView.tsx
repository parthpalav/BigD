// MapView Page - Main AI-Powered Traffic Intelligence Platform
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
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
    generateDynamicInsights,
} from '../services/predictionService';
import { saveSearch } from '../services/searchHistoryService';
import type { SearchHistoryItem } from '../services/searchHistoryService';

type Theme = 'light' | 'dark';

const MapView: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const { user, isAuthenticated } = useAuth();

    const [sourceLocation, setSourceLocation] = useState<[number, number] | undefined>();
    const [destinationLocation, setDestinationLocation] = useState<[number, number] | undefined>();
    const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
    const [prediction, setPrediction] = useState<TrafficPrediction | null>(null);
    const [dynamicPrediction, setDynamicPrediction] = useState<TrafficPrediction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [selectedRouteType, setSelectedRouteType] = useState<'best' | 'fuel-efficient'>('best');
    const [showHistory, setShowHistory] = useState(true);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
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
            setDynamicPrediction(result);
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

    const handleHourChange = async (hour: number) => {
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

            const newRoute = await getRouteAtTime(source, destination, hour, selectedRouteType);
            setCurrentRoute(newRoute);
            
            // Update dynamic insights with the new route
            if (prediction) {
                const dynamicInsights = generateDynamicInsights(
                    newRoute, 
                    hour, 
                    selectedRouteType === 'best' ? newRoute : prediction.bestRoute,
                    selectedRouteType === 'fuel-efficient' ? newRoute : prediction.fuelEfficientRoute
                );
                
                setDynamicPrediction({
                    ...prediction,
                    bestRoute: selectedRouteType === 'best' ? newRoute : prediction.bestRoute,
                    fuelEfficientRoute: selectedRouteType === 'fuel-efficient' ? newRoute : prediction.fuelEfficientRoute,
                    insights: dynamicInsights,
                });
            }
        }
    };

    const handleRouteTypeChange = (type: 'best' | 'fuel-efficient') => {
        setSelectedRouteType(type);

        if (prediction) {
            const route = type === 'best' ? prediction.bestRoute : prediction.fuelEfficientRoute;
            setCurrentRoute(route);
            
            // Update dynamic insights for the selected route type
            const dynamicInsights = generateDynamicInsights(
                route, 
                currentHour, 
                prediction.bestRoute,
                prediction.fuelEfficientRoute
            );
            
            setDynamicPrediction({
                ...prediction,
                insights: dynamicInsights,
            });
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
            setDynamicPrediction(result);
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
            {/* Map Container - Base Layer */}
            <MapContainer
                sourceLocation={sourceLocation}
                destinationLocation={destinationLocation}
                route={currentRoute}
                currentHour={currentHour}
                theme={theme}
            />

            {/* Top Bar - Controls & User Info */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: theme === 'dark' 
                        ? 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 100,
                }}
            >
                {/* Left Side - User Info & Logout */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginRight: '1rem',
                        }}
                    >
                        <div style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '0.05em',
                        }}>
                            ORION
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: theme === 'dark' ? '#888' : '#666',
                            borderLeft: `2px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                            paddingLeft: '0.75rem',
                            fontWeight: 500,
                        }}>
                            AI Traffic Intelligence
                        </div>
                    </motion.div>

                    {/* User Info */}
                    {user && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                            }}
                        >
                            {user.fullName || user.email}
                        </motion.div>
                    )}

                    {/* Logout */}
                    <LogoutButton />
                </div>

                {/* Right Side - Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {user?.id && (
                        <motion.button
                            onClick={() => setShowHistory(!showHistory)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                background: showHistory
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: showHistory ? 'white' : theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                boxShadow: showHistory ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                                transition: 'all 0.3s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            History
                        </motion.button>
                    )}

                    {/* Theme Toggle */}
                    <motion.button
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            background: theme === 'dark'
                                ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                                : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            boxShadow: theme === 'dark'
                                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                                : '0 4px 12px rgba(251, 191, 36, 0.3)',
                            transition: 'all 0.3s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </motion.button>
                </div>
            </div>

            {/* Left Sidebar - Input Panel */}
            <InputPanel
                onSubmit={handlePredictionSubmit}
                isLoading={isLoading}
                theme={theme}
            />

            {/* Right Sidebar - Search History */}
            {user?.id && (
                <SearchHistory
                    userId={user.id}
                    onSelectSearch={handleHistoryItemClick}
                    theme={theme}
                    isVisible={showHistory}
                />
            )}

            {/* Route Type Selector - Top Center */}
            {prediction && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        position: 'fixed',
                        top: '5.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                        background: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '1rem',
                        padding: '0.5rem',
                        boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                        zIndex: 90,
                    }}
                >
                    <motion.button
                        onClick={() => handleRouteTypeChange('best')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                            fontSize: '0.875rem',
                        }}
                    >
                        Fastest Route
                    </motion.button>
                    <motion.button
                        onClick={() => handleRouteTypeChange('fuel-efficient')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                            fontSize: '0.875rem',
                        }}
                    >
                        Fuel Efficient
                    </motion.button>
                </motion.div>
            )}

            {/* Right Sidebar - Insights & Timeline */}
            <div
                style={{
                    position: 'fixed',
                    top: '5rem',
                    right: 0,
                    bottom: 0,
                    width: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1rem',
                    overflowY: 'auto',
                    pointerEvents: 'none',
                    zIndex: 80,
                }}
            >
                {/* Insights Panel */}
                {dynamicPrediction && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <InsightsPanel
                            prediction={dynamicPrediction}
                            theme={theme}
                        />
                    </div>
                )}

                {/* Traffic Timeline */}
                {currentRoute && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <TrafficTimeline
                            route={currentRoute}
                            currentHour={currentHour}
                            onHourChange={handleHourChange}
                            theme={theme}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapView;
