// InputPanel Component - AI Dashboard-style input interface
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
// @ts-ignore - No types available for @mapbox/mapbox-gl-geocoder
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import type { Location } from '../../services/predictionService';

interface InputPanelProps {
    onSubmit: (data: {
        source: Location;
        destination: Location;
        departureTime: Date;
        dateRange?: { start: Date; end: Date };
    }) => void;
    isLoading?: boolean;
    theme?: 'light' | 'dark';
}

const InputPanel: React.FC<InputPanelProps> = ({
    onSubmit,
    isLoading = false,
    theme = 'dark',
}) => {
    const [source, setSource] = useState<Location | null>(null);
    const [destination, setDestination] = useState<Location | null>(null);
    const [departureDate, setDepartureDate] = useState<string>('');
    const [departureTime, setDepartureTime] = useState<string>('09:00');
    const [useDateRange, setUseDateRange] = useState(false);
    const [dateRangeStart, setDateRangeStart] = useState<string>('');
    const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

    const sourceGeocoderRef = useRef<HTMLDivElement>(null);
    const destGeocoderRef = useRef<HTMLDivElement>(null);
    const sourceGeocoderInstance = useRef<any>(null);
    const destGeocoderInstance = useRef<any>(null);
    const [userProximity, setUserProximity] = useState<[number, number] | null>(null);

    // Get user's location for proximity-based suggestions
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserProximity([position.coords.longitude, position.coords.latitude]);
                },
                (error) => {
                    console.log('Geolocation not available:', error);
                }
            );
        }
    }, []);

    // Initialize geocoders once
    useEffect(() => {
        if (!sourceGeocoderRef.current || !destGeocoderRef.current) return;
        if (sourceGeocoderInstance.current || destGeocoderInstance.current) return; // Prevent duplicate initialization

        const geocoderOptions: any = {
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl as any,
            countries: 'us,in,gb,ca,au',
            types: 'place,address,poi,locality,neighborhood',
            limit: 8,
        };

        if (userProximity) {
            geocoderOptions.proximity = userProximity;
        }

        sourceGeocoderInstance.current = new MapboxGeocoder({
            ...geocoderOptions,
            placeholder: '📍 Enter source location...',
        });

        destGeocoderInstance.current = new MapboxGeocoder({
            ...geocoderOptions,
            placeholder: '🎯 Enter destination...',
        });

        sourceGeocoderInstance.current.addTo(sourceGeocoderRef.current);
        destGeocoderInstance.current.addTo(destGeocoderRef.current);

        sourceGeocoderInstance.current.on('result', (e: any) => {
            setSource({
                name: e.result.place_name,
                coordinates: e.result.center,
            });
        });

        destGeocoderInstance.current.on('result', (e: any) => {
            setDestination({
                name: e.result.place_name,
                coordinates: e.result.center,
            });
        });

        return () => {
            if (sourceGeocoderInstance.current) {
                sourceGeocoderInstance.current.clear();
                sourceGeocoderInstance.current = null;
            }
            if (destGeocoderInstance.current) {
                destGeocoderInstance.current.clear();
                destGeocoderInstance.current = null;
            }
        };
    }, [userProximity]);

    // Handle use current location
    const useCurrentLocation = (type: 'source' | 'destination') => {
        if (!userProximity) {
            alert('Please enable location access to use this feature');
            return;
        }

        const location: Location = {
            name: 'Current Location',
            coordinates: userProximity,
        };

        if (type === 'source') {
            setSource(location);
            if (sourceGeocoderInstance.current) {
                sourceGeocoderInstance.current.setInput('Current Location');
            }
        } else {
            setDestination(location);
            if (destGeocoderInstance.current) {
                destGeocoderInstance.current.setInput('Current Location');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!source || !destination || !departureDate) {
            alert('Please fill in all required fields');
            return;
        }

        const [hours, minutes] = departureTime.split(':').map(Number);
        const departureDateTime = new Date(departureDate);
        departureDateTime.setHours(hours, minutes);

        const data: any = {
            source,
            destination,
            departureTime: departureDateTime,
        };

        if (useDateRange && dateRangeStart && dateRangeEnd) {
            data.dateRange = {
                start: new Date(dateRangeStart),
                end: new Date(dateRangeEnd),
            };
        }

        onSubmit(data);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem 1rem',
        fontSize: '0.95rem',
        background: theme === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
        outline: 'none',
        transition: 'all 0.3s ease',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: theme === 'dark' ? '#a0a0a0' : '#666',
        marginBottom: '0.5rem',
    };

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                top: '2rem',
                left: '2rem',
                width: '380px',
                maxHeight: 'calc(100vh - 4rem)',
                overflowY: 'auto',
                background: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
            }}
        >
            <h2
                style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: theme === 'dark' ? 'white' : '#1a1a1a',
                    marginBottom: '0.5rem',
                }}
            >
                Traffic Intelligence
            </h2>
            <p
                style={{
                    fontSize: '0.875rem',
                    color: theme === 'dark' ? '#a0a0a0' : '#666',
                    marginBottom: '2rem',
                }}
            >
                AI-powered route prediction and optimization
            </p>

            <form onSubmit={handleSubmit}>
                {/* Source Location */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Source Location</label>
                        <motion.button
                            type="button"
                            onClick={() => useCurrentLocation('source')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '0.375rem',
                                color: 'white',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            📍 Current
                        </motion.button>
                    </div>
                    <div ref={sourceGeocoderRef} />
                </div>

                {/* Destination Location */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Destination</label>
                        <motion.button
                            type="button"
                            onClick={() => useCurrentLocation('destination')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '0.375rem',
                                color: 'white',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            📍 Current
                        </motion.button>
                    </div>
                    <div ref={destGeocoderRef} />
                </div>

                {/* Departure Date */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="departureDate" style={labelStyle}>
                        Departure Date
                    </label>
                    <input
                        id="departureDate"
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        required
                        style={inputStyle}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                {/* Departure Time */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="departureTime" style={labelStyle}>
                        Departure Time
                    </label>
                    <input
                        id="departureTime"
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                {/* Date Range Toggle */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={useDateRange}
                            onChange={(e) => setUseDateRange(e.target.checked)}
                            style={{ marginRight: '0.5rem' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a' }}>
                            Find optimal date in range
                        </span>
                    </label>
                </div>

                {/* Date Range Inputs */}
                {useDateRange && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="dateRangeStart" style={labelStyle}>
                                Range Start
                            </label>
                            <input
                                id="dateRangeStart"
                                type="date"
                                value={dateRangeStart}
                                onChange={(e) => setDateRangeStart(e.target.value)}
                                style={inputStyle}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label htmlFor="dateRangeEnd" style={labelStyle}>
                                Range End
                            </label>
                            <input
                                id="dateRangeEnd"
                                type="date"
                                value={dateRangeEnd}
                                onChange={(e) => setDateRangeEnd(e.target.value)}
                                style={inputStyle}
                                min={dateRangeStart || new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: isLoading
                            ? 'rgba(100, 100, 100, 0.5)'
                            : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: 'white',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        boxShadow: isLoading ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)',
                        transition: 'all 0.3s ease',
                    }}
                >
                    {isLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                }}
                            />
                            Analyzing Traffic...
                        </span>
                    ) : (
                        'Predict Traffic'
                    )}
                </motion.button>
            </form>

            {/* Info */}
            <div
                style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
            >
                <p style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#a0a0a0' : '#666', margin: 0 }}>
                    💡 Our AI analyzes historical traffic patterns, real-time data, and predictive models to recommend the best routes and times for your journey.
                </p>
            </div>
        </motion.div>
    );
};

export default InputPanel;
