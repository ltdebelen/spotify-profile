import { useEffect, useState } from 'react';
import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const useAuth = (code: string) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  // 1) exchange code → tokens
  useEffect(() => {
    if (!code) return;

    axios
      .post<LoginResponse>(`${SERVER_URL}/login`, { code })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);

        // remove ?code= from URL
        window.history.pushState({}, '', '/');
      })
      .catch((err) => {
        console.error('login error', err);
        window.location.href = '/';
      });
  }, [code]);

  // 2) refresh access token
  useEffect(() => {
    if (!refreshToken || !expiresIn) return;

    const interval = window.setInterval(
      () => {
        axios
          .post<LoginResponse>(`${SERVER_URL}/refresh`, { refreshToken })
          .then((res) => {
            setAccessToken(res.data.accessToken);
            setExpiresIn(res.data.expiresIn);
          })
          .catch((err) => {
            console.error('refresh error', err);
            window.location.href = '/';
          });
      },
      (expiresIn - 60) * 1000,
    ); // refresh 1 minute before expiry

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  return accessToken;
};

export default useAuth;
