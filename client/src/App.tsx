import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Lenis from 'lenis';
import './index.css';

// Three.js Particle Field Component
const ParticleField = () => {
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
    </>
  );
};

// Hero with Three.js background and Framer Motion animations
const Hero = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

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

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Three.js Background */}
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
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 2rem' }}>
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
            color: '#a0a0a0',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            fontWeight: 300,
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
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              width: '24px',
              height: '40px',
              border: '2px solid #666',
              borderRadius: '9999px',
              position: 'relative',
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

const Features = () => {
  const features = [
    {
      icon: '🗺️',
      title: 'Live Traffic Intelligence',
      description: 'Real-time congestion monitoring with AI-powered predictive forecasting'
    },
    {
      icon: '📊',
      title: 'AI-Powered Forecasting',
      description: 'Advanced time-series analysis combining multiple data sources'
    },
    {
      icon: '🌱',
      title: 'Reduced Emissions',
      description: 'Optimize traffic flow to minimize idle time and reduce carbon footprint'
    },
    {
      icon: '🚗',
      title: 'Smarter Routing',
      description: 'AI-powered route suggestions based on real-time predictions'
    },
  ];

  return (
    <section style={{
      minHeight: '100vh',
      padding: '8rem 2rem',
      background: '#0a0a0a',
      color: '#fff'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            textAlign: 'center',
            marginBottom: '4rem',
            fontWeight: 800
          }}
        >
          Transforming <span style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Urban Mobility</span>
        </motion.h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              style={{
                background: '#141414',
                padding: '2rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                marginBottom: '0.75rem',
                fontWeight: 700
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#a0a0a0',
                lineHeight: 1.6
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer style={{
      background: '#000',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '3rem 2rem',
      color: '#fff'
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
          marginBottom: '2rem'
        }}>
          AI-Powered Urban Traffic Intelligence
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#666'
        }}>
          © 2026 ORION. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

function App() {
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

  return (
    <div style={{ background: '#000' }}>
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}

export default App;
