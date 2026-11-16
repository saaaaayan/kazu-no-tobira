import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { isAbsolute,relative,resolve,sep } from 'node:path';

const [platform,output,profile]=process.argv.slice(2);
const production=profile==='--production';
if (profile && !production) throw new Error('Unknown export profile.');
if (production && !/^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?$/.test(process.env.EXPO_PUBLIC_KAZU_GAME_ORIGIN ?? '')) {
  throw new Error('Set the HTTPS game origin to build the production API client.');
}
const target=output && resolve(output);
const inside=target && relative(resolve('.expo'),target);
if (!['web','android','ios'].includes(platform) || !inside || isAbsolute(inside) ||
    inside==='..' || inside.startsWith('..'+sep) || existsSync(target)) {
  throw new Error('Usage: node scripts/export-db-preview.mjs web|android|ios .expo/<new-preview-directory>');
}
const require=createRequire(import.meta.url);
const cli=require.resolve('expo/bin/cli');
const run=spawnSync(process.execPath,[cli,'export','--platform',platform,...(production?[]:['--dev']),'--output-dir',target],{
  stdio:'inherit',
  env:{
    ...process.env,
    KAZU_DB_ONLY_PREVIEW:'1',
    EXPO_PUBLIC_KAZU_DB_ONLY:'1',
    EXPO_PUBLIC_FOLDER:'.expo/db-preview-no-public-bank-assets',
    EXPO_PUBLIC_KAZU_NATIVE_PREVIEW_PORT:process.env.EXPO_PUBLIC_KAZU_NATIVE_PREVIEW_PORT ?? '8125',
  },
});
if (run.error) throw run.error;
process.exitCode=run.status ?? 1;
