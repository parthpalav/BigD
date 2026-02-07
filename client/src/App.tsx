import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Lenis from 'lenis';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import './index.css';

// Theme type
type Theme = 'light' | 'dark';

// Extend Window type for Google Sign-In
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

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
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Map', path: '/map' },
    { name: 'About', path: '/about' },
  ];

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
                <motion.li key={link.name}>
                  <Link to={link.path}>
                    <motion.span
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
                      {link.name}
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
                    </motion.span>
                  </Link>
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
        {/* <motion.div
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
        </motion.div> */}
      </div>
    </section>
  );
};

const LoginSection = ({ theme }: { theme: Theme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.error('Google Client ID not found in environment variables');
        return;
      }

      if (window.google && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
          });

          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: theme === 'dark' ? 'filled_black' : 'outline',
              size: 'large',
              width: googleButtonRef.current.offsetWidth,
              text: 'signin_with',
            }
          );
        } catch (err) {
          console.error('Failed to initialize Google Sign-In:', err);
          setError('Google Sign-In initialization failed');
        }
      }
    };

    // Wait for Google script to load
    const checkGoogle = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogle);
        initializeGoogle();
      }
    }, 100);

    // Clear interval after 10 seconds if Google script doesn't load
    setTimeout(() => clearInterval(checkGoogle), 10000);

    return () => clearInterval(checkGoogle);
  }, [theme]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError('');
      await loginWithGoogle(response.credential);
      navigate('/map');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/map');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign In clicked');
    // The actual sign-in is handled by the Google button
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
            {user ? `Welcome, ${user.fullName || user.email}!` : 'Welcome Back'}
          </motion.h2>

          {/* Show user info if logged in */}
          {user ? (
            <motion.div
              variants={itemVariants}
              style={{
                textAlign: 'center',
                padding: '2rem',
                background: theme === 'dark' 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(59, 130, 246, 0.05)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <p style={{ 
                color: theme === 'dark' ? '#a0a0a0' : '#666',
                marginBottom: '1rem' 
              }}>
                You are signed in as {user.email}
              </p>
              {user.profilePicture && (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    margin: '0 auto',
                  }}
                />
              )}
            </motion.div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </motion.div>
              )}

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
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                background: isLoading 
                  ? 'rgba(59, 130, 246, 0.5)'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                transition: 'filter 0.2s ease',
                marginBottom: '1.5rem',
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
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
          <motion.div
            variants={itemVariants}
            ref={googleButtonRef}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          />

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
          </>
          )}

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
  const { theme, toggleTheme } = useTheme(); // Use theme from context
  const lenisRef = useRef<Lenis | null>(null);

  // Remove local theme state management - it's now in context
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
