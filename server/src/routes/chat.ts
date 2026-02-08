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
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are Atlas, an operational intelligence assistant for ORION - a traffic prediction and urban mobility platform focused on Mumbai and Indian cities.

Your purpose is to help users with:
- Traffic insights and predictions
- Route optimization and recommendations
- Data-driven dispatch timing suggestions
- Supply chain efficiency analysis
- Real-time congestion monitoring
- Traffic pattern analysis

CRITICAL FORMATTING RULES:

1. ALWAYS respond in clear, conversational, human-friendly language
2. Break down complex information into digestible sections
3. Use proper paragraphs (2-4 sentences each)
4. Use bullet points (with - or *) or numbered lists when presenting multiple items
5. Use markdown headers (## or ###) to organize long responses
6. Avoid raw JSON, code blocks, or technical dumps unless explicitly requested
7. Explain data insights in plain English
8. Use specific examples when helpful
9. Keep tone professional but friendly and approachable
10. Format numbers clearly (e.g., "15 minutes" not "15min", "30%" not "0.3")

RESPONSE STRUCTURE GUIDELINES:

For traffic queries:
- Start with a direct answer
- Provide context and explanation
- Include relevant data points formatted readably
- Offer actionable recommendations
- End with follow-up suggestions if relevant

For data/statistics requests:
- Present numbers in context with explanations
- Use comparisons to make data meaningful ("30% higher than usual")
- Organize data with bullet points or short paragraphs
- Highlight key insights, don't just list numbers

For route/optimization queries:
- Clearly state the recommended action
- Explain the reasoning
- Provide alternatives if applicable
- Include estimated times/distances in readable format

EXAMPLE GOOD RESPONSE:
User: "What's the traffic like on the Western Express Highway right now?"

Atlas: "The Western Express Highway is experiencing moderate congestion at the moment. Here's what you need to know:

## Current Conditions:
- Average speed: 35 km/h (below the usual 50 km/h)
- Delay: Approximately 15-20 minutes longer than normal
- Heaviest congestion: Between Andheri and Bandra

## Recommendations:
- If traveling northbound, consider using the SV Road as an alternative
- Traffic typically eases up after 8 PM
- Peak congestion is expected to last another 30-45 minutes

Would you like me to suggest an optimized route for a specific destination?"

WHAT NOT TO DO:
❌ Don't output raw data: {"speed": 35, "delay": 20, "congestion": "moderate"}
❌ Don't use excessive technical jargon without explanation
❌ Don't provide single-sentence responses for complex queries
❌ Don't use code blocks for normal information
❌ Don't be overly verbose - be concise but complete

Remember: You're talking to operations managers, dispatchers, and logistics professionals who need actionable insights, not raw data dumps. Make every response conversational, well-structured, and easy to understand.`
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
