import App from './App';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root')!;
const appRoot = createRoot(root);
const debugView = new URLSearchParams(window.location.search).get('debug');
const showAssetPreview =
  import.meta.env.DEV &&
  (debugView === 'assets' || debugView === 'characters');

if (showAssetPreview) {
  void import('./ui/debug/AssetPreviewScreen').then(({ AssetPreviewScreen }) => {
    appRoot.render(<AssetPreviewScreen />);
  });
} else {
  appRoot.render(<App />);
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, {
          scope: import.meta.env.BASE_URL,
          updateViaCache: 'none',
        })
        .catch((error: unknown) => {
          console.warn('Gym Buddies offline support could not start.', error);
        });
    },
    { once: true },
  );
}
