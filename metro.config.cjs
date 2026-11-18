const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (process.env.KAZU_DB_ONLY_PREVIEW === '1') {
  const previewLoader = path.join(__dirname,'src','stageBankLoader.db-preview.ts');
  const publicLoader = path.join(__dirname,'src','stageBankLoader.web.ts');
  const uiOnly = process.env.EXPO_PUBLIC_KAZU_UI_PREVIEW === '1';
  // Pages exports retain isolated feature modules, but MUST load the publicly
  // published 43 stage-bank JSON files instead of the DB-preview error stub.
  const publicBanks = uiOnly && process.env.KAZU_PUBLIC_BANK_FILES === '1';
  const onlineReview = process.env.EXPO_PUBLIC_KAZU_ONLINE_REVIEW === '1';
  const hidden = path.join(__dirname,'src','uiPreviewModules.ts');
  const { resolveRequest } = config.resolver;
  config.resolver.resolveRequest = (context,name,platform) => {
    const isolated = /\/(?:stageRounds|unitLessons|UnitLearning|StudyPlanner|StudyWorkshop|QuestionReviewAdmin|ServerQuestionReview)(?:\.ts)?$/;
    const hostedReview = onlineReview && platform === 'web' && /\/ServerQuestionReview$/.test(name);
    const next = uiOnly && !hostedReview && isolated.test(name) ? hidden
      : /^(?:\.\/|\.\.\/)stageBankLoader$/.test(name)
        ? publicBanks && platform === 'web' ? publicLoader : previewLoader
        : name;
    return (resolveRequest ?? context.resolveRequest)(context,next,platform);
  };
}

module.exports = config;
