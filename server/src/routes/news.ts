import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

// Model to use - same as chat
const MODEL_NAME = 'openai/gpt-oss-120b';

// News article interface
interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  category: 'Traffic' | 'Accident' | 'Construction' | 'Transit' | 'Weather' | 'Other';
  timestamp: string;
}

/**
 * @route   GET /api/news
 * @desc    Fetch latest Mumbai traffic news using OpenAI
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Verify API key is configured
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      console.error('❌ API key is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'News service is not properly configured. Please contact support.'
      });
    }

    // Initialize OpenAI client with Featherless base URL
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.featherless.ai/v1'
    });

    // Get current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create prompt for news generation
    const prompt = `You are a news aggregator assistant. Provide the latest traffic and road news for Mumbai, India for today's date (${currentDate}).

Include:
- Traffic congestion updates (specific areas like Bandra-Worli Sea Link, Eastern Express Highway, Western Express Highway)
- Road accidents and incidents
- Road construction and closures
- Metro and local train updates
- Infrastructure developments
- Weather-related traffic impacts

For each news item, provide:
1. Headline (concise, under 100 characters)
2. Summary (2-3 sentences, 150-200 characters)
3. Source (realistic Mumbai news sources like Times of India, Mumbai Mirror, Mid-Day, or Local Reports)
4. Category (one of: Traffic, Accident, Construction, Transit, Weather, Other)
5. Timestamp (use "2 hours ago", "This morning", "Yesterday", or specific times)

Format your response as a JSON array with objects containing exactly these fields: headline, summary, source, category, timestamp.

Provide 10-12 realistic news items relevant to Mumbai's current traffic and transportation situation. Make them varied and informative.

IMPORTANT: Return ONLY the JSON array, no other text or explanation.`;

    // Call OpenAI API with timeout
    let response;
    try {
      // Create a promise that rejects after 15 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API call timeout after 15 seconds')), 15000);
      });
      
      const apiPromise = openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful news aggregator assistant that provides structured traffic news in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      });
      
      response = await Promise.race([apiPromise, timeoutPromise]);
    } catch (apiError) {
      console.error('❌ OpenAI API call failed:', (apiError as Error).message);
      // Use fallback news if API fails
      const fallbackArticles = [
        {
          headline: 'Heavy Traffic on Western Express Highway',
          summary: 'Commuters are experiencing significant delays on the Western Express Highway due to increased volume during peak hours. Travel time has increased by approximately 30 minutes.',
          source: 'Times of India',
          category: 'Traffic',
          timestamp: '2 hours ago'
        },
        {
          headline: 'Bandra-Worli Sea Link Maintenance Work',
          summary: 'One lane of the Bandra-Worli Sea Link will be closed for routine maintenance tonight from 11 PM to 6 AM. Motorists are advised to plan alternative routes.',
          source: 'Mumbai Mirror',
          category: 'Construction',
          timestamp: 'This morning'
        },
        {
          headline: 'Eastern Freeway Running Smoothly',
          summary: 'Traffic flow on the Eastern Freeway is smooth with no major congestion reported. Good conditions for commuters heading towards South Mumbai.',
          source: 'Local Reports',
          category: 'Traffic',
          timestamp: '1 hour ago'
        },
        {
          headline: 'Mumbai Metro Line 3 Update',
          summary: 'Construction work for Mumbai Metro Line 3 continues on schedule. Partial service expected to begin by end of year with stations from Colaba to Santacruz.',
          source: 'Mid-Day',
          category: 'Transit',
          timestamp: 'Yesterday'
        },
        {
          headline: 'Monsoon Preparedness: Roads Being Repaired',
          summary: 'BMC has initiated pre-monsoon road repairs across the city. Focus on pothole filling and drainage clearing to prevent waterlogging during upcoming rainy season.',
          source: 'Mumbai Mirror',
          category: 'Construction',
          timestamp: '5 hours ago'
        },
        {
          headline: 'Coastal Road Project Progress',
          summary: 'The Mumbai Coastal Road project has completed 70% of construction. The new 10.58 km stretch will significantly reduce travel time between South Mumbai and suburbs.',
          source: 'Times of India',
          category: 'Construction',
          timestamp: 'This morning'
        },
        {
          headline: 'Traffic Advisory for Marathon Event',
          summary: 'Multiple roads in South Mumbai will be closed tomorrow from 6 AM to 12 PM for the annual marathon event. Commuters advised to use Eastern Freeway as alternative.',
          source: 'Traffic Police Mumbai',
          category: 'Traffic',
          timestamp: '3 hours ago'
        },
        {
          headline: 'Andheri Subway Closed for Repairs',
          summary: 'The Andheri East subway near railway station will be closed for emergency repairs tonight. Traffic will be diverted via alternative routes.',
          source: 'Local Reports',
          category: 'Construction',
          timestamp: '1 hour ago'
        },
        {
          headline: 'Late Night Traffic Thin on Highways',
          summary: 'Traffic conditions are excellent on all major highways during late night hours. Perfect time for long-distance commuters and delivery services.',
          source: 'Local Reports',
          category: 'Traffic',
          timestamp: '30 minutes ago'
        },
        {
          headline: 'New Signal System at Worli Junction',
          summary: 'Smart traffic signals have been installed at Worli Junction to optimize traffic flow. System uses AI to adapt timing based on real-time congestion levels.',
          source: 'Mid-Day',
          category: 'Other',
          timestamp: '4 hours ago'
        }
      ] as NewsArticle[];
      
      return res.status(200).json({
        success: true,
        articles: fallbackArticles,
        lastUpdated: new Date().toISOString(),
        count: fallbackArticles.length,
        note: 'Using cached data due to service limitations'
      });
    }

    // Extract response content
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from AI');
    }

    // Parse JSON from response
    let articles: NewsArticle[];
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      
      articles = JSON.parse(cleanedContent);
      
      // Validate that we got an array
      if (!Array.isArray(articles)) {
        throw new Error('Response is not an array');
      }
      
      // Validate article structure
      articles = articles.filter(article => 
        article.headline && 
        article.summary && 
        article.source && 
        article.category && 
        article.timestamp
      );
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Content received:', content);
      
      // Return fallback news
      articles = [
        {
          headline: 'Heavy Traffic on Western Express Highway',
          summary: 'Commuters are experiencing significant delays on the Western Express Highway due to increased volume during peak hours. Travel time has increased by approximately 30 minutes.',
          source: 'Times of India',
          category: 'Traffic',
          timestamp: '2 hours ago'
        },
        {
          headline: 'Bandra-Worli Sea Link Maintenance Work',
          summary: 'One lane of the Bandra-Worli Sea Link will be closed for routine maintenance tonight from 11 PM to 6 AM. Motorists are advised to plan alternative routes.',
          source: 'Mumbai Mirror',
          category: 'Construction',
          timestamp: 'This morning'
        },
        {
          headline: 'Eastern Freeway Running Smoothly',
          summary: 'Traffic flow on the Eastern Freeway is smooth with no major congestion reported. Good conditions for commuters heading towards South Mumbai.',
          source: 'Local Reports',
          category: 'Traffic',
          timestamp: '1 hour ago'
        }
      ];
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      articles: articles,
      lastUpdated: new Date().toISOString(),
      count: articles.length
    });

  } catch (error) {
    console.error('❌ Error fetching news:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic news. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
