const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getAllProperties,
    getPropertyById,
    createProperty,
    saveBuyerSelections
} = require('../controllers/propertyController');
const { initiateBookingPayment } = require('../controllers/paymentController');

// Public Routes (No login required)
router.get('/properties', getAllProperties);
router.get('/properties/:id', getPropertyById);

// Protected Routes (Requires valid Supabase Bearer token)
router.post('/properties', requireAuth, createProperty);
router.post('/customizations', requireAuth, saveBuyerSelections);
router.post('/payments/book', requireAuth, initiateBookingPayment);

module.exports = router;