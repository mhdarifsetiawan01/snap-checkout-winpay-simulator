// const { generateTrxId } = require("../helpers/trxId");

function createInvoiceBody(defaults = {}) {
  const price = process.env.PRICE ? Number(process.env.PRICE) : (defaults.price || 100000);
  const productName = process.env.PRODUCT_NAME || defaults.productName || "Produk A";
  const customerName = process.env.CUSTOMER_NAME || defaults.name || "Contoh Nama";
  const phone = process.env.PHONE || defaults.phone || "08123456789";

  return {
    customer: {
      name: customerName,
      email: defaults.email || "",
      phone: phone
    },
    invoice: {
      ref: defaults.ref || `INV-${Date.now()}`,
      products: defaults.products || [
        { name: productName, qty: 1, price: price }
      ]
    },
    back_url: defaults.back_url || "https://your-invoice-url.com",
    interval: defaults.interval || 60
  };
}

module.exports = { createInvoiceBody };
