const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const dns = require("dns");

// Prioritaskan IPv4 untuk menghindari timeout resolusi IPv6 pada endpoint Cloudflare
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const CONFIG = {
  get env() {
    return process.env.NODE_ENV || process.env.DEFAULT_ENV || "development";
  },
  get isProduction() {
    return this.env === "production";
  },
  get isSandbox() {
    return this.env === "sandbox";
  },
  get isDev() {
    return !this.isProduction && !this.isSandbox;
  },
  get APP_PORT() {
    return process.env.PORT || 3000;
  },
  get DEBUG() {
    return process.env.DEBUG === "true";
  },

  // SNAP
  get SNAP_BASE_URL() {
    return this.isProduction
      ? process.env.SNAP_BASE_URL_PROD
      : this.isSandbox
        ? process.env.SNAP_BASE_URL_SANDBOX
        : process.env.SNAP_BASE_URL_DEV;
  },
  get SNAP_MERCHANT_KEY() {
    if (this.isProduction) return process.env.SNAP_MERCHANT_KEY_PROD;
    if (this.isSandbox) return process.env.SNAP_MERCHANT_KEY_SANDBOX || process.env.SNAP_MERCHANT_KEY_DEV;
    return process.env.SNAP_MERCHANT_KEY_DEV || process.env.SNAP_MERCHANT_KEY_SANDBOX;
  },


  // Key paths
  get PRIVATE_KEY_PATH() {
    return this.isProduction
      ? path.resolve(__dirname, "private_key_prod.pem")
      : path.resolve(__dirname, "private_key_dev.pem");
  },
  get WINPAY_PUBLIC_KEY_PATH() {
    return this.isProduction
      ? path.resolve(__dirname, "winpay_public_key_prod.pem")
      : path.resolve(__dirname, "winpay_public_key_dev.pem");
  },
  get PUBLIC_KEY_PATH() {
    return path.resolve(__dirname, "public_key_dev.pem");
  },

  // CHECKOUTPAGE
  get CHECKOUT_BASE_URL() {
    return this.isProduction
      ? process.env.CHECKOUT_BASE_URL_PROD
      : this.isSandbox
        ? process.env.CHECKOUT_BASE_URL_SANDBOX
        : process.env.CHECKOUT_BASE_URL_DEV;
  },
  get CHECKOUT_CLIENT_KEY() {
    return this.isProduction
      ? process.env.CHECKOUT_CLIENT_KEY_PROD
      : this.isSandbox
        ? process.env.CHECKOUT_CLIENT_KEY_SANDBOX
        : process.env.CHECKOUT_CLIENT_KEY_DEV;
  },
  get CHECKOUT_SECRET_KEY() {
    return this.isProduction
      ? process.env.CHECKOUT_SECRET_KEY_PROD
      : this.isSandbox
        ? process.env.CHECKOUT_SECRET_KEY_SANDBOX
        : process.env.CHECKOUT_SECRET_KEY_DEV;
  },
  // IP Whitelist
  get ENABLE_IP_WHITELIST() {
    return process.env.ENABLE_IP_WHITELIST === "true" || process.env.ENABLE_IP_WHITELIST === "1";
  },
  get ALLOWED_IPS() {
    const raw = process.env.ALLOWED_IPS || "";
    return raw
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
  },
};

module.exports = CONFIG;

