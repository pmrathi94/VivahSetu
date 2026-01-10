/**
 * Secure Configuration Management
 * 
 * CRITICAL: All API keys and secrets are managed via environment variables
 * NEVER expose keys in frontend code - use backend proxy for sensitive operations
 * Supabase JWT tokens are obtained from Supabase Auth, not hardcoded
 * 
 * MNC-Grade Security Standards:
 * - Zero key exposure principle
 * - Environment-based configuration
 * - Secure API communication
 * - Client-side token handling via Supabase Auth
 */

interface AppConfig {
  // App identification
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // Supabase configuration (public only)
  supabase: {
    url: string;
    anonKey: string; // Public anonymous key only
  };
  
  // API configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  
  // Feature flags
  features: {
    aiEnabled: boolean;
    locationSearchEnabled: boolean;
    realtimeUpdatesEnabled: boolean;
    offlineModeEnabled: boolean;
    pwaEnabled: boolean;
  };
  
  // Geolocation configuration
  geo: {
    mapboxAccessToken?: string; // Optional, loaded from env
    defaultZoom: number;
    defaultCenter: [number, number]; // India center
  };
  
  // Security configuration
  security: {
    corsOrigin: string;
    refreshTokenInterval: number; // ms
    tokenExpiryThreshold: number; // ms before token expiry
  };
  
  // Logging configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };
}

// Validate required environment variables at runtime
const validateEnv = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[`VITE_${key}`] || defaultValue;
  if (!value) {
    console.warn(`Missing environment variable: VITE_${key}`);
  }
  return value || '';
};

// Build configuration from environment variables
const buildConfig = (): AppConfig => {
  const env = import.meta.env;
  
  return {
    appName: 'VivahSetu',
    version: env.VITE_APP_VERSION || '2.0.0',
    environment: (env.MODE as AppConfig['environment']) || 'development',
    
    // Supabase - public keys only
    supabase: {
      url: validateEnv('SUPABASE_URL'),
      anonKey: validateEnv('SUPABASE_ANON_KEY'),
    },
    
    // API configuration
    api: {
      baseUrl: validateEnv('API_URL', 'http://localhost:3001'),
      timeout: parseInt(validateEnv('API_TIMEOUT', '30000')),
      retryAttempts: parseInt(validateEnv('API_RETRY_ATTEMPTS', '3')),
    },
    
    // Features
    features: {
      aiEnabled: validateEnv('ENABLE_AI', 'true') === 'true',
      locationSearchEnabled: validateEnv('ENABLE_LOCATION_SEARCH', 'true') === 'true',
      realtimeUpdatesEnabled: validateEnv('ENABLE_REALTIME', 'true') === 'true',
      offlineModeEnabled: validateEnv('ENABLE_OFFLINE', 'true') === 'true',
      pwaEnabled: validateEnv('ENABLE_PWA', 'true') === 'true',
    },
    
    // Geolocation
    geo: {
      mapboxAccessToken: validateEnv('MAPBOX_ACCESS_TOKEN'),
      defaultZoom: 10,
      defaultCenter: [78.9629, 20.5937], // India center
    },
    
    // Security
    security: {
      corsOrigin: validateEnv('CORS_ORIGIN', 'http://localhost:3000'),
      refreshTokenInterval: 1000 * 60 * 5, // 5 minutes
      tokenExpiryThreshold: 1000 * 60 * 5, // Refresh 5 min before expiry
    },
    
    // Logging
    logging: {
      level: (validateEnv('LOG_LEVEL', 'info') as AppConfig['logging']['level']),
      enableConsole: validateEnv('ENABLE_CONSOLE_LOGGING', 'true') === 'true',
    },
  };
};

// Export configuration singleton
export const config = buildConfig();

// Type guards
export const isProduction = (): boolean => config.environment === 'production';
export const isDevelopment = (): boolean => config.environment === 'development';

// Security helpers
export const getSecureHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // NEVER include API keys or tokens in headers at this level
  // Tokens are handled by Supabase client and axios interceptors
});

export default config;
