import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdiqkmacaxtryseltwki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkaXFrbWFjYXh0cnlzZWx0d2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODI5ODYsImV4cCI6MjA4MTY1ODk4Nn0.80z2u3ywwUfJ2IStVPqmkeeTwh-qJAz8Ez8XiNu8nhc';

export const supabase = createClient(supabaseUrl, supabaseKey);
