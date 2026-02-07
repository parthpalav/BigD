import React from 'react';
import { motion } from 'framer-motion';

interface ScrollSectionsProps {
  theme: 'light' | 'dark';
}

export const ScrollSections: React.FC<ScrollSectionsProps> = ({ theme }) => {
  const sections = [
    {
      title: 'The Vision',
      subtitle: 'Urban traffic intelligence reimagined',
      description: 'ORION transforms chaotic city traffic into a symphony of efficiency through real-time AI analysis and predictive optimization.',
    },
    {
      title: 'Commercial Intelligence',
      subtitle: 'Fleet optimization at scale',
      description: 'Reduce delivery times by 40%. Cut fuel costs dramatically. Real-time route optimization that learns from every journey.',
    },
    {
      title: 'Private Navigation',
      subtitle: 'Your personal traffic advisor',
      description: 'Never sit in traffic again. AI-powered predictions that route you around congestion before it forms.',
    },
    {
      title: 'Deep Learning Core',
      subtitle: 'Intelligence that evolves',
      description: 'Neural networks trained on billions of data points. Pattern recognition that predicts traffic 30 minutes ahead with 95% accuracy.',
    },
    {
      title: 'Mission Forward',
      subtitle: 'Building smarter cities',
      description: 'Join the transportation revolution. Welcome to the future of urban mobility.',
    },
  ];

  return (
    <div className="pointer-events-none">
      {sections.map((section, index) => (
        <div
          key={index}
          className="h-screen flex items-center justify-start px-8 md:px-16 lg:px-24"
        >
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.5, once: false }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <motion.p
              className={`text-sm md:text-base font-medium mb-4 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.5, once: false }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {section.subtitle}
            </motion.p>
            
            <motion.h2
              className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.5, once: false }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {section.title}
            </motion.h2>
            
            <motion.p
              className={`text-lg md:text-xl lg:text-2xl leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.5, once: false }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {section.description}
            </motion.p>
          </motion.div>
        </div>
      ))}
    </div>
  );
};
