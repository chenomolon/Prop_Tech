//server/frontend/assets/js/supabaseClient.js
const supabaseUrl = 'https://yejnrazsdszbtfwpxgeo.supabase.';
const supabaseKey = 'sb_publishable_EDLMHGh8A9sMFEZnHUJSJA_DoY4I40k'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});