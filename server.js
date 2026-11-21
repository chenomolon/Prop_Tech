require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./server/backend/config/supabase');

const app = express();
const PORT = process.env.PORT || 5000;
// const apiRoutes = require('./server/backend/routes/apiRoutes');
// const webhookRoutes = require('./server/backend/routes/webhookRoutes');

// Middleware
app.use(cors());
app.use(express.json());

//Api & Webhook Routes
//app.use('/api', apiRoutes);
//app.use('/api', webhookRoutes);

// Serve static files from the 'frontend' folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Health Check & Supabase Connection Test Route
app.get('/api/health', async (req, res) => {
    try {
        // Test query to verify Supabase connection
        const { data, error } = await supabase
            .from('properties')
            .select('id')
            .limit(1);

        if (error) throw error;

        res.status(200).json({
            status: 'success',
            message: 'Express server is running and connected to Supabase!',
            databaseConnected: true
        });
    } catch (err) {
        console.error('Supabase connection test failed:', err.message);
        res.status(500).json({
            status: 'error',
            message: 'Server is running, but Supabase connection failed.',
            error: err.message
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🩺 Test database connection at http://localhost:${PORT}/api/health`);
});