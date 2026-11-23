const supabase = require('../config/supabase');

const ALLOWED_PROPERTY_TYPES = [
    'villa',
    'apartment',
    'townhouse',
    'loft',
    'maisonette',
    'bungalow'
]

// Helper prevent image url from receiving a video
function isVideoUrl(url) {
    return typeof url === 'string' && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

// GET all available properties (with optional filters for Member 2's Catalog)
const getAllProperties = async (req, res) => {
    try {
        const { location, minCompletion, maxPrice } = req.query;

        // Validate minimum completion percentage
        if (minCompletion !== undefined) {
            const completion = Number(minCompletion);

            if (
                !Number.isFinite(completion) ||
                completion < 0 ||
                completion > 100
            ) {
                return res.status(400).json({
                    error: "Completion percentage must be a number between 0 and 100."
                });
            }
        }

        // Validate maximum property price
        if (maxPrice !== undefined) {
            const price = Number(maxPrice);

            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    error: "Maximum price must be a valid positive number."
                });
            }
        }

        //Supabase query
        let query = supabase
            .from('properties')
            .select(`
                *,
                profiles:developer_id (full_name, verification_status)
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        // Apply location filter
        if (location) {
            query = query.ilike('location', `%${location}%`);
        }

        // Apply minimum completion filter
        if (minCompletion !== undefined) {
            query = query.gte(
                'completion_percentage',
                Number(minCompletion)
            );
        }

        // Apply maximum price filter
        if (maxPrice !== undefined) {
            query = query.lte(
                'price',
                Number(maxPrice)
            );
        }

        // Execute query
        const { data, error } = await query;

        if (error) throw error;

        // Return properties
        return res.status(200).json({
            properties: data
        });

    } catch (err) {
        console.error('Error fetching properties:', err);

        return res.status(500).json({
            error: 'An error occurred while retrieving properties.'
        });
    }
};

// GET single property + its customization options (for Member 3's Property Detail Page)
const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: property, error: propError } = await supabase
            .from('properties')
            .select(`
                *,
                profiles:developer_id (full_name, phone_number, verification_status),
                customization_options (*)
            `)
            .eq('id', id)
            .single();

        if (propError) throw propError;
        if (!property) return res.status(404).json({ error: 'Property not found.' });

        res.status(200).json({ property });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST create a new property + customization options (for Member 4's Developer Dashboard)
const createProperty = async (req, res) => {
    try {
        if (req.userRole !== 'developer') {
            return res.status(403).json({ error: 'Only developers can post properties.' });
        }

        const { title, description, price, completion_percentage, location, property_type, image_url, media_urls, options } = req.body;

        // 1. Validate required fields & types
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'Property title is required.' });
        }
        if (!location || typeof location !== 'string' || !location.trim()) {
            return res.status(400).json({ error: 'Property location is required.' });
        }

        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ error: 'Price must be a positive number.' });
        }

        const completionNum = Number(completion_percentage);
        if (!Number.isInteger(completionNum) || completionNum < 0 || completionNum > 100) {
            return res.status(400).json({
                error: 'completion_percentage must be an integer between 0 and 100.'
            });
        }

        // Normalize and validate property_type
        const normalizedType = typeof property_type === 'string'
            ? property_type.trim().toLowerCase()
            : 'apartment';
        if (!ALLOWED_PROPERTY_TYPES.includes(normalizedType)) {
            return res.status(400).json({
                error: `Invalid property_type. Allowed values: ${ALLOWED_PROPERTY_TYPES.join(', ')}`
            });
        }

        // 2. Sanitize media_urls (keep only valid non-empty strings)
        const cleanMediaUrls = Array.isArray(media_urls)
            ? media_urls
                .filter(url => typeof url === 'string' && url.trim().length > 0)
                .map(url => url.trim())
            : [];

        // 3. Determine safe cover image_url (never allow a video file in image_url)
        let coverImage = '';
        if (typeof image_url === 'string' && image_url.trim().length > 0) {
            if (isVideoUrl(image_url.trim())) {
                return res.status(400).json({
                    error: 'image_url cannot be a video file. Use media_urls for videos.'
                });
            }
            coverImage = image_url.trim();
        } else if (cleanMediaUrls.length > 0) {
            const firstImage = cleanMediaUrls.find(url => !isVideoUrl(url));
            if (firstImage) coverImage = firstImage;
        }

        // Ensure coverImage is also present in media_urls if provided
        const finalMediaUrls = coverImage && !cleanMediaUrls.includes(coverImage)
            ? [coverImage, ...cleanMediaUrls]
            : cleanMediaUrls;

        // 4. Insert the property
        const { data: newProperty, error: propError } = await supabase
            .from('properties')
            .insert([{
                developer_id: req.user.id,
                title: title.trim(),
                description: typeof description === 'string' ? description.trim() : '',
                price: numericPrice,
                completion_percentage: completionNum,
                location: location.trim(),
                property_type: normalizedType,
                image_url: coverImage,
                media_urls: finalMediaUrls
            }])
            .select()
            .single();

        if (propError) throw propError;

        // 5. Insert customization options if provided
        if (options && Array.isArray(options) && options.length > 0) {
            const formattedOptions = options.map(opt => ({
                property_id: newProperty.id,
                category: String(opt.category).trim(),
                name: String(opt.name).trim(),
                price_adjustment: Number(opt.price_adjustment) || 0
            }));

            if (formattedOptions.length > 0) {
                const { error: optError } = await supabase
                    .from('customization_options')
                    .insert(formattedOptions);

                if (optError) throw optError;
            }
        }

        res.status(201).json({ 
            message: 'Property created successfully!', 
            property: newProperty 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST save buyer customization selections (for Member 3's Configurator)
const saveBuyerSelections = async (req, res) => {
    try {
        const { property_id, option_ids } = req.body; // Array of selected option UUIDs

        if (!property_id || !Array.isArray(option_ids)) {
            return res.status(400).json({ error: 'Invalid property_id or option_ids.' });
        }

        // Clear previous selections for this property by this buyer so they can update freely
        await supabase
            .from('buyer_selections')
            .delete()
            .eq('property_id', property_id)
            .eq('buyer_id', req.user.id);

        if (option_ids.length > 0) {
            const records = option_ids.map(optId => ({
                property_id,
                buyer_id: req.user.id,
                option_id: optId
            }));

            const { error } = await supabase
                .from('buyer_selections')
                .insert(records);

            if (error) throw error;
        }

        res.status(200).json({ message: 'Customizations saved successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllProperties,
    getPropertyById,
    createProperty,
    saveBuyerSelections
};