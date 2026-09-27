import { AnalyticalApp } from './AnalyticalApp';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

createRoot(document.getElementById('root')!).render(<StrictMode>{new URLSearchParams(window.location.search).get('preview') === '1' ? <App /> : <AnalyticalApp />}</StrictMode>);
