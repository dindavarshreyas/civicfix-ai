import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Server-side admin client using service role key (Managed PostgreSQL & private Storage)
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Verify Supabase connection on startup
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin.from('departments').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      logger.warn({ error: error.message }, 'Supabase departments table query warning - schema might not be initialized yet');
      return false;
    }
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to reach Supabase API');
    return false;
  }
}
