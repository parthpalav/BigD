// TrafficTimeline Component - Interactive timeline slider for traffic visualization
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TimelineData, Route } from '../../services/predictionService';
import { generateTimelineData } from '../../services/predictionService';
import { getTrafficColor } from '../../utils/mapUtils';

interface TrafficTimelineProps {
    route: Route | null;
    currentHour: number;
    onHourChange: (hour: number) => void;
    theme?: 'light' | 'dark';
}

const TrafficTimeline: React.FC<TrafficTimelineProps> = ({
    route,
    currentHour,
    onHourChange,
    theme = 'dark',
}) => {
    const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (route) {
            const data = generateTimelineData(route);
            setTimelineData(data);
        }
    }, [route]);

    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const hour = Math.floor(percentage * 24);
        onHourChange(hour);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const hour = Math.floor(percentage * 24);
        onHourChange(hour);
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []);

    if (!route || timelineData.length === 0) return null;

    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}${period}`;
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            style={{
                width: '100%',
                maxWidth: '700px',
                margin: '0 auto',
                background: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '1rem',
                padding: '1rem 1.5rem',
                boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3
                        style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: theme === 'dark' ? 'white' : '#1a1a1a',
                            marginBottom: '0.125rem',
                        }}
                    >
                        Traffic Timeline
                    </h3>
                    <p style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#a0a0a0' : '#666', margin: 0 }}>
                        Drag to explore patterns
                    </p>
                </div>
                <div
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#3b82f6',
                    }}
                >
                    {formatHour(currentHour)}
                </div>
            </div>

            {/* Timeline Track */}
            <div
                ref={timelineRef}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                style={{
                    position: 'relative',
                    height: '50px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    marginBottom: '0.75rem',
                }}
            >
                {/* Traffic Bars */}
                <div style={{ display: 'flex', height: '100%', gap: '2px' }}>
                    {timelineData.map((data, index) => (
                        <div
                            key={index}
                            style={{
                                flex: 1,
                                background: getTrafficColor(data.congestionLevel),
                                opacity: index === currentHour ? 1 : 0.6,
                                transition: 'opacity 0.3s ease',
                                position: 'relative',
                            }}
                            title={`${formatHour(data.hour)}: ${Math.round(data.congestionLevel)}% congestion`}
                        >
                            {index === currentHour && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Scrubber */}
                <motion.div
                    animate={{ left: `${(currentHour / 24) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        bottom: '-8px',
                        width: '4px',
                        background: 'white',
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                        cursor: 'ew-resize',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '16px',
                            height: '16px',
                            background: 'white',
                            borderRadius: '50%',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                    />
                </motion.div>
            </div>

            {/* Hour Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: theme === 'dark' ? '#a0a0a0' : '#666' }}>
                <span>12AM</span>
                <span>6AM</span>
                <span>12PM</span>
                <span>6PM</span>
                <span>11PM</span>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>
        </motion.div>
    );
};

export default TrafficTimeline;
