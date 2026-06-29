import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { API, GOOGLE_CLIENT_ID } from '../config';

// Renders Google's own "Sign in with Google" button. Works for both new
// (creates a buyer account) and returning users - same one-click flow.
function GoogleSignInButton() {
  const divRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REPLACE_WITH')) return;

    const handleCredential = async (response) => {
      try {
        const res = await axios.post(`${API}/users/google-login/`, { id_token: response.credential });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        window.location.href = '/dashboard';
      } catch (err) {
        console.log('Google login failed', err.response?.data);
      }
    };

    const renderButton = () => {
      if (!window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      });
    };

    if (window.google) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          renderButton();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REPLACE_WITH')) return null;

  return (
    <div className="d-flex justify-content-center my-3" ref={divRef} />
  );
}

export default GoogleSignInButton;
