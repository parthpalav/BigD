import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

const HamburgerMenu: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', top: '2rem', left: '2rem', zIndex: 100 }}>
      {/* Hamburger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '50px',
          height: '50px',
          background: theme === 'dark'
            ? 'rgba(20, 20, 20, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: theme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          transition: 'all 0.3s ease',
        }}
      >
        <motion.div
          animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '24px',
            height: '2px',
            background: theme === 'dark' ? '#fff' : '#1a1a1a',
            borderRadius: '2px',
          }}
        />
        <motion.div
          animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '24px',
            height: '2px',
            background: theme === 'dark' ? '#fff' : '#1a1a1a',
            borderRadius: '2px',
          }}
        />
        <motion.div
          animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '24px',
            height: '2px',
            background: theme === 'dark' ? '#fff' : '#1a1a1a',
            borderRadius: '2px',
          }}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '200px',
              background: theme === 'dark'
                ? 'rgba(20, 20, 20, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '0.75rem',
              padding: '0.5rem',
              boxShadow: theme === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Settings */}
            <motion.div
              whileHover={{ x: 5 }}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: theme === 'dark' ? '#fff' : '#1a1a1a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>⚙️</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Settings</span>
            </motion.div>

            {/* History */}
            <motion.div
              whileHover={{ x: 5 }}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: theme === 'dark' ? '#fff' : '#1a1a1a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📜</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>History</span>
            </motion.div>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: theme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
              margin: '0.5rem 0',
            }} />

            {/* Theme Toggle */}
            <motion.div
              whileHover={{ x: 5 }}
              onClick={toggleTheme}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                color: theme === 'dark' ? '#fff' : '#1a1a1a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              {/* Toggle Switch */}
              <div style={{
                width: '48px',
                height: '24px',
                borderRadius: '9999px',
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                  : '#666',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}>
                <motion.div
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HamburgerMenu;
