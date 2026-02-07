// SearchHistory Component - Display past searches with clickable cards
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchHistoryItem } from '../../services/searchHistoryService';
import { getSearchHistory, deleteSearch, clearHistory } from '../../services/searchHistoryService';

interface SearchHistoryProps {
    userId: string;
    onSelectSearch: (item: SearchHistoryItem) => void;
    theme?: 'light' | 'dark';
    isVisible?: boolean;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
    userId,
    onSelectSearch,
    theme = 'dark',
    isVisible = true,
}) => {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Load history on mount and when userId changes
    useEffect(() => {
        loadHistory();
    }, [userId]);

    const loadHistory = () => {
        const searches = getSearchHistory(userId);
        setHistory(searches);
    };

    const handleSelectSearch = (item: SearchHistoryItem) => {
        setSelectedId(item.id);
        onSelectSearch(item);

        // Clear selection after animation
        setTimeout(() => setSelectedId(null), 600);
    };

    const handleDelete = (e: React.MouseEvent, searchId: string) => {
        e.stopPropagation();
        deleteSearch(userId, searchId);
        loadHistory();
    };

    const handleClearAll = () => {
        if (window.confirm('Clear all search history?')) {
            clearHistory(userId);
            loadHistory();
        }
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return formatDate(date);
    };

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                position: 'fixed',
                left: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '350px',
                maxHeight: '70vh',
                background: theme === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                zIndex: 15,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: theme === 'dark' ? '#fff' : '#000',
                }}>
                    🕒 Recent Searches
                </h3>
                {history.length > 0 && (
                    <motion.button
                        onClick={handleClearAll}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: theme === 'dark' ? '#ef4444' : '#dc2626',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                        }}
                    >
                        Clear All
                    </motion.button>
                )}
            </div>

            {/* History List */}
            <div style={{
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flex: 1,
            }}>
                <AnimatePresence mode="popLayout">
                    {history.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                textAlign: 'center',
                                padding: '2rem 1rem',
                                color: theme === 'dark' ? '#666' : '#999',
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                No search history yet.
                                <br />
                                Start exploring routes!
                            </p>
                        </motion.div>
                    ) : (
                        history.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: selectedId === item.id ? 0.98 : 1,
                                }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                    scale: { duration: 0.2 }
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    borderColor: 'rgba(59, 130, 246, 0.5)',
                                }}
                                onClick={() => handleSelectSearch(item)}
                                style={{
                                    background: theme === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
                                    border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                }}
                            >
                                {/* Frequent Route Badge */}
                                {item.searchCount >= 3 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        fontSize: '0.625rem',
                                        fontWeight: 700,
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        Suggested again?
                                    </div>
                                )}

                                {/* Route */}
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                                    marginBottom: '0.5rem',
                                    paddingRight: item.searchCount >= 3 ? '7rem' : '2rem',
                                    lineHeight: 1.4,
                                }}>
                                    <span style={{ opacity: 0.7 }}>📍</span> {item.source.name}
                                    <br />
                                    <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>→</span>
                                    <br />
                                    <span style={{ opacity: 0.7 }}>🎯</span> {item.destination.name}
                                </div>

                                {/* Metadata */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    fontSize: '0.75rem',
                                    color: theme === 'dark' ? '#999' : '#666',
                                }}>
                                    <span style={{
                                        background: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                    }}>
                                        🕐 {formatTime(item.departureTime)}
                                    </span>
                                    <span style={{
                                        background: theme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                                        color: '#a855f7',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                    }}>
                                        📅 {formatDate(item.departureTime)}
                                    </span>
                                    {item.searchCount > 1 && (
                                        <span style={{
                                            background: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.375rem',
                                        }}>
                                            🔄 {item.searchCount}x
                                        </span>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <div style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.625rem',
                                    color: theme === 'dark' ? '#666' : '#999',
                                    opacity: 0.7,
                                }}>
                                    {formatRelativeTime(item.timestamp)}
                                </div>

                                {/* Delete Button */}
                                <motion.button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '0.75rem',
                                        right: '0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: theme === 'dark' ? '#ef4444' : '#dc2626',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                >
                                    🗑️
                                </motion.button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Stats */}
            {history.length > 0 && (
                <div style={{
                    borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    paddingTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: theme === 'dark' ? '#666' : '#999',
                    textAlign: 'center',
                }}>
                    {history.length} {history.length === 1 ? 'search' : 'searches'} saved
                </div>
            )}
        </motion.div>
    );
};

export default SearchHistory;
