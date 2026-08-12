require("dotenv").config();
const path = require("path");

/**
 * Environment: development | sandbox | production
 *
 * development → sandbox-api.bmstaging.id/snap (internal BMS staging)
 * sandbox     → sandbox-snap.winpay.id        (Winpay sandbox)
 * production  → snap.winpay.id                (Winpay production)
 */
const ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = ENV === "production";
const IS_SANDBOX    = ENV === "sandbox";
const IS_DEV        = !IS_PRODUCTION && !IS_SANDBOX; // development

// SNAP CONFIG
const SNAP_BASE_URL = IS_PRODUCTION
  ? process.env.SNAP_BASE_URL_PROD
  : IS_SANDBOX
    ? process.env.SNAP_BASE_URL_SANDBOX
    : process.env.SNAP_BASE_URL_DEV;

const SNAP_MERCHANT_KEY = IS_PRODUCTION
  ? process.env.SNAP_MERCHANT_KEY_PROD
  : process.env.SNAP_MERCHANT_KEY_DEV; // sandbox & dev pakai key yang sama

const PRIVATE_KEY_PATH = IS_PRODUCTION
  ? path.resolve(__dirname, "private_key_prod.pem")
  : path.resolve(__dirname, "private_key_dev.pem"); // sandbox & dev pakai key yang sama

// Public key dari Winpay untuk verifikasi signature callback masuk
const WINPAY_PUBLIC_KEY_PATH = IS_PRODUCTION
  ? path.resolve(__dirname, "winpay_public_key_prod.pem")
  : path.resolve(__dirname, "winpay_public_key_dev.pem");

// CHECKOUTPAGE CONFIG
const CHECKOUT_BASE_URL = IS_PRODUCTION
  ? process.env.CHECKOUT_BASE_URL_PROD
  : IS_SANDBOX
    ? process.env.CHECKOUT_BASE_URL_SANDBOX
    : process.env.CHECKOUT_BASE_URL_DEV;

const CHECKOUT_CLIENT_KEY = IS_PRODUCTION
  ? process.env.CHECKOUT_CLIENT_KEY_PROD
  : IS_SANDBOX
    ? process.env.CHECKOUT_CLIENT_KEY_SANDBOX
    : process.env.CHECKOUT_CLIENT_KEY_DEV;

const CHECKOUT_SECRET_KEY = IS_PRODUCTION
  ? process.env.CHECKOUT_SECRET_KEY_PROD
  : IS_SANDBOX
    ? process.env.CHECKOUT_SECRET_KEY_SANDBOX
    : process.env.CHECKOUT_SECRET_KEY_DEV;

const CONFIG = {
  env: ENV,
  isProduction: IS_PRODUCTION,
  isSandbox: IS_SANDBOX,
  isDev: IS_DEV,
  APP_PORT: process.env.PORT || 3000,
  DEBUG: process.env.DEBUG === "true",

  // SNAP
  SNAP_BASE_URL,
  SNAP_MERCHANT_KEY,

  // Key paths
  PRIVATE_KEY_PATH,
  WINPAY_PUBLIC_KEY_PATH,

  // Public key DEV (disetor ke Winpay)
  PUBLIC_KEY_PATH: path.resolve(__dirname, "public_key_dev.pem"),

  // CHECKOUTPAGE
  CHECKOUT_BASE_URL,
  CHECKOUT_CLIENT_KEY,
  CHECKOUT_SECRET_KEY,
};

module.exports = CONFIG;
