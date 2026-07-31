import App from './App';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root')!;
const appRoot = createRoot(root);
const debugView = new URLSearchParams(window.location.search).get('debug');
const showAssetPreview =
  import.meta.env.DEV &&
  (debugView === 'assets' || debugView === 'characters');
const showSpriteStripLab =
  import.meta.env.DEV && debugView === 'sprites';
const showBatch02Review =
  import.meta.env.DEV && debugView === 'batch02-review';
const showBatch03Review =
  import.meta.env.DEV && debugView === 'batch03-review';
const showPlaytestReportViewer =
  import.meta.env.DEV && debugView === 'playtest-reports';

if (showPlaytestReportViewer) {
  void import('./ui/debug/PlaytestReportViewer').then(
    ({ PlaytestReportViewer }) => {
      appRoot.render(<PlaytestReportViewer />);
    },
  );
} else if (showBatch03Review) {
  void import('./ui/debug/Batch03ReviewScreen').then(
    ({ Batch03ReviewScreen }) => {
      appRoot.render(<Batch03ReviewScreen />);
    },
  );
} else if (showBatch02Review) {
  void import('./ui/debug/Batch02ReviewScreen').then(
    ({ Batch02ReviewScreen }) => {
      appRoot.render(<Batch02ReviewScreen />);
    },
  );
} else if (showSpriteStripLab) {
  void import('./ui/debug/SpriteStripLab').then(({ SpriteStripLab }) => {
    appRoot.render(<SpriteStripLab />);
  });
} else if (showAssetPreview) {
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
