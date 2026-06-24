import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API } from '../config';

const AuthContext = createContext(null);

// A single axios instance, used everywhere - automatically attaches the
// bearer token and clears the session on a 401 (token expired/invalid).
export const api = axios.create({ baseURL: API });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('access_token');
      if (stored) {
        setToken(stored);
        await loadProfile(stored);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    const responseInterceptor = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        if (err.response?.status === 401) {
          await logout();
        }
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.request.eject(interceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadProfile = async (accessToken) => {
    try {
      const res = await axios.get(`${API}/users/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setIsSeller(!!res.data.is_seller);
    } catch (err) {
      setIsSeller(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API}/users/login/`, { email, password });
    await AsyncStorage.setItem('access_token', res.data.access);
    await AsyncStorage.setItem('refresh_token', res.data.refresh);
    setToken(res.data.access);
    await loadProfile(res.data.access);
  };

  const register = async (payload) => {
    await axios.post(`${API}/users/register/`, payload);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    setToken(null);
    setIsSeller(false);
  };

  return (
    <AuthContext.Provider value={{ token, isSeller, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
