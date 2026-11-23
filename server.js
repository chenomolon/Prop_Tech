require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./server/backend/config/supabase');

// Import Modular Routes
const apiRoutes = require('./server/backend/routes/apiRoutes');
const webhookRoutes = require('./server/backend/routes/webhookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. GLOBAL MIDDLEWARE
app.use(cors());

// Parse JSON payloads (increased limit slightly for rich property descriptions/arrays)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple Request Logger
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});

// 2. STATIC FRONTEND FILES - Serves index.html, catalog.html, property-detail.html, and dashboards
app.use(express.static(path.join(__dirname, 'server', 'frontend')));


// 3. HEALTH CHECK & DATABASE VERIFICATION
app.get('/api/health', async (req, res) => {
    try {
        const { error } = await supabase
            .from('properties')
            .select('id')
            .limit(1);

        if (error) throw error;

        res.status(200).json({
            status: 'success',
            service: 'HomeStretch PropTech API',
            databaseConnected: true,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ Supabase Health Check Failed:', err.message);
        res.status(500).json({
            status: 'error',
            message: 'Express server is running, but Supabase connection failed.',
            error: err.message
        });
    }
});

// 4. API & WEBHOOK ROUTES
app.use('/api', apiRoutes);
app.use('/api/webhooks', webhookRoutes);

// 5. 404 HANDLER FOR UNMATCHED API ROUTES
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: `API endpoint ${req.method} ${req.originalUrl} not found.`
    });
});

// 6. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack || err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// 7. START SERVER
app.listen(PORT, () => {
    console.log('===================================================');
    console.log(`HomeStretch Server running on http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`Frontend UI:  http://localhost:${PORT}/index.html`);
    console.log('===================================================');
});