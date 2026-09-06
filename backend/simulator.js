require("dotenv").config();
const logger = require("./helpers/logger");

// Services
const SERVICES = {
  snap: require("./services/snap"),
  checkoutpage: require("./services/checkoutpage")
};

// Templates
const TEMPLATES = {
  snap: {
    // VA
    createva: require("./templates/snap/createVA").createVABody,
    inquiryva: require("./templates/snap/inquiryVA").inquiryVABody,
    statusva: require("./templates/snap/paymentStatus").paymentStatusBody,
    deleteva: require("./templates/snap/deleteVA").deleteVABody,
    // QRIS
    createqris: require("./templates/snap/createQRIS").createQRISBody,
    // E-Wallet
    createewallet: require("./templates/snap/createEwallet").createEwalletBody,
  },
  checkoutpage: {
    createinvoice: require("./templates/checkoutpage/createInvoice").createInvoiceBody,
    findinvoice: require("./templates/checkoutpage/findInvoice").findInvoiceBody
  }
};

/**
 * Jalankan simulasi request
 * @param {string} serviceName - snap | checkoutpage
 * @param {string} type - create | inquiry | status | find | etc ...
 */
async function runSimulation(serviceName = "snap", type = "create", simulate = false) {
  const service = SERVICES[serviceName];
  const templateFn = TEMPLATES[serviceName]?.[type];

  if (!service) throw new Error(`Service "${serviceName}" tidak ditemukan`);
  if (!templateFn) throw new Error(`Type "${type}" tidak ditemukan untuk service "${serviceName}"`);

  // Generate payload dari template
  const payload = templateFn();

  // Panggil function sesuai type di service
  if (typeof service[type] === "function") {
    const result = await service[type](payload, simulate);
    if (result) logger.info("✅ Response:", JSON.stringify(result, null, 2));
    return result;
  }

  throw new Error(`Function untuk type "${type}" tidak diimplementasikan di service "${serviceName}"`);
}

// Ambil parameter dari command line
// contoh: node simulator.js snap create
const serviceName = process.argv[2] || "snap";
const type = process.argv[3] || "create";

runSimulation(serviceName, type, false)
  .then(res => {
    if (res) console.log("✅ Final Response:", res);
  })
  .catch(err => {
    logger.error("❌ Error:", err.response?.data || err.message);
  });
