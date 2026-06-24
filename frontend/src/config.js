export const API = (process.env.REACT_APP_API_URL || '') + '/api';

// Phase 2 "Notify Nearby Buyers" - fully built, intentionally OFF until paid
// boosts are ready (Phase 4). Keep this in sync with backend NOTIFICATIONS_ENABLED.
export const FEATURES = {
  notifications: false,
};
