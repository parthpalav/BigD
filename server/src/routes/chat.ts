import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';

const router = Router();

// OpenAI SDK configuration for Recursal
const MODEL_NAME = 'openai/gpt-oss-120b';

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
      console.error('❌ API key is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'AI service is not properly configured. Please contact support.'
      });
    }

    // Initialize OpenAI client with Featherless base URL
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.featherless.ai/v1'
    });

    console.log('🤖 Sending message to AI:', message.substring(0, 50) + '...');
    
    // Call OpenAI-compatible API
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      max_tokens: 4096,
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
    });

    // Extract AI response
    const reply = completion.choices[0]?.message?.content;
    
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

  } catch (error: unknown) {
    console.error('❌ Chat API error:', error instanceof Error ? error.message : 'Unknown error');

    // Handle OpenAI SDK errors
    if (error instanceof Error) {
      console.error('Error details:', error);
      return res.status(500).json({
        success: false,
        message: 'AI service error. Please try again later.',
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : undefined
      });
    }

    // Generic error handler
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      error: process.env.NODE_ENV === 'development' 
        ? 'Unknown error' 
        : undefined
    });
  }
});

export default router;
