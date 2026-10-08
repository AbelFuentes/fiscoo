import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@abelfuentes/ui-controls';

import App from './app/App';
import { initializeTheme } from './lib/theme';
import './index.css';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
