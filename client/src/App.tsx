import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Lenis from 'lenis';
import './index.css';

// Theme type
type Theme = 'light' | 'dark';

// Theme Toggle Button Component
const ThemeToggle = ({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) => {
  return (
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
  );
};

// Three.js Particle Field Component
const ParticleField = () => {
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
    </>
  );
};

// Navigation Bar Component
const NavigationBar = ({ showNav, onNavigate, theme }: { showNav: boolean; onNavigate: () => void; theme: Theme }) => {
  const navLinks = ['Home', 'Map', 'About Us'];

  return (
    <AnimatePresence>
      {showNav && (
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
            padding: '1.5rem 2rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Animated gradient background */}
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

          {/* Gradient border effect on hover */}
          <div
            className="nav-gradient-border"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1, #0ea5e9)',
              backgroundSize: '300% 100%',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              zIndex: -2,
              pointerEvents: 'none',
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
                <motion.li key={link}>
                  <motion.a
                    href={link === 'Home' ? '#' : `#${link.toLowerCase().replace(' ', '-')}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (link === 'Home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{
                      scale: 1.05,
                      color: '#3b82f6',
                    }}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
                      letterSpacing: '0.05em',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    {link}
                    {/* Underline animation */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        left: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1)',
                      }}
                    />
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </div>

          <style>{`
            nav:hover .nav-gradient-border {
              opacity: 0.1;
              animation: gradient-shift 3s ease infinite;
            }

            @keyframes gradient-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

// Hero with Scroll-Based Zoom Effect
const Hero = ({ onExploreClick, theme }: { onExploreClick: () => void; theme: Theme }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      canvasRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll-based zoom effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Calculate progress from 0 to 1 over first viewport height
      const progress = Math.min(scrollY / viewportHeight, 1);
      setScrollProgress(progress);
    };

    handleScroll(); // Initialize
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate transform values based on scroll progress
  const scale = 1 + scrollProgress * 6; // Scale from 1 to 7
  const opacity = 1 - scrollProgress; // Fade from 1 to 0
  const subtitleOpacity = 1 - scrollProgress * 1.5; // Fade out faster
  const scrollIndicatorOpacity = 1 - scrollProgress * 3; // Fade out immediately
  const particleOpacity = 1 - scrollProgress * 0.7; // Particles fade but not completely
  const blur = scrollProgress * 10; // Optional blur effect

  return (
    <section
      ref={heroRef}
      style={{
        position: 'sticky',
        top: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#fff' : '#000',
        textAlign: 'center',
        overflow: 'hidden',
        pointerEvents: scrollProgress > 0.9 ? 'none' : 'auto',
        background: theme === 'dark' ? '#000' : '#fff',
        transition: 'background 0.5s ease, color 0.5s ease',
      }}
    >
      {/* Three.js Background with Zoom Effect */}
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: particleOpacity,
          transform: `scale(${1 + scrollProgress * 2})`, // Zoom particles at different rate
        }}
      >
        <Canvas camera={{ position: [0, 0, 1] }}>
          <ParticleField />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
            : 'radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.8) 100%)',
          zIndex: 1,
          opacity: 1 - scrollProgress * 0.5,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Content with Zoom Transform */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '0 2rem',
          transform: `scale(${scale})`,
          opacity: opacity,
          filter: `blur(${blur}px)`,
          transformOrigin: 'center center',
          willChange: 'transform, opacity',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#3b82f6',
            marginBottom: '1.5rem',
            opacity: subtitleOpacity,
          }}
        >
          AI-Powered Urban Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.33, 1, 0.68, 1] }}
          style={{
            fontSize: 'clamp(3rem, 10vw, 8rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            marginBottom: '2rem',
            lineHeight: 1,
            transition: 'color 0.5s ease',
          }}
        >
          ORION
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: theme === 'dark' ? '#a0a0a0' : '#666',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            fontWeight: 300,
            opacity: subtitleOpacity,
            transition: 'color 0.5s ease',
          }}
        >
          Predicting Urban Movement Before It Happens
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExploreClick}
          style={{
            padding: '1rem 3rem',
            fontSize: '1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
            border: 'none',
            borderRadius: '9999px',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
            opacity: subtitleOpacity,
          }}
        >
          Explore Platform
        </motion.button>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: scrollIndicatorOpacity,
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              width: '24px',
              height: '40px',
              border: theme === 'dark' ? '2px solid #666' : '2px solid #ccc',
              borderRadius: '9999px',
              position: 'relative',
              transition: 'border-color 0.5s ease',
            }}
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                width: '4px',
                height: '8px',
                background: '#3b82f6',
                borderRadius: '9999px',
                position: 'absolute',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const LoginSection = ({ theme }: { theme: Theme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login submitted:', { username, password });
    // Handle login logic here
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign In clicked');
    // Handle Google sign-in logic here
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.section
      id="login"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        zIndex: 10,
        background: theme === 'dark' ? '#000' : '#fff',
        transition: 'background 0.5s ease',
      }}
    >
      {/* Left Half - Branding */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          minHeight: '100vh',
        }}
        className="login-left"
      >
        <motion.div
          variants={itemVariants}
          style={{
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ORION
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              fontWeight: 300,
              color: theme === 'dark' ? '#a0a0a0' : '#666',
              marginTop: '1rem',
              letterSpacing: '0.05em',
              transition: 'color 0.5s ease',
            }}
          >
            From Forecasts to Flow
          </p>
        </motion.div>
      </div>

      {/* Right Half - Login Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          minHeight: '100vh',
        }}
        className="login-right"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ 
            scale: 1.02,
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
          }}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%',
            maxWidth: '450px',
            padding: '3rem 2.5rem',
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
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.5s ease',
          }}
        >
          {/* Animated gradient border on hover */}
          <div
            className="login-gradient-border"
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: 'linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1, #0ea5e9)',
              backgroundSize: '300% 100%',
              borderRadius: '1.5rem',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />

          <motion.h2
            variants={itemVariants}
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: theme === 'dark' ? 'white' : '#1a1a1a',
              marginBottom: '2rem',
              textAlign: 'center',
              transition: 'color 0.5s ease',
            }}
          >
            Welcome Back
          </motion.h2>

          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: theme === 'dark' ? '#a0a0a0' : '#666',
                  marginBottom: '0.5rem',
                  transition: 'color 0.5s ease',
                }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  border: theme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.5rem',
                  color: theme === 'dark' ? 'white' : '#1a1a1a',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              />
            </motion.div>

            {/* Password Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: theme === 'dark' ? '#a0a0a0' : '#666',
                  marginBottom: '0.5rem',
                  transition: 'color 0.5s ease',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  border: theme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.5rem',
                  color: theme === 'dark' ? 'white' : '#1a1a1a',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              />
            </motion.div>

            {/* Login Button */}
            <motion.button
              variants={itemVariants}
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                transition: 'filter 0.2s ease',
                marginBottom: '1.5rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Sign In
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
            }}
          >
            <div style={{ 
              flex: 1, 
              height: '1px', 
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              transition: 'background 0.5s ease'
            }} />
            <span style={{ 
              padding: '0 1rem', 
              color: '#666', 
              fontSize: '0.875rem',
              transition: 'color 0.5s ease'
            }}>OR</span>
            <div style={{ 
              flex: 1, 
              height: '1px', 
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              transition: 'background 0.5s ease'
            }} />
          </motion.div>

          {/* Google Sign In Button */}
          <motion.button
            variants={itemVariants}
            type="button"
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '0.5rem',
              color: '#1a1a1a',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </motion.button>

          {/* Sign Up Link */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
            }}
          >
            <span style={{
              fontSize: '0.875rem',
              color: theme === 'dark' ? '#a0a0a0' : '#666',
              transition: 'color 0.5s ease'
            }}>
              Don't have an account?{' '}
            </span>
            <Link
              to="/signup"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0ea5e9';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Sign up
            </Link>
          </motion.div>

          <style>{`
            .login-gradient-border {
              animation: gradient-shift 3s ease infinite;
            }

            motion-div:hover .login-gradient-border {
              opacity: 1 !important;
            }

            @keyframes gradient-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </motion.div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .login-left,
          .login-right {
            min-height: 50vh !important;
          }

          section {
            flex-direction: column !important;
          }
        }
      `}</style>
    </motion.section>
  );
};

const Footer = ({ theme }: { theme: Theme }) => {
  return (
    <footer style={{
      background: theme === 'dark' ? '#000' : '#fff',
      borderTop: theme === 'dark' 
        ? '1px solid rgba(255, 255, 255, 0.05)'
        : '1px solid rgba(0, 0, 0, 0.05)',
      padding: '3rem 2rem',
      color: theme === 'dark' ? '#fff' : '#1a1a1a',
      transition: 'all 0.5s ease',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          marginBottom: '0.5rem'
        }}>
          ORION
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#666',
          marginBottom: '2rem',
          transition: 'color 0.5s ease'
        }}>
          AI-Powered Urban Traffic Intelligence
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#666',
          transition: 'color 0.5s ease'
        }}>
          © 2026 ORION. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

function App() {
  const [showNav, setShowNav] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const lenisRef = useRef<Lenis | null>(null);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Initialize smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Handle nav visibility based on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY < 50);
    };

    handleScroll(); // Initialize
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to login section
  const handleExploreClick = () => {
    const loginElement = document.getElementById('login');
    if (loginElement && lenisRef.current) {
      lenisRef.current.scrollTo(loginElement, {
        duration: 1.5,
        offset: 0,
      });
    } else if (loginElement) {
      // Fallback to native smooth scroll
      loginElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ 
      background: theme === 'dark' ? '#000' : '#fff',
      transition: 'background 0.5s ease'
    }}>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <NavigationBar showNav={showNav} onNavigate={handleExploreClick} theme={theme} />
      <Hero onExploreClick={handleExploreClick} theme={theme} />
      {/* Spacer to enable scrolling through zoom effect */}
      <div style={{ height: '100vh' }} />
      <LoginSection theme={theme} />
      <Footer theme={theme} />
    </div>
  );
}

export default App;
