import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../hooks/useTheme';
import LogoutButton from '../components/LogoutButton';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/assistant.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Assistant: React.FC = () => {
  const { theme } = useTheme();
  const [showNav, setShowNav] = useState(true);
  const [currentSection, setCurrentSection] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Traffic Map', path: '/mapview' },
    { name: 'Assistant', path: '/assistant' },
    { name: 'News', path: '/news' },
    { name: 'About', path: '/about' },
  ];

  const suggestedPrompts = [
    "Show me current traffic congestion",
    "Optimize route for delivery",
    "Predict traffic for next hour",
    "Analyze supply chain efficiency",
  ];

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const section3Top = section3Ref.current?.offsetTop || 0;
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      if (scrollPosition >= section3Top) {
        setCurrentSection(3);
        setShowNav(true);
      } else if (window.scrollY > window.innerHeight * 0.5) {
        setCurrentSection(2);
        setShowNav(true);
      } else {
        setCurrentSection(1);
        setShowNav(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const scrollToSection3 = () => {
    section3Ref.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 800);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await axios.post(`${API_URL}/chat`, {
        message: currentInput
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.reply || 'I received your message but couldn\'t generate a response.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        minHeight: currentSection === 3 ? '100vh' : '300vh',
        background: theme === 'dark' ? '#000' : '#fff',
        color: theme === 'dark' ? '#fff' : '#000',
        transition: 'background 0.5s ease, color 0.5s ease',
        position: 'relative',
      }}
    >
      {/* Navigation Bar */}
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
        )}
      </AnimatePresence>

      {/* Top Right Controls - Hamburger Menu & Logout Button */}
      <div
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <HamburgerMenu style={{ position: 'static', top: 'auto', left: 'auto' }} />
        <LogoutButton style={{ position: 'static', top: 'auto', right: 'auto' }} />
      </div>

      {/* SECTION 1: Hero/Landing */}
      <section
        ref={section1Ref}
        style={{
          height: '100vh',
          display: currentSection === 3 ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{
            fontSize: 'clamp(4rem, 12vw, 10rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            color: theme === 'dark' ? '#fff' : '#000',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1em' }}>
            A
            <svg width="0.8em" height="0.8em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M57.043 24.593C54.027 17.379 44.758 8.687 44.758 8.687s2.994 7.435.826 17.266l3.51-3.038s3.342 1.434 3.717 4.958c.467 4.355-2.029 10.567-2.029 10.567s-5.506-1.738-13.92-1.617l-3.01-19.583l7.154 4.69L32 2l-9.009 19.93l7.157-4.69l-3.01 19.583c-8.416-.121-13.922 1.617-13.922 1.617s-2.494-6.212-2.028-10.567c.375-3.524 3.715-4.958 3.715-4.958l3.511 3.038c-2.168-9.832.826-17.266.826-17.266S9.97 17.379 6.955 24.593C3.858 32 2 40.818 2 40.818l6.399 5.914s5.649-1.664 9.963-1.998c4.129-.318 8.93-.398 8.93-.398l-.618 8.711L32 62l5.326-8.953l-.621-8.711s4.801.08 8.93.398c4.314.334 9.963 1.998 9.963 1.998L62 40.818S60.141 32 57.043 24.593" fill="currentColor"></path>
            </svg>
            LAS
          </span>
        </motion.h1>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#666',
            fontSize: '2rem',
          }}
        >
          ↓
        </motion.div>
      </section>

      {/* SECTION 2: Description */}
      <section
        ref={section2Ref}
        style={{
          minHeight: '100vh',
          display: currentSection === 3 ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            fontWeight: 300,
            color: theme === 'dark' ? '#a0a0a0' : '#666',
            lineHeight: 1.8,
            maxWidth: '800px',
            textAlign: 'center',
            margin: '0 auto 3rem',
          }}
        >
          Your operational intelligence assistant. Ask questions, explore traffic insights, and get data-driven recommendations to optimize routing, dispatch timing, and supply chain efficiency.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToSection3}
          style={{
            padding: '1rem 3rem',
            fontSize: '1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
            border: 'none',
            borderRadius: '9999px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
          }}
        >
          Ask
        </motion.button>
      </section>

      {/* SECTION 3: Chat Interface */}
      <section
        ref={section3Ref}
        style={{
          minHeight: '100vh',
          maxHeight: '100vh',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Atlas Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: currentSection === 3 ? 1 : 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => section1Ref.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            position: 'fixed',
            top: '2rem',
            left: '2rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            zIndex: 100,
            cursor: 'pointer',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000';
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.05em' }}>
            A
            <svg width="0.8em" height="0.8em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M57.043 24.593C54.027 17.379 44.758 8.687 44.758 8.687s2.994 7.435.826 17.266l3.51-3.038s3.342 1.434 3.717 4.958c.467 4.355-2.029 10.567-2.029 10.567s-5.506-1.738-13.92-1.617l-3.01-19.583l7.154 4.69L32 2l-9.009 19.93l7.157-4.69l-3.01 19.583c-8.416-.121-13.922 1.617-13.922 1.617s-2.494-6.212-2.028-10.567c.375-3.524 3.715-4.958 3.715-4.958l3.511 3.038c-2.168-9.832.826-17.266.826-17.266S9.97 17.379 6.955 24.593C3.858 32 2 40.818 2 40.818l6.399 5.914s5.649-1.664 9.963-1.998c4.129-.318 8.93-.398 8.93-.398l-.618 8.711L32 62l5.326-8.953l-.621-8.711s4.801.08 8.93.398c4.314.334 9.963 1.998 9.963 1.998L62 40.818S60.141 32 57.043 24.593" fill="currentColor"></path>
            </svg>
            LAS
          </span>
        </motion.div>

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: messages.length === 0 ? 'center' : 'flex-start',
            paddingTop: messages.length > 0 ? '6rem' : '0',
          }}
        >
          {/* Chat Messages */}
          {messages.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '2rem' }}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    className={message.role === 'assistant' ? 'atlas-message' : ''}
                    style={{
                      maxWidth: '70%',
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      background: message.role === 'user'
                        ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                        : theme === 'dark' ? '#1a1a1a' : '#f9fafb',
                      color: message.role === 'user' ? '#fff' : theme === 'dark' ? '#fff' : '#000',
                      ...(message.role === 'user' 
                        ? { borderBottomRightRadius: '0.25rem' }
                        : { borderBottomLeftRadius: '0.25rem' }
                      ),
                    }}
                  >
                    {message.role === 'assistant' && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.05em' }}>
                        A
                        <svg width="0.8em" height="0.8em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                          <path d="M57.043 24.593C54.027 17.379 44.758 8.687 44.758 8.687s2.994 7.435.826 17.266l3.51-3.038s3.342 1.434 3.717 4.958c.467 4.355-2.029 10.567-2.029 10.567s-5.506-1.738-13.92-1.617l-3.01-19.583l7.154 4.69L32 2l-9.009 19.93l7.157-4.69l-3.01 19.583c-8.416-.121-13.922 1.617-13.922 1.617s-2.494-6.212-2.028-10.567c.375-3.524 3.715-4.958 3.715-4.958l3.511 3.038c-2.168-9.832.826-17.266.826-17.266S9.97 17.379 6.955 24.593C3.858 32 2 40.818 2 40.818l6.399 5.914s5.649-1.664 9.963-1.998c4.129-.318 8.93-.398 8.93-.398l-.618 8.711L32 62l5.326-8.953l-.621-8.711s4.801.08 8.93.398c4.314.334 9.963 1.998 9.963 1.998L62 40.818S60.141 32 57.043 24.593" fill="currentColor"></path>
                        </svg>
                        LAS
                      </div>
                    )}
                    {message.role === 'assistant' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p style={{ marginBottom: '1rem', lineHeight: '1.7' }} {...props} />,
                          h2: ({node, ...props}) => <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                          h3: ({node, ...props}) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '1.25rem', marginBottom: '0.5rem' }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />,
                          ol: ({node, ...props}) => <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                          li: ({node, ...props}) => <li style={{ marginBottom: '0.5rem', lineHeight: '1.6' }} {...props} />,
                          strong: ({node, ...props}) => <strong style={{ fontWeight: 600, color: '#3b82f6' }} {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? (
                              <code style={{ 
                                background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                                padding: '0.125rem 0.375rem', 
                                borderRadius: '0.25rem',
                                fontSize: '0.9em',
                                fontFamily: 'monospace'
                              }} {...props} />
                            ) : (
                              <code style={{ 
                                display: 'block',
                                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                                padding: '1rem', 
                                borderRadius: '0.5rem',
                                fontSize: '0.9em',
                                fontFamily: 'monospace',
                                overflowX: 'auto'
                              }} {...props} />
                            ),
                          blockquote: ({node, ...props}) => <blockquote style={{ 
                            borderLeft: '4px solid #3b82f6', 
                            paddingLeft: '1rem', 
                            marginLeft: '0',
                            marginBottom: '1rem',
                            fontStyle: 'italic',
                            opacity: 0.9
                          }} {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      background: theme === 'dark' ? '#1a1a1a' : '#f9fafb',
                      color: theme === 'dark' ? '#fff' : '#000',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.05em' }}>
                      A
                      <svg width="0.8em" height="0.8em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M57.043 24.593C54.027 17.379 44.758 8.687 44.758 8.687s2.994 7.435.826 17.266l3.51-3.038s3.342 1.434 3.717 4.958c.467 4.355-2.029 10.567-2.029 10.567s-5.506-1.738-13.92-1.617l-3.01-19.583l7.154 4.69L32 2l-9.009 19.93l7.157-4.69l-3.01 19.583c-8.416-.121-13.922 1.617-13.922 1.617s-2.494-6.212-2.028-10.567c.375-3.524 3.715-4.958 3.715-4.958l3.511 3.038c-2.168-9.832.826-17.266.826-17.266S9.97 17.379 6.955 24.593C3.858 32 2 40.818 2 40.818l6.399 5.914s5.649-1.664 9.963-1.998c4.129-.318 8.93-.398 8.93-.398l-.618 8.711L32 62l5.326-8.953l-.621-8.711s4.801.08 8.93.398c4.314.334 9.963 1.998 9.963 1.998L62 40.818S60.141 32 57.043 24.593" fill="currentColor"></path>
                      </svg>
                      LAS
                    </div>
                    Thinking...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          <div style={{ 
            flexShrink: 0,
            paddingBottom: '2rem',
          }}>
            <div
              style={{
                background: theme === 'dark' ? '#141414' : '#f9fafb',
                border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '1.5rem',
                padding: '1.5rem',
                position: 'relative',
              }}
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Atlas anything..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  fontSize: '1.125rem',
                  color: theme === 'dark' ? '#fff' : '#000',
                  fontFamily: 'inherit',
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: inputValue.trim()
                      ? 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)'
                      : '#666',
                    border: 'none',
                    borderRadius: '9999px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Send
                </motion.button>
              </div>
            </div>

            {/* Suggested Prompts */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  justifyContent: 'center',
                }}
              >
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Assistant;
