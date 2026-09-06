const { generateTrxId } = require("../../helpers/trxId");

/**
 * Body generator untuk Report Transaction List (SNAP BI - Service Code 12)
 * POST /v1.0/transaction-history-list
 * @param {Object} defaults
 */
function transactionListBody(defaults = {}) {
  const partnerReferenceNo = defaults.partnerReferenceNo || generateTrxId("RPT");

  // Format default: 7 hari terakhir jika tidak ditentukan
  const now = new Date();
  const past7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const formatIsoWithOffset = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
  };

  const fromDateTime = defaults.fromDateTime || formatIsoWithOffset(past7Days);
  const toDateTime = defaults.toDateTime || formatIsoWithOffset(now);
  const pageSize = Math.max(10, defaults.pageSize ? Number(defaults.pageSize) : 10);
  const pageNumber = defaults.pageNumber ? Math.max(1, Number(defaults.pageNumber)) : 1;

  return {
    partnerReferenceNo,
    fromDateTime,
    toDateTime,
    pageSize,
    pageNumber,
  };
}

module.exports = { transactionListBody };
