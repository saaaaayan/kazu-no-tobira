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
  // Expo / React Native Web can lock scrolling on the document root. The admin
  // screen contains ordinary HTML tables and forms and must scroll naturally on
  // mobile. Apply this ONLY to /admin/; never affect the game viewport.
  const adminScrollStyles = `<style id="kazu-admin-scroll">
    html, body {
      height: auto !important;
      min-height: 100% !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch;
    }
    #root {
      height: auto !important;
      min-height: 100dvh !important;
      overflow: visible !important;
    }
    @media (max-width: 640px) {
      .kazu-admin-stage-table {
        max-height: none !important;
        overflow-y: visible !important;
        overflow-x: auto !important;
      }
    }
  </style>`;
  const adminHtml=applyPolicy(index, `'self' ${auth}/auth/v1/ ${auth}/functions/v1/question-admin/`);
  writeFileSync(resolve(target, 'admin/index.html'), adminHtml.replace('</head>', adminScrollStyles + '</head>'));
  const gameSources = gameOrigin ? "'self' " + new URL(gameOrigin).origin : "'self'";
  writeFileSync(indexPath, applyPolicy(index, gameSources));
}

if (import.meta.main) writePagesAdminEntry(process.argv[2], process.env.EXPO_PUBLIC_KAZU_GAME_ORIGIN);
