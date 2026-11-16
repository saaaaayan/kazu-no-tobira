import { registerRootComponent } from 'expo';
import App from './src/FullAdventure';

// This product is written in Japanese. Browser auto-translation can replace
// React-managed text nodes, corrupt labels, and interfere with button events.
// Mark the whole web document as Japanese and opt it out of translation.
if (typeof document !== 'undefined') {
  const root = document.documentElement;
  root.lang = 'ja';
  root.setAttribute('translate', 'no');
  root.classList.add('notranslate');
  const meta = document.querySelector('meta[name="google"]') ?? document.createElement('meta');
  meta.setAttribute('name', 'google');
  meta.setAttribute('content', 'notranslate');
  if (!meta.parentNode) document.head.appendChild(meta);
}

const Root = (__DEV__ || process.env.EXPO_PUBLIC_KAZU_REVIEW_BUILD === '1') && typeof window !== 'undefined' && window.location?.pathname === '/admin'
  ? require('./src/components/ServerQuestionReview').default : App;
registerRootComponent(Root);
