// InsightsPanel Component - AI-powered insights dashboard
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TrafficPrediction } from '../../services/predictionService';
import { formatDuration, formatDistance } from '../../utils/mapUtils';
import { animateInsightCards } from '../../utils/animationUtils';

interface InsightsPanelProps {
    prediction: TrafficPrediction | null;
    theme?: 'light' | 'dark';
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
    prediction,
    theme = 'dark',
}) => {
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (prediction && cardsRef.current.length > 0) {
            const validCards = cardsRef.current.filter(card => card !== null) as HTMLElement[];
            animateInsightCards(validCards, 0.1);
        }
    }, [prediction]);

    if (!prediction) return null;

    const { insights, confidence, bestRoute } = prediction;

    const getCongestionColor = (level: string) => {
        switch (level) {
            case 'low': return '#10b981';
            case 'moderate': return '#f59e0b';
            case 'high': return '#f97316';
            case 'severe': return '#ef4444';
            default: return '#a0a0a0';
        }
    };

    const getCongestionIcon = (level: string) => {
        switch (level) {
            case 'low': return '🟢';
            case 'moderate': return '🟡';
            case 'high': return '🟠';
            case 'severe': return '🔴';
            default: return '⚪';
        }
    };

    const cardStyle: React.CSSProperties = {
        background: theme === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '1rem',
        padding: '1.5rem',
        transition: 'all 0.3s ease',
    };

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                width: '350px',
                maxHeight: 'calc(100vh - 4rem)',
                overflowY: 'auto',
                zIndex: 10,
            }}
        >
            {/* Header */}
            <div
                style={{
                    ...cardStyle,
                    marginBottom: '1rem',
                }}
            >
                <h3
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: theme === 'dark' ? 'white' : '#1a1a1a',
                        marginBottom: '0.5rem',
                    }}
                >
                    AI Insights
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                        style={{
                            flex: 1,
                            height: '6px',
                            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1)',
                                borderRadius: '3px',
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#3b82f6',
                        }}
                    >
                        {Math.round(confidence)}% Confidence
                    </span>
                </div>
            </div>

            {/* Travel Time Card */}
            <div
                ref={(el) => (cardsRef.current[0] = el)}
                style={{
                    ...cardStyle,
                    marginBottom: '1rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', fontWeight: 600 }}>
                        ESTIMATED TIME
                    </span>
                    <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: theme === 'dark' ? 'white' : '#1a1a1a' }}>
                    {formatDuration(insights.estimatedTime)}
                </div>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', marginTop: '0.5rem' }}>
                    {formatDistance(bestRoute.totalDistance)}
                </div>
            </div>

            {/* Fuel Savings Card */}
            <div
                ref={(el) => (cardsRef.current[1] = el)}
                style={{
                    ...cardStyle,
                    marginBottom: '1rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', fontWeight: 600 }}>
                        FUEL SAVINGS
                    </span>
                    <span style={{ fontSize: '1.5rem' }}>⛽</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                    {insights.fuelSavings}%
                </div>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', marginTop: '0.5rem' }}>
                    vs. standard route
                </div>
            </div>

            {/* Congestion Level Card */}
            <div
                ref={(el) => (cardsRef.current[2] = el)}
                style={{
                    ...cardStyle,
                    marginBottom: '1rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', fontWeight: 600 }}>
                        CONGESTION LEVEL
                    </span>
                    <span style={{ fontSize: '1.5rem' }}>{getCongestionIcon(insights.congestionLevel)}</span>
                </div>
                <div
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: getCongestionColor(insights.congestionLevel),
                        textTransform: 'capitalize',
                    }}
                >
                    {insights.congestionLevel}
                </div>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', marginTop: '0.5rem' }}>
                    Average along route
                </div>
            </div>

            {/* Optimal Time Card */}
            <div
                ref={(el) => (cardsRef.current[3] = el)}
                style={{
                    ...cardStyle,
                    marginBottom: '1rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', fontWeight: 600 }}>
                        OPTIMAL DEPARTURE
                    </span>
                    <span style={{ fontSize: '1.5rem' }}>🕐</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: theme === 'dark' ? 'white' : '#1a1a1a' }}>
                    {prediction.optimalDepartureTime}
                </div>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#a0a0a0' : '#666', marginTop: '0.5rem' }}>
                    {prediction.optimalDate}
                </div>
            </div>

            {/* Peak Hours Card */}
            <div
                ref={(el) => (cardsRef.current[4] = el)}
                style={{
                    ...cardStyle,
                    background: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 600 }}>
                        AVOID PEAK HOURS
                    </span>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {insights.peakHours.map((hour, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '0.5rem 0.75rem',
                                background: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#ef4444',
                            }}
                        >
                            {hour}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default InsightsPanel;
