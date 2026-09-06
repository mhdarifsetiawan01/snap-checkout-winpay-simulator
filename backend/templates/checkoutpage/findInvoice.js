const { getKey } = require("../../helpers/storage");

function findInvoiceBody() {
  // ambil invoice id terakhir yang disimpan saat create invoice
  const lastInvoiceId = getKey("lastInvoiceId");

  if (!lastInvoiceId) {
    throw new Error("Tidak ada lastInvoiceId tersimpan di db.json");
  }

  // kita return id saja, karena findInvoice pakai method GET dan butuh id di path
  return lastInvoiceId;
}

module.exports = { findInvoiceBody };
