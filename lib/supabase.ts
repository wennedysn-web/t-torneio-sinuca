import { createClient } from '@supabase/supabase-js';

// Credenciais do projeto Supabase fornecidas
const supabaseUrl = 'https://zwgcmyotzjfwvhgqgcad.supabase.co';
const supabaseAnonKey = 'sb_publishable_FP5Ukh5MKYUGJkbV1s3_GQ_F8oBRvRK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);