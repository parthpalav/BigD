import express from 'express';
import axios from 'axios';

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Predict traffic congestion for a single point
 */
router.post('/predict', async (req, res) => {
    try {
        const { hour, day_of_week, lat, lon, free_flow_speed } = req.body;

        // Validate inputs
        if (hour === undefined || day_of_week === undefined || lat === undefined || lon === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: hour, day_of_week, lat, lon'
            });
        }

        // Call ML service
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
            hour,
            day_of_week,
            lat,
            lon,
            free_flow_speed: free_flow_speed || 60
        }, {
            timeout: 10000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        console.error('ML prediction error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'ML service unavailable'
        });
    }
});

/**
 * Predict traffic for multiple points along a route
 */
router.post('/predict-route', async (req, res) => {
    try {
        const { coordinates, hour, day_of_week } = req.body;

        if (!coordinates || !Array.isArray(coordinates) || hour === undefined || day_of_week === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: coordinates (array), hour, day_of_week'
            });
        }

        // Call ML service
        const response = await axios.post(`${ML_SERVICE_URL}/predict-route`, {
            coordinates,
            hour,
            day_of_week
        }, {
            timeout: 15000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        console.error('ML route prediction error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'ML service unavailable'
        });
    }
});

/**
 * Get real-time TomTom traffic data
 */
router.post('/tomtom-traffic', async (req, res) => {
    try {
        const { lat, lon } = req.body;

        if (lat === undefined || lon === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: lat, lon'
            });
        }

        // Call ML service (which calls TomTom API)
        const response = await axios.post(`${ML_SERVICE_URL}/tomtom/traffic`, {
            lat,
            lon
        }, {
            timeout: 10000
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        console.error('TomTom traffic data error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'TomTom service unavailable'
        });
    }
});

/**
 * Health check for ML service
 */
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 5000
        });

        res.json({
            success: true,
            ml_service: response.data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'ML service unavailable'
        });
    }
});

/**
 * Retrain the ML model
 */
router.post('/retrain', async (req, res) => {
    try {
        const { n_samples } = req.body;

        const response = await axios.post(`${ML_SERVICE_URL}/retrain`, {
            n_samples: n_samples || 10000
        }, {
            timeout: 60000 // 1 minute for training
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        console.error('Model retrain error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to retrain model'
        });
    }
});

export default router;
