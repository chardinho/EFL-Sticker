// Supabase configuration
const SUPABASE_URL = "https://djpxosljltycswayletr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcHhvc2xqbHR5Y3N3YXlsZXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTU5MjMsImV4cCI6MjA4NDQ5MTkyM30.bPesylaMS5wJSmHl3mIr2Ql3gAI5snULpBnBVdJYP2w";

// Create Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export for use in other files
window.supabaseClient = supabaseClient;