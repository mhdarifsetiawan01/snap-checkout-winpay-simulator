'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'winpay_sim_env';
export const ENV_OPTIONS = ['development', 'sandbox', 'production'];
export const DEFAULT_ENV = process.env.NEXT_PUBLIC_DEFAULT_ENV || 'development';

export function useEnv(defaultEnv = DEFAULT_ENV) {
  const [env, setEnvState] = useState(defaultEnv);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ENV_OPTIONS.includes(saved)) {
        setEnvState(saved);
      } else {
        setEnvState(defaultEnv);
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, [defaultEnv]);

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

const CHECKOUT_CLIENT_KEY_STORAGE = 'winpay_custom_checkout_client_key';
const CHECKOUT_SECRET_KEY_STORAGE = 'winpay_custom_checkout_secret_key';

export function useCustomCheckoutCredentials() {
  const [customClientKey, setCustomClientKeyState] = useState('');
  const [customSecretKey, setCustomSecretKeyState] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedClient = localStorage.getItem(CHECKOUT_CLIENT_KEY_STORAGE);
      const savedSecret = localStorage.getItem(CHECKOUT_SECRET_KEY_STORAGE);
      if (savedClient) setCustomClientKeyState(savedClient);
      if (savedSecret) setCustomSecretKeyState(savedSecret);
    } catch {}
  }, []);

  const setCustomCredentials = (clientKey, secretKey) => {
    const cleanClient = String(clientKey || '').trim();
    const cleanSecret = String(secretKey || '').trim();
    setCustomClientKeyState(cleanClient);
    setCustomSecretKeyState(cleanSecret);
    try {
      if (cleanClient) {
        localStorage.setItem(CHECKOUT_CLIENT_KEY_STORAGE, cleanClient);
      } else {
        localStorage.removeItem(CHECKOUT_CLIENT_KEY_STORAGE);
      }
      if (cleanSecret) {
        localStorage.setItem(CHECKOUT_SECRET_KEY_STORAGE, cleanSecret);
      } else {
        localStorage.removeItem(CHECKOUT_SECRET_KEY_STORAGE);
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('winpay-checkout-cred-change', {
        detail: { clientKey: cleanClient, secretKey: cleanSecret }
      }));
    }
  };

  useEffect(() => {
    const handleCredChange = (e) => {
      if (e.detail) {
        setCustomClientKeyState(e.detail.clientKey || '');
        setCustomSecretKeyState(e.detail.secretKey || '');
      }
    };
    window.addEventListener('winpay-checkout-cred-change', handleCredChange);
    return () => window.removeEventListener('winpay-checkout-cred-change', handleCredChange);
  }, []);

  return [{ clientKey: customClientKey, secretKey: customSecretKey }, setCustomCredentials, isMounted];
}
