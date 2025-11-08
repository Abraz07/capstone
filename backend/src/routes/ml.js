import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

// Health check for ML service connection
let mlServiceHealth = { connected: false, lastCheck: null, error: null };

// Check ML service health periodically
async function checkMLServiceHealth() {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
        mlServiceHealth = {
            connected: response.status === 200,
            lastCheck: new Date().toISOString(),
            error: null
        };
        return true;
    } catch (error) {
        mlServiceHealth = {
            connected: false,
            lastCheck: new Date().toISOString(),
            error: error.message
        };
        return false;
    }
}

// Check on startup and every 30 seconds
checkMLServiceHealth();
setInterval(checkMLServiceHealth, 30000);

// Health check endpoint
router.get('/health', async (req, res) => {
    const isHealthy = await checkMLServiceHealth();
    res.json({
        ml_service_url: ML_SERVICE_URL,
        connected: mlServiceHealth.connected,
        last_check: mlServiceHealth.lastCheck,
        error: mlServiceHealth.error
    });
});

/**
 * Get personalized Pomodoro recommendation
 */
router.post('/recommend-pomodoro', authenticate, async (req, res) => {
    try {
        const { task_priority = 'medium' } = req.body;
        const userId = req.userId;

        const response = await axios.post(`${ML_SERVICE_URL}/ml/recommend-pomodoro`, {
            user_id: userId,
            task_priority
        }, {
            timeout: 8000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('ML service error:', error.message);
        // Fallback to defaults
        res.json({
            success: true,
            data: {
                focus_minutes: 25,
                break_minutes: 5,
                confidence: 0,
                explanation: 'Using default Pomodoro timing (ML service unavailable)'
            }
        });
    }
});

/**
 * Analyze sentiment of text
 */
router.post('/sentiment', authenticate, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/ml/sentiment`, {
            text
        }, {
            timeout: 8000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Sentiment analysis error:', error.message);
        // Fallback to neutral sentiment
        res.json({
            success: true,
            data: {
                sentiment_score: 0,
                label: 'neutral'
            }
        });
    }
});

/**
 * Get AI coaching suggestions
 */
router.post('/coach', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { context } = req.body;

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        const responsePromise = axios.post(`${ML_SERVICE_URL}/ml/coach`, {
            user_id: userId,
            context: context || {}
        }, {
            timeout: 8000 // 8 second timeout
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Coach service error:', error.message);
        // Return helpful fallback instead of error
        res.json({
            success: true,
            data: {
                message: "I'm here to help! Based on your activity, try breaking tasks into smaller steps and taking regular breaks. Remember - progress over perfection! 💪",
                suggested_action: "Start a 25-minute Pomodoro"
            }
        });
    }
});

/**
 * Predict distraction probability
 */
router.post('/distraction-predict', authenticate, async (req, res) => {
    try {
        const { session_duration = 25 } = req.body;
        const userId = req.userId;

        const response = await axios.post(`${ML_SERVICE_URL}/ml/distraction-predict`, {
            user_id: userId,
            session_duration
        }, {
            timeout: 8000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Distraction prediction error:', error.message);
        // Fallback to default prediction
        res.json({
            success: true,
            data: {
                distraction_probability: 0.3,
                top_trigger: 'Unknown (ML service unavailable)'
            }
        });
    }
});

/**
 * Get AI-powered mood suggestions
 */
router.post('/mood-suggestions', authenticate, async (req, res) => {
    try {
        const { mood, note = '' } = req.body;
        const userId = req.userId;

        if (!mood) {
            return res.status(400).json({
                success: false,
                error: 'Mood is required'
            });
        }

        const response = await axios.post(`${ML_SERVICE_URL}/ml/mood-suggestions`, {
            user_id: userId,
            mood,
            note: note || ''
        }, {
            timeout: 10000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Mood suggestions error:', error.message);
        // Fallback to basic suggestions
        res.json({
            success: true,
            data: {
                suggestions: [
                    "Take a moment to breathe deeply",
                    "Be kind to yourself today",
                    "Remember that your feelings are valid"
                ],
                insights: "Your mood is valid. Remember to be kind to yourself.",
                recommended_activities: [
                    "Take a short break",
                    "Do something kind for yourself",
                    "Check in with how you're feeling"
                ],
                affirmation: "You're doing your best, and that's enough. Be kind to yourself today. 💙",
                sentiment_analysis: {
                    sentiment_score: 0.0,
                    label: "neutral"
                }
            }
        });
    }
});

export default router;

