// const { generateTrxId } = require("../helpers/trxId");

function createInvoiceBody(defaults = {}) {
  return {
    customer: {
      name: defaults.name || "Contoh Nama",
      email: defaults.email || "",
      phone: defaults.phone || "08123456789"
    },
    invoice: {
      ref: defaults.ref || `INV-${Date.now()}`,
      products: defaults.products || [
        { name: "Produk A", qty: 1, price: 100000 }
      ]
    },
    back_url: defaults.back_url || "https://your-invoice-url.com",
    interval: defaults.interval || 60
  };
}

module.exports = { createInvoiceBody };
