const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization token.' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the JWT with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
        }

        // Fetch user role from the profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, verification_status')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return res.status(403).json({ error: 'User profile not found.' });
        }

        req.user = user;
        req.userRole = profile.role;
        req.verificationStatus = profile.verification_status;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(500).json({ error: 'Internal server authentication error.' });
    }
};

module.exports = { requireAuth };