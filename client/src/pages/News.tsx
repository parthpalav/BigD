import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import HamburgerMenu from '../components/HamburgerMenu';

interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  category: 'Traffic' | 'Accident' | 'Construction' | 'Transit' | 'Weather' | 'Other';
  timestamp: string;
  url: string;
}

const News: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Traffic Map', path: '/mapview' },
    { name: 'Assistant', path: '/assistant' },
    { name: 'News', path: '/news' },
    { name: 'About', path: '/about' },
  ];

  const categories = ['All', 'Traffic', 'Accident', 'Construction', 'Transit', 'Weather', 'Other'];

  const categoryEmojis: { [key: string]: string } = {
    Traffic: '🚦',
    Accident: '⚠️',
    Construction: '🚧',
    Transit: '🚇',
    Weather: '🌦️',
    Other: '📰'
  };

  // Fetch news from backend
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${API_URL}/news`);
      
      if (response.data.success) {
        setArticles(response.data.articles);
        setLastUpdated(new Date(response.data.lastUpdated));
      } else {
        setError('Failed to fetch news articles');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Unable to fetch news at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  // Filter articles by category
  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  // Format last updated timestamp
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Traffic: theme === 'dark' ? '#ef4444' : '#dc2626',
      Accident: theme === 'dark' ? '#f59e0b' : '#d97706',
      Construction: theme === 'dark' ? '#eab308' : '#ca8a04',
      Transit: theme === 'dark' ? '#3b82f6' : '#2563eb',
      Weather: theme === 'dark' ? '#06b6d4' : '#0891b2',
      Other: theme === 'dark' ? '#8b5cf6' : '#7c3aed'
    };
    return colors[category] || theme === 'dark' ? '#6b7280' : '#4b5563';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme === 'dark' ? '#000000' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
        transition: 'background 0.3s ease, color 0.3s ease',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Navigation Bar */}
      <AnimatePresence>
        <motion.nav
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '2rem 2rem',
            backdropFilter: 'blur(20px)',
            background: theme === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
            borderBottom: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none' }}>
              <motion.h1
                whileHover={{ scale: 1.05 }}
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                  cursor: 'pointer',
                }}
              >
                ORION
              </motion.h1>
            </Link>

            {/* Nav Links */}
            <ul
              style={{
                display: 'flex',
                gap: 'clamp(1.5rem, 3vw, 3rem)',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                alignItems: 'center',
              }}
            >
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  style={{ display: 'inline-block' }}
                >
                  <Link to={link.path} style={{ textDecoration: 'none' }}>
                    <motion.span
                      whileHover={{
                        scale: 1.1,
                        color: '#3b82f6',
                      }}
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'inline-block',
                      }}
                    >
                      {link.name}
                    </motion.span>
                  </Link>
                </motion.li>
              ))}
              {isAuthenticated && (
                <motion.li
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * navLinks.length, duration: 0.5 }}
                >
                  <LogoutButton />
                </motion.li>
              )}
            </ul>
          </div>
        </motion.nav>
      </AnimatePresence>

      {/* Hamburger Menu */}
      <HamburgerMenu />

      {/* Main Content */}
      <div style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
          }}
        >
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              textAlign: 'center',
              marginBottom: '3rem',
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                marginBottom: '1rem',
                lineHeight: 1.1,
              }}
            >
              Mumbai Traffic News
            </h1>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                fontWeight: 300,
                color: theme === 'dark' ? '#a0a0a0' : '#666666',
                maxWidth: '700px',
                margin: '0 auto 1rem',
                lineHeight: 1.6,
              }}
            >
              Real-time updates on traffic, road conditions, and transportation news in Mumbai
            </p>
            
            {/* Last Updated & Refresh */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {lastUpdated && (
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: theme === 'dark' ? '#a0a0a0' : '#666666',
                    margin: 0,
                  }}
                >
                  Last updated: {formatLastUpdated(lastUpdated)}
                </p>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchNews}
                disabled={loading}
                style={{
                  background: loading 
                    ? theme === 'dark' ? '#333333' : '#e5e5e5'
                    : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                  color: loading ? theme === 'dark' ? '#666666' : '#999999' : '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{loading ? '⏳' : '🔄'}</span>
                {loading ? 'Refreshing...' : 'Refresh'}
              </motion.button>
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '3rem',
              flexWrap: 'wrap',
            }}
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                style={{
                  background: selectedCategory === category
                    ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                    : theme === 'dark' ? '#1a1a1a' : '#f9fafb',
                  color: selectedCategory === category
                    ? '#ffffff'
                    : theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '2rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '1rem',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid',
                  borderColor: theme === 'dark' ? '#333333' : '#e5e5e5',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                }}
              />
              <p style={{ fontSize: '1rem', color: theme === 'dark' ? '#a0a0a0' : '#666666' }}>
                Fetching latest news...
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '1.5rem',
              }}
            >
              <span style={{ fontSize: '4rem' }}>⚠️</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchNews}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '4rem' }}>📰</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                No traffic news available at the moment
              </p>
              <p style={{ fontSize: '1rem', color: theme === 'dark' ? '#a0a0a0' : '#666666' }}>
                Check back later for updates
              </p>
            </motion.div>
          )}

          {/* News Grid */}
          {!loading && !error && filteredArticles.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '2rem',
              }}
            >
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: theme === 'dark' ? '#141414' : '#ffffff',
                    border: theme === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'dark' 
                      ? 'none' 
                      : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Article Metadata */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        background: getCategoryColor(article.category),
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {categoryEmojis[article.category]} {article.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: theme === 'dark' ? '#a0a0a0' : '#666666',
                      }}
                    >
                      {article.source}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: theme === 'dark' ? '#a0a0a0' : '#666666',
                      }}
                    >
                      • {article.timestamp}
                    </span>
                  </div>

                  {/* Article Title */}
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      marginBottom: '0.75rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.headline}
                  </h3>

                  {/* Article Summary */}
                  <p
                    style={{
                      fontSize: '1rem',
                      fontWeight: 400,
                      color: theme === 'dark' ? '#a0a0a0' : '#666666',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.summary}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default News;
