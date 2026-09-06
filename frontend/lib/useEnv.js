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

const PARTNER_ID_STORAGE_KEY = 'winpay_custom_partner_id';

export function useCustomPartnerId() {
  const [customPartnerId, setCustomPartnerIdState] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(PARTNER_ID_STORAGE_KEY);
      if (saved) setCustomPartnerIdState(saved);
    } catch {}
  }, []);

  const setCustomPartnerId = (id) => {
    const cleanId = String(id || '').trim();
    setCustomPartnerIdState(cleanId);
    try {
      if (cleanId) {
        localStorage.setItem(PARTNER_ID_STORAGE_KEY, cleanId);
      } else {
        localStorage.removeItem(PARTNER_ID_STORAGE_KEY);
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('winpay-partner-id-change', { detail: cleanId }));
    }
  };

  useEffect(() => {
    const handleIdChange = (e) => {
      setCustomPartnerIdState(e.detail || '');
    };
    window.addEventListener('winpay-partner-id-change', handleIdChange);
    return () => window.removeEventListener('winpay-partner-id-change', handleIdChange);
  }, []);

  return [customPartnerId, setCustomPartnerId, isMounted];
}

