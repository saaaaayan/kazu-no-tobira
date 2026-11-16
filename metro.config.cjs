const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (process.env.KAZU_DB_ONLY_PREVIEW === '1') {
  const loader = path.join(__dirname,'src','stageBankLoader.db-preview.ts');
  const { resolveRequest } = config.resolver;
  config.resolver.resolveRequest = (context,name,platform) => {
    const next = /^(?:\.\/|\.\.\/)stageBankLoader$/.test(name) ? loader : name;
    return (resolveRequest ?? context.resolveRequest)(context,next,platform);
  };
}

module.exports = config;
