// RiskRoom Frontend Configuration

const getEnvVar = (key, defaultValue) => {
  // Try Vite env first
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  // Try window.ENV for runtime config
  if (typeof window !== 'undefined' && window.ENV?.[key]) {
    return window.ENV[key];
  }
  // Fallback to default value
  return defaultValue;
};

// API base URL for backend calls
export const API_BASE = getEnvVar('VITE_API_URL', 'https://riskroom-production.up.railway.app');

// Enable/disable Anthropic AI integration
export const ANTHROPIC_ENABLED = getEnvVar('VITE_ANTHROPIC_ENABLED', 'true') === 'true';

export default {
  API_BASE,
  ANTHROPIC_ENABLED,
};
