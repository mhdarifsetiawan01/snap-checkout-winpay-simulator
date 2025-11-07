const chalk = require("chalk");
const util = require("util");

/**
 * Logger sederhana dengan pewarnaan dan timestamp otomatis
 * Menggunakan chalk v4 (CommonJS compatible)
 */

function formatMessage(level, colorFn, ...args) {
  const timestamp = new Date().toISOString();
  const msg = args
    .map(arg => (typeof arg === "object" ? util.inspect(arg, { depth: null, colors: true }) : arg))
    .join(" ");
  return `${chalk.gray(`[${timestamp}]`)} ${colorFn(`[${level}]`)} ${msg}`;
}

const logger = {
  info: (...args) => console.log(formatMessage("INFO", chalk.blue, ...args)),
  success: (...args) => console.log(formatMessage("SUCCESS", chalk.green, ...args)),
  warn: (...args) => console.warn(formatMessage("WARN", chalk.yellow, ...args)),
  error: (...args) => console.error(formatMessage("ERROR", chalk.red, ...args)),
  debug: (...args) => {
    if (process.env.DEBUG === "true") {
      console.log(formatMessage("DEBUG", chalk.gray, ...args));
    }
  },
};

module.exports = logger;
