const supabase = require('../config/supabase');

// GET all available properties (with optional filters for Member 2's Catalog)
const getAllProperties = async (req, res) => {
    try {
        const { location, minCompletion, maxPrice } = req.query;

        let query = supabase
            .from('properties')
            .select(`
                *,
                profiles:developer_id (full_name, verification_status)
            `)
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (location) {
            query = query.ilike('location', `%${location}%`);
        }
        if (minCompletion) {
            query = query.gte('completion_percentage', parseInt(minCompletion));
        }
        if (maxPrice) {
            query = query.lte('price', parseFloat(maxPrice));
        }

        const { data, error } = await query;
        if (error) throw error;

        res.status(200).json({ properties: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

        const { title, description, price, completion_percentage, location, options } = req.body;

        // 1. Insert the property
        const { data: newProperty, error: propError } = await supabase
            .from('properties')
            .insert([{
                developer_id: req.user.id,
                title,
                description,
                price,
                completion_percentage,
                location
            }])
            .select()
            .single();

        if (propError) throw propError;

        // 2. Insert customization options if provided
        if (options && Array.isArray(options) && options.length > 0) {
            const formattedOptions = options.map(opt => ({
                property_id: newProperty.id,
                category: opt.category,
                name: opt.name,
                price_adjustment: opt.price_adjustment || 0
            }));

            const { error: optError } = await supabase
                .from('customization_options')
                .insert(formattedOptions);

            if (optError) throw optError;
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