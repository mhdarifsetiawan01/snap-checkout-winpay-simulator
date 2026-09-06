'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'winpay_sim_env';
export const ENV_OPTIONS = ['development', 'sandbox', 'production'];

export function useEnv(defaultEnv = 'development') {
  const [env, setEnvState] = useState(defaultEnv);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ENV_OPTIONS.includes(saved)) {
        setEnvState(saved);
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const setEnv = (newEnv) => {
    if (ENV_OPTIONS.includes(newEnv)) {
      setEnvState(newEnv);
      try {
        localStorage.setItem(STORAGE_KEY, newEnv);
      } catch {
        // Ignore localStorage write errors
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('winpay-env-change', { detail: newEnv }));
      }
    }
  };

  useEffect(() => {
    const handleEnvChange = (e) => {
      if (e.detail && ENV_OPTIONS.includes(e.detail)) {
        setEnvState(e.detail);
      }
    };
    window.addEventListener('winpay-env-change', handleEnvChange);
    return () => window.removeEventListener('winpay-env-change', handleEnvChange);
  }, []);

  return [env, setEnv, isMounted];
}
