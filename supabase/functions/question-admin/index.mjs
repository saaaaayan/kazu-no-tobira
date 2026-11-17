import pg from 'npm:pg@8.23.1';
import { createSupabaseOwnerAuth } from '../../../server/supabase-owner-auth.mjs';
import { createSupabaseQuestionReview } from '../../../server/supabase-question-review.mjs';
import { onlineQuestionReview } from '../../../server/online-question-review.mjs';
import { restrictedReviewPool } from '../../../server/restricted-review-pool.mjs';

const connectionString = Deno.env.get('SUPABASE_DB_URL');
if (!connectionString) throw new Error('Missing hosted database configuration.');
const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}');
const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 4000, idleTimeoutMillis: 10000 });
pool.on('error', () => console.error('Idle review database connection closed.'));
const store = createSupabaseQuestionReview(restrictedReviewPool(pool));
const auth = createSupabaseOwnerAuth(keys.default ?? Deno.env.get('SUPABASE_ANON_KEY'), store.isAdministratorSession);

Deno.serve(onlineQuestionReview({ store, auth }));
