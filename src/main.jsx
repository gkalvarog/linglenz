// Filename: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Global Styles (Tailwind)
import './index.css';

// Root DOM Injection
// We use createRoot for React 18+ concurrent features support
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);