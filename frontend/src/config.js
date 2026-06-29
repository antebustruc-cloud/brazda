export const API = (process.env.REACT_APP_API_URL || '') + '/api';

// "Sign in with Google" - public client ID, safe to ship in frontend code.
export const GOOGLE_CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID';

// Phase 2 "Notify Nearby Buyers" - fully built, intentionally OFF until paid
// boosts are ready (Phase 4). Keep this in sync with backend NOTIFICATIONS_ENABLED.
export const FEATURES = {
  notifications: false,
};
