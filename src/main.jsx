
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

console.log("Initializing App...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Failed to find root element");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Critical error during app render:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Application Error</h1>
        <p>The application failed to load. Please check the console for details.</p>
        <pre>${error.message}</pre>
      </div>
    `;
  }
}
