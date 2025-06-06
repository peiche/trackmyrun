// Garmin Connect OAuth configuration and utilities
export const GARMIN_CONFIG = {
  // These would be your actual Garmin Connect IQ app credentials
  CLIENT_ID: import.meta.env.VITE_GARMIN_CLIENT_ID || 'your-garmin-client-id',
  CLIENT_SECRET: import.meta.env.VITE_GARMIN_CLIENT_SECRET || 'your-garmin-client-secret',
  REDIRECT_URI: `${window.location.origin}/auth/garmin/callback`,
  
  // Garmin Connect OAuth endpoints
  AUTHORIZATION_URL: 'https://connect.garmin.com/oauthConfirm',
  TOKEN_URL: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  
  // API endpoints
  API_BASE_URL: 'https://connectapi.garmin.com',
  
  // OAuth scopes
  SCOPE: 'read'
};

export interface GarminTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface GarminUserProfile {
  userId: string;
  userAccessLevel: string;
  userName: string;
  locale: string;
}

// Generate OAuth authorization URL
export const generateAuthUrl = (): string => {
  const params = new URLSearchParams({
    oauth_consumer_key: GARMIN_CONFIG.CLIENT_ID,
    oauth_callback: GARMIN_CONFIG.REDIRECT_URI,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: generateNonce(),
    oauth_version: '1.0'
  });

  return `${GARMIN_CONFIG.AUTHORIZATION_URL}?${params.toString()}`;
};

// Generate a random nonce for OAuth
const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Exchange authorization code for access tokens
export const exchangeCodeForTokens = async (
  oauthToken: string, 
  oauthVerifier: string
): Promise<GarminTokens> => {
  const response = await fetch('/api/garmin/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
};

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken: string): Promise<GarminTokens> => {
  const response = await fetch('/api/garmin/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
};

// Get user profile from Garmin Connect
export const getUserProfile = async (accessToken: string): Promise<GarminUserProfile> => {
  const response = await fetch('/api/garmin/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  return response.json();
};

// Get activities from Garmin Connect
export const getActivities = async (
  accessToken: string, 
  start: number = 0, 
  limit: number = 20
): Promise<any[]> => {
  const response = await fetch(`/api/garmin/activities?start=${start}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get activities');
  }

  return response.json();
};

// Get detailed activity data
export const getActivityDetails = async (
  accessToken: string, 
  activityId: string
): Promise<any> => {
  const response = await fetch(`/api/garmin/activities/${activityId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get activity details');
  }

  return response.json();
};