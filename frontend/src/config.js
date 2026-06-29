export const API = (process.env.REACT_APP_API_URL || '') + '/api';

// "Sign in with Google" - public client ID, safe to ship in frontend code.
export const GOOGLE_CLIENT_ID = '618724278094-2e2t4ddpsnvla3ue6lf76njcc6so1u89.apps.googleusercontent.com';

// Phase 2 "Notify Nearby Buyers" - fully built, intentionally OFF until paid
// boosts are ready (Phase 4). Keep this in sync with backend NOTIFICATIONS_ENABLED.
export const FEATURES = {
  notifications: false,
};
