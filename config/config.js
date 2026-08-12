require("dotenv").config();
const path = require("path");

/**
 * Ambil konfigurasi environment spesifik (dev/prod) untuk SNAP dan CHECKOUTPAGE
 */
const ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = ENV === "production";

// SNAP CONFIG
const SNAP_BASE_URL = IS_PRODUCTION
  ? process.env.SNAP_BASE_URL_PROD
  : process.env.SNAP_BASE_URL_DEV;

const SNAP_MERCHANT_KEY = IS_PRODUCTION
  ? process.env.SNAP_MERCHANT_KEY_PROD
  : process.env.SNAP_MERCHANT_KEY_DEV;

const PRIVATE_KEY_PATH = IS_PRODUCTION
  ? path.resolve(__dirname, "private_key_prod.pem")
  : path.resolve(__dirname, "private_key_dev.pem")

// Public key dari Winpay untuk verifikasi signature callback
const WINPAY_PUBLIC_KEY_PATH = IS_PRODUCTION
  ? path.resolve(__dirname, "winpay_public_key_prod.pem")
  : path.resolve(__dirname, "winpay_public_key_dev.pem")

// CHECKOUTPAGE CONFIG
const CHECKOUT_BASE_URL = IS_PRODUCTION
  ? process.env.CHECKOUT_BASE_URL_PROD
  : process.env.CHECKOUT_BASE_URL_DEV;

const CHECKOUT_CLIENT_KEY = IS_PRODUCTION
  ? process.env.CHECKOUT_CLIENT_KEY_PROD
  : process.env.CHECKOUT_CLIENT_KEY_DEV;

const CHECKOUT_SECRET_KEY = IS_PRODUCTION
  ? process.env.CHECKOUT_SECRET_KEY_PROD
  : process.env.CHECKOUT_SECRET_KEY_DEV;

const CONFIG = {
  env: ENV,
  isProduction: IS_PRODUCTION,
  APP_PORT: process.env.PORT || 3000,
  DEBUG: process.env.DEBUG === "true",

  // SNAP
  SNAP_BASE_URL,
  SNAP_MERCHANT_KEY,

  // Key paths
  PRIVATE_KEY_PATH,
  WINPAY_PUBLIC_KEY_PATH,

  // CHECKOUTPAGE
  CHECKOUT_BASE_URL,
  CHECKOUT_CLIENT_KEY,
  CHECKOUT_SECRET_KEY,

  // Public key DEV (disetor ke Winpay)
  PUBLIC_KEY_PATH: path.resolve(__dirname, "public_key_dev.pem"),
};

module.exports = CONFIG;
