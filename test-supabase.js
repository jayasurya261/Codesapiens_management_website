
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Defined' : 'Missing');
console.log('Key:', supabaseKey ? 'Defined' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Try to fetch hall_of_fame as the app does
        const { data, error } = await supabase
            .from('hall_of_fame')
            .select('*')
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Supabase Success! Data:', data);
        }

        // Also try auth user (expected to fail if not logged in, but check error)
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('Auth check (expected null session):', userData, userError?.message);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
