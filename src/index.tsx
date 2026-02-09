import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize Sentry for error tracking
import './config/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnvironment } from './config/envValidation';

/**
 * Environment Validation
 * Validates required environment variables before app initialization.
 * Fails fast with clear error messages if configuration is incomplete.
 */
(async () => {
  try {
    await validateEnvironment();
  } catch (error) {
    console.error(error);
    // Show user-friendly error page instead of cryptic failures
    document.body.innerHTML = `
      <div style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #dc2626;">⚠️ Configuration Error</h1>
        <pre style="background: #f3f4f6; padding: 20px; border-radius: 8px; overflow-x: auto;">${error}</pre>
        <p style="color: #6b7280;">Please contact your administrator or check the .env file.</p>
      </div>
    `;
    throw error; // Stop execution
  }

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
})(); // Close the async IIFE
