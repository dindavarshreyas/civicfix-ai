import { supabaseAdmin } from '../config/supabase.js';
import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { duplicateJsonSchema } from '../ai/schemas/duplicate.json.js';
import { duplicateOutputSchema } from '../validation/aiSchemas.js';
import { buildDuplicatePrompt } from '../ai/prompts/duplicatePrompt.js';
import { getDuplicateFallback } from '../ai/fallbacks.js';
import { env } from '../config/env.js';
import { haversineM } from '../utils/geo.js';
import { logger } from '../utils/logger.js';

/**
 * Duplicate Detection & Merge Agent finds nearby open issues of the same category,
 * uses AI judgement to detect duplicate physical problems, and merges if matched.
 */
export async function runDuplicateAgent(context) {
  const { newReport, intake } = context;
  const radiusM = env.DUPLICATE_RADIUS_M || 75;
  const lookbackDays = env.DUPLICATE_LOOKBACK_DAYS || 30;
  const maxCandidates = env.DUPLICATE_MAX_CANDIDATES || 5;
  const minSimilarity = env.DUPLICATE_MERGE_MIN_SIMILARITY || 0.6;

  // Step A: Deterministic Geo Pre-Filter
  let candidates = [];
  try {
    const { data: rpcCandidates, error } = await supabaseAdmin.rpc('find_nearby_open_issues', {
      p_lat: newReport.latitude,
      p_lng: newReport.longitude,
      p_category: intake.category,
      p_radius_m: radiusM,
      p_days: lookbackDays,
      p_limit: maxCandidates,
    });

    if (!error && rpcCandidates) {
      candidates = rpcCandidates;
    } else {
      // Fallback query if RPC is not available in Postgres
      const { data: dbIssues } = await supabaseAdmin
        .from('issues')
        .select('*')
        .eq('category', intake.category)
        .not('status', 'in', '("closed","rejected")')
        .order('last_reported_at', { ascending: false })
        .limit(20);

      if (dbIssues) {
        candidates = dbIssues
          .map((iss) => ({
            ...iss,
            distance_m: haversineM(newReport.latitude, newReport.longitude, iss.latitude, iss.longitude),
          }))
          .filter((iss) => iss.distance_m <= radiusM)
          .sort((a, b) => a.distance_m - b.distance_m)
          .slice(0, maxCandidates);
      }
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'find_nearby_open_issues query encountered error; proceeding without candidates');
  }

  // If zero candidates, skip AI call
  if (!candidates || candidates.length === 0) {
    return {
      status: 'succeeded',
      data: {
        decision: 'new_issue',
        matched_issue_id: '',
        similarity_score: 0.0,
        merged_summary_update: '',
        reasoning: 'No open issues of this category found within spatial radius threshold (75m).',
      },
      reasoning: 'No open issues of this category found within spatial radius threshold (75m).',
      model: 'geo-prefilter-deterministic',
      latencyMs: 1,
      candidates: [],
    };
  }

  // Step B: AI Judgement
  const { systemInstruction, userText } = buildDuplicatePrompt({
    newReport: {
      ...newReport,
      ...intake,
    },
    candidates,
  });

  const result = await callAgentWithRetry({
    agentName: 'duplicate',
    systemInstruction,
    userText,
    jsonSchema: duplicateJsonSchema,
    zodSchema: duplicateOutputSchema,
    fallbackFn: () => getDuplicateFallback(candidates),
    fallbackContext: {},
  });

  // Step C: Code-level verification & threshold enforcement
  const aiDecision = result.data.decision;
  const matchedId = result.data.matched_issue_id;
  const similarity = result.data.similarity_score;

  const validMatchCandidate = candidates.find((c) => c.id === matchedId);

  if (aiDecision === 'merge' && (!validMatchCandidate || similarity < minSimilarity)) {
    logger.info(
      { matchedId, similarity, minSimilarity, candidateFound: !!validMatchCandidate },
      'Overriding merge decision to new_issue due to low similarity score or invalid candidate ID'
    );
    result.data.decision = 'new_issue';
    result.data.matched_issue_id = '';
    result.data.reasoning += ` [Verification Override: similarity ${similarity} < ${minSimilarity} threshold or candidate was not in spatial set]`;
  }

  result.candidates = candidates;
  result.matchedCandidate = validMatchCandidate || null;

  return result;
}
