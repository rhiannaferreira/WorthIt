import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { getSavedThemeSync } from './services/api';
import { applyTheme } from './utils/theme';

applyTheme(getSavedThemeSync());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
