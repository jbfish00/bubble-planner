import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://xehxodslljegwnkjqwbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaHhvZHNsbGplZ3dua2pxd2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzcwMDAsImV4cCI6MjA5MDA1MzAwMH0.ilIh6wc7bH2NV2490zy32qkdyBYwbzohWsc8Ap8uvI8'
);
