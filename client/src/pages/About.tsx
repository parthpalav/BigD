import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import LogoutButton from '../components/LogoutButton';
import { CityScene } from '../components/about/CityScene';
import { TrafficFlow } from '../components/about/TrafficFlow';
import { SceneController } from '../components/about/SceneController';
import { ScrollSections } from '../components/about/ScrollSections';

const About: React.FC = () => {
  const { theme } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [focusMode, setFocusMode] = useState<'commercial' | 'private' | 'intelligence' | 'default'>('default');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Traffic Map', path: '/mapview' },
    { name: 'Assistant', path: '/assistant' },
    { name: 'News', path: '/news' },
    { name: 'About', path: '/about' },
  ];

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

      {/* Logout Button */}
      <LogoutButton />

      {/* Navigation Bar */}
      <AnimatePresence>
        <motion.nav
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '2rem 2rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme === 'dark' ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              zIndex: -1,
              transition: 'background 0.3s ease',
            }}
          />

          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ul
              style={{
                display: 'flex',
                gap: '3rem',
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.path}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Link
                    to={link.path}
                    style={{
                      color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      position: 'relative',
                      padding: '0.5rem 0',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme === 'dark' ? '#e5e5e5' : '#1a1a1a';
                    }}
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.nav>
      </AnimatePresence>

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
