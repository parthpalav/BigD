import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface LogoutButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ className, style }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        ...style,
      }}
    >
      {/* User Info (optional) */}
      {user && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: theme === 'dark'
              ? 'rgba(20, 20, 20, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: theme === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '0.75rem',
            color: theme === 'dark' ? '#fff' : '#1a1a1a',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <span>👤</span>
          <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.fullName || user.email}
          </span>
        </motion.div>
      )}

      {/* Logout Button */}
      <motion.button
        onClick={handleLogout}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }}
      >
        <span>🚪</span>
        <span>Log out</span>
      </motion.button>
    </motion.div>
  );
};

export default LogoutButton;
