// Supabase project config — anon (publishable) key only, safe for client-side use (protected by RLS).
const SUPABASE_URL = "https://ecdrtiukzimnjoecnmzm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mB3KVrlFqtHdoQtf81_MhQ_a8ifFJ6R";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
