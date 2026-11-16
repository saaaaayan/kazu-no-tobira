import { betaReadiness } from '../server/beta-readiness.mjs';
import { openSupabasePool } from '../server/supabase-postgres.mjs';

const options=process.argv.slice(2);
if (options.some(option=>!['--require-ready','--stages'].includes(option))) {
  throw new Error('Usage: pnpm beta:readiness [--require-ready] [--stages]');
}
const pool=openSupabasePool('svc_kazu_review');
try {
  const {stages,...summary}=await betaReadiness(pool);
  console.log(JSON.stringify(options.includes('--stages') ? {...summary,stages} : summary,null,2));
  if (options.includes('--require-ready') && !summary.inventoryReady) process.exitCode=1;
} finally { await pool.end(); }
