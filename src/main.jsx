import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './app/AppRouter.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
