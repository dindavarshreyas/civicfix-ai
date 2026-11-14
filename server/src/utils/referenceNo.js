import { supabaseAdmin } from '../config/supabase.js';

/**
 * Generates an official reference number in the format CIV-YYYY-XXXXXX
 * Queries Postgres sequence issue_ref_seq or falls back to timestamp-based sequence.
 */
export async function generateReferenceNumber() {
  const year = new Date().getFullYear();
  try {
    const { data, error } = await supabaseAdmin.rpc('nextval_issue_ref_seq');
    if (!error && data) {
      return `CIV-${year}-${String(data).padStart(6, '0')}`;
    }
  } catch {
    // If RPC isn't available, query count or random 6-digit
  }

  // Fallback generation: current millis mod 1000000 + random
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `CIV-${year}-${randNum}`;
}
