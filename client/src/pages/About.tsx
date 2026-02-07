import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { CityScene } from '../components/about/CityScene';
import { TrafficFlow } from '../components/about/TrafficFlow';
import { SceneController } from '../components/about/SceneController';
import { ScrollSections } from '../components/about/ScrollSections';

const About: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [focusMode, setFocusMode] = useState<'commercial' | 'private' | 'intelligence' | 'default'>('default');

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(window.scrollY / scrollHeight, 1);
      setScrollProgress(progress);

      // Update focus mode based on scroll progress
      if (progress < 0.2) {
        setFocusMode('default');
      } else if (progress < 0.4) {
        setFocusMode('commercial');
      } else if (progress < 0.6) {
        setFocusMode('private');
      } else if (progress < 0.8) {
        setFocusMode('intelligence');
      } else {
        setFocusMode('default');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        minHeight: '500vh',
        background: theme === 'dark' ? '#000' : '#fff',
        transition: 'background 0.5s ease',
        position: 'relative',
      }}
    >
      {/* Fixed 3D Scene */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 0,
        }}
      >
        <Canvas
          camera={{ position: [0, 25, 25], fov: 50 }}
          style={{
            background: theme === 'dark'
              ? 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)'
              : 'radial-gradient(circle at center, #f0f0f0 0%, #e0e0e0 100%)',
          }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={0.5} />
          <CityScene scrollProgress={scrollProgress} focusMode={focusMode} />
          <TrafficFlow intensity={0.3 + scrollProgress * 0.7} focusMode={focusMode} />
          <SceneController scrollProgress={scrollProgress} focusMode={focusMode} />
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

      {/* Back Button */}
      <Link to="/">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            top: '2rem',
            left: '2rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            background: theme === 'dark'
              ? 'rgba(59, 130, 246, 0.8)'
              : 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            zIndex: 100,
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
          }}
        >
          ← Back to Home
        </motion.button>
      </Link>

      {/* Scroll Sections Overlay */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <ScrollSections theme={theme} />
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: scrollProgress < 0.1 ? 1 : 0 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            width: '24px',
            height: '36px',
            border: theme === 'dark' ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '8px',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              borderRadius: '2px',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About;
