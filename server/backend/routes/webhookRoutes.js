const express = require('express');
const router = express.Router();
const { mpesaWebhook } = require('../controllers/paymentController');

// Public endpoint for Safaricom Daraja API callbacks
router.post('/mpesa', mpesaWebhook);

module.exports = router;