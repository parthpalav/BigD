import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

type Theme = 'light' | 'dark';

const Map: React.FC = () => {
  const { theme, toggleTheme } = useTheme(); // Use theme from context
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme === 'dark' ? '#000' : '#fff',
        transition: 'background 0.5s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background 3D Stars */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Canvas>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* Theme Toggle */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
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
          top: '2rem',
          left: '2rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          background: 'rgba(239, 68, 68, 0.8)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100,
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
        }}
      >
        Logout
      </motion.button>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '6rem',
          }}
        >
          {/* Header */}
          <motion.h1
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
            }}
          >
            Interactive Map
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              textAlign: 'center',
              fontSize: '1.25rem',
              color: theme === 'dark' ? '#a0a0a0' : '#666',
              marginBottom: '3rem',
            }}
          >
            Welcome, {user?.fullName || user?.email}!
          </motion.p>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              width: '100%',
              height: '600px',
              background: theme === 'dark'
                ? 'rgba(20, 20, 20, 0.6)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: theme === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '1.5rem',
              boxShadow: theme === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Placeholder Map Content */}
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div
                style={{
                  fontSize: '4rem',
                  marginBottom: '1rem',
                }}
              >
                🗺️
              </div>
              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: theme === 'dark' ? 'white' : '#1a1a1a',
                  marginBottom: '1rem',
                }}
              >
                Map View Coming Soon
              </h2>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: theme === 'dark' ? '#a0a0a0' : '#666',
                  maxWidth: '500px',
                  margin: '0 auto',
                }}
              >
                This is where your interactive data visualization map will be displayed.
                Integration with mapping libraries coming soon!
              </p>
            </div>

            {/* Animated Grid Background */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: theme === 'dark'
                  ? 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)'
                  : 'linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                opacity: 0.3,
                zIndex: 0,
              }}
            />
          </motion.div>

          {/* Info Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              marginTop: '3rem',
            }}
          >
            {[
              { icon: '📍', title: 'Location Data', desc: 'View geographic insights' },
              { icon: '📊', title: 'Analytics', desc: 'Real-time data visualization' },
              { icon: '🔍', title: 'Search', desc: 'Find specific locations' },
              { icon: '⚡', title: 'Fast Loading', desc: 'Optimized performance' },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  background: theme === 'dark'
                    ? 'rgba(20, 20, 20, 0.6)'
                    : 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: theme === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{card.icon}</div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: theme === 'dark' ? 'white' : '#1a1a1a',
                    marginBottom: '0.5rem',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: theme === 'dark' ? '#a0a0a0' : '#666',
                  }}
                >
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Map;
