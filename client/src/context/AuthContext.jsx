import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { setAccessToken } from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/me');
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Could not refresh profile from API:', err.message);
    }
  };

  useEffect(() => {
    // Attempt session restoration via httpOnly refresh token cookie
    let isMounted = true;

    async function initSession() {
      try {
        const res = await api.post('/auth/refresh');
        if (isMounted && res?.accessToken && res?.user) {
          setAccessToken(res.accessToken);
          setUser(res.user);
        }
      } catch (err) {
        // Not logged in or expired refresh token
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res?.accessToken && res?.user) {
      setAccessToken(res.accessToken);
      setUser(res.user);
    }
    return res.user;
  };

  const signup = async (email, password, fullName) => {
    const res = await api.post('/auth/signup', { email, password, fullName });
    if (res?.accessToken && res?.user) {
      setAccessToken(res.accessToken);
      setUser(res.user);
    }
    return res.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    profile: user,
    role: user?.role || 'citizen',
    department: user?.departments || null,
    departmentId: user?.department_id || null,
    loading,
    login,
    signup,
    logout,
    refreshProfile: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
