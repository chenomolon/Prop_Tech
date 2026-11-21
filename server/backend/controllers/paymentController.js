const axios = require('axios');
const supabase = require('../config/supabase');

//Generate Daraja OAuth Token
const getDarajaToken = async () => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
};

// POST Initiate Booking Fee STK Push
const initiateBookingPayment = async (req, res) => {
    try {
        const { property_id, phone_number, amount } = req.body; // Format phone as 2547XXXXXXXX

        let formattedPhone = String(phone_number).trim().replace(/^\+/, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = `254${formattedPhone.slice(1)}`;
        } else if (formattedPhone.length === 9) {
            formattedPhone = `254${formattedPhone}`;
        }
        
        // 1. Check if property is still available (Concurrency protection)
        const { data: property, error: propError } = await supabase
            .from('properties')
            .select('status, title')
            .eq('id', property_id)
            .single();

        if (propError || !property) return res.status(404).json({ error: 'Property not found.' });
        if (property.status !== 'available') {
            return res.status(409).json({ error: 'Property is already reserved or sold.' });
        }

        // 2. Lock the property status to 'pending' immediately
        await supabase
            .from('properties')
            .update({ status: 'pending' })
            .eq('id', property_id);

        // 3. Create a pending transaction record in Supabase
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert([{
                property_id,
                buyer_id: req.user.id,
                amount,
                payment_method: 'm-pesa',
                payment_status: 'pending'
            }])
            .select()
            .single();

        if (txError) throw txError;

        // 4. Trigger M-Pesa STK Push
        const token = await getDarajaToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

        const stkPayload = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: `${process.env.MPESA_CALLBACK_URL}?tx_id=${transaction.id}&prop_id=${property_id}`,
            AccountReference: 'HomeStretchBooking',
            TransactionDesc: `Booking for ${property.title.slice(0, 15)}`
        };

        const mpesaRes = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            stkPayload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        res.status(200).json({
            message: 'STK Push sent to phone. Enter M-Pesa PIN to complete.',
            checkoutRequestID: mpesaRes.data.CheckoutRequestID,
            transactionId: transaction.id
        });
    } catch (err) {
        console.error('STK Push Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to initiate M-Pesa payment.' });
    }
};

// POST M-Pesa Webhook Callback (Called by Safaricom servers)
const mpesaWebhook = async (req, res) => {
    try {
        const { tx_id, prop_id } = req.query;
        const callbackData = req.body?.Body?.stkCallback;

        if (!callbackData) {
            return res.status(400).json({ error: 'Invalid callback payload' });
        }

        if (callbackData.ResultCode === 0) {
            // Payment Successful: Extract M-Pesa Receipt Number
            const metadataItems = callbackData.CallbackMetadata?.Item || [];
            const receiptObj = metadataItems.find(item => item.Name === 'MpesaReceiptNumber');
            const receiptNumber = receiptObj ? receiptObj.Value : 'N/A';

            // Update transaction to completed
            await supabase
                .from('transactions')
                .update({
                    payment_status: 'completed',
                    receipt_number: receiptNumber
                })
                .eq('id', tx_id);

            // Mark property as sold/booked
            await supabase
                .from('properties')
                .update({ status: 'sold' })
                .eq('id', prop_id);

            console.log(`Payment confirmed! Receipt: ${receiptNumber}`);
        } else {
            // Payment Failed or Cancelled by User
            await supabase
                .from('transactions')
                .update({ payment_status: 'failed' })
                .eq('id', tx_id);

            // Unlock property back to 'available' so others can book
            await supabase
                .from('properties')
                .update({ status: 'available' })
                .eq('id', prop_id);

            console.log(`Payment failed/cancelled for Tx: ${tx_id}`);
        }

        // Always respond 200 OK to Safaricom
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (err) {
        console.error('Webhook Processing Error:', err.message);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
};

module.exports = {
    initiateBookingPayment,
    mpesaWebhook
};