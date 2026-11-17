import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function writePagesAdminEntry(target, gameOrigin) {
  const indexPath = resolve(target, 'index.html');
  const index = readFileSync(indexPath, 'utf8');
  const shared = "object-src 'none'; base-uri 'self'; form-action 'none'";
  const auth = 'https://jxitjcfgavemddlbygzx.supabase.co';
  const applyPolicy = (html, sources) => html.replace('<head>',
    `<head><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="connect-src ${sources}; ${shared}">`);
  mkdirSync(resolve(target, 'admin'));
  writeFileSync(resolve(target, 'admin/index.html'), applyPolicy(index, `'self' ${auth}/auth/v1/ ${auth}/functions/v1/question-admin/`));
  const gameSources = gameOrigin ? "'self' " + new URL(gameOrigin).origin : "'self'";
  writeFileSync(indexPath, applyPolicy(index, gameSources));
}

if (import.meta.main) writePagesAdminEntry(process.argv[2], process.env.EXPO_PUBLIC_KAZU_GAME_ORIGIN);
