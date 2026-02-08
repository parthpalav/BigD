import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';

const router = Router();

// Featherless API configuration
const FEATHERLESS_API_URL = 'https://api.featherless.ai/v1/chat/completions';
const FEATHERLESS_MODEL = 'deepseek-ai/DeepSeek-V3-0324';

// Validation middleware for chat message
const chatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
];

/**
 * @route   POST /api/chat
 * @desc    Send message to AI chatbot and get response
 * @access  Public
 */
router.post('/', chatValidation, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: errors.array()
      });
    }

    const { message } = req.body;

    // Verify API key is configured
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      console.error('❌ FEATHERLESS_API_KEY is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'AI service is not properly configured. Please contact support.'
      });
    }

    // Call Featherless AI API
    console.log('🤖 Sending message to AI:', message.substring(0, 50) + '...');
    
    const aiResponse = await axios.post(
      FEATHERLESS_API_URL,
      {
        model: FEATHERLESS_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are ORION Atlas, an industrial traffic and logistics intelligence assistant for India. You help users understand traffic patterns, optimize routes, and provide insights about logistics and supply chain operations across Indian cities. Be helpful, concise, and data-driven in your responses.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Extract AI response
    const reply = aiResponse.data?.choices?.[0]?.message?.content;
    
    if (!reply) {
      console.error('❌ No response content from AI');
      return res.status(500).json({
        success: false,
        message: 'AI service returned an invalid response'
      });
    }

    console.log('✅ AI response received');
    
    // Return successful response
    res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error: any) {
    console.error('❌ Chat API error:', error.message);

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API returned an error response
        console.error('API Error Response:', error.response.data);
        return res.status(500).json({
          success: false,
          message: 'AI service error. Please try again later.',
          error: process.env.NODE_ENV === 'development' 
            ? error.response.data 
            : undefined
        });
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response from AI service');
        return res.status(503).json({
          success: false,
          message: 'AI service is temporarily unavailable. Please try again.'
        });
      }
    }

    // Generic error handler
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : undefined
    });
  }
});

export default router;
