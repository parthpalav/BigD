import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Lenis from 'lenis';
import { useTheme } from '../hooks/useTheme';

// Theme type
type Theme = 'light' | 'dark';

// Three.js Particle Field Component
const ParticleField = () => {
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
    </>
  );
};

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

const SignupPage = () => {
  const { theme, toggleTheme } = useTheme(); // Use theme from context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Initialize smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup submitted:', formData);
    // Handle signup logic here (backend implementation)
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.08
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
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#000' : '#fff',
      transition: 'background 0.5s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      {/* Three.js Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 0.5,
        }}
      >
        <Canvas camera={{ position: [0, 0, 1] }}>
          <ParticleField />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
      </div>

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
            : 'radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.8) 100%)',
          zIndex: 1,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Signup Form Container */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
        }}
      >
        <motion.div
          variants={itemVariants}
          style={{
            width: '100%',
            maxWidth: '600px',
            padding: '3rem 3rem',
            background: theme === 'dark' 
              ? 'rgba(20, 20, 20, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
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

          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ORION
            </h1>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: theme === 'dark' ? 'white' : '#1a1a1a',
                marginBottom: '0.5rem',
                transition: 'color 0.5s ease',
              }}
            >
              Create Account
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: theme === 'dark' ? '#a0a0a0' : '#666',
                transition: 'color 0.5s ease',
              }}
            >
              Join the future of urban traffic intelligence
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            {/* Name Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="name"
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
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
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

            {/* Email Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="email"
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
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john.doe@example.com"
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

            {/* Phone Number Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="phone"
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
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+1 (555) 123-4567"
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

            {/* Country and City - Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Country Input */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="country"
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
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  placeholder="United States"
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

              {/* City Input */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="city"
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
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="New York"
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
            </div>

            {/* Address Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="address"
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
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="123 Main Street, Apt 4B"
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
            <motion.div variants={itemVariants} style={{ marginBottom: '1.25rem' }}>
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
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

            {/* Confirm Password Input */}
            <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
              <label
                htmlFor="confirmPassword"
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
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
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

            {/* Sign Up Button */}
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
              Create Account
            </motion.button>
          </form>

          {/* Sign In Link */}
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
            }}
          >
            <span style={{
              fontSize: '0.875rem',
              color: theme === 'dark' ? '#a0a0a0' : '#666',
              transition: 'color 0.5s ease'
            }}>
              Already have an account?{' '}
            </span>
            <Link
              to="/"
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
              Sign in
            </Link>
          </motion.div>

          <style>{`
            @media (max-width: 768px) {
              form > div {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
