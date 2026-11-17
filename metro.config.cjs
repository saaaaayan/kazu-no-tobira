const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (process.env.KAZU_DB_ONLY_PREVIEW === '1') {
  const loader = path.join(__dirname,'src','stageBankLoader.db-preview.ts');
  const uiOnly = process.env.EXPO_PUBLIC_KAZU_UI_PREVIEW === '1';
  const onlineReview = process.env.EXPO_PUBLIC_KAZU_ONLINE_REVIEW === '1';
  const hidden = path.join(__dirname,'src','uiPreviewModules.ts');
  const { resolveRequest } = config.resolver;
  config.resolver.resolveRequest = (context,name,platform) => {
    const isolated = /\/(?:stageRounds|unitLessons|UnitLearning|StudyPlanner|StudyWorkshop|QuestionReviewAdmin|ServerQuestionReview)(?:\.ts)?$/;
    const hostedReview = onlineReview && platform === 'web' && /\/ServerQuestionReview$/.test(name);
    const next = uiOnly && !hostedReview && isolated.test(name) ? hidden
      : /^(?:\.\/|\.\.\/)stageBankLoader$/.test(name) ? loader : name;
    return (resolveRequest ?? context.resolveRequest)(context,next,platform);
  };
}

module.exports = config;
