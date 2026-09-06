const { generateTimestamp } = require("../../helpers/timestamp");
const { generateTrxId } = require("../../helpers/trxId");

function createQRISBody() {
  const rawAmount = process.env.AMOUNT || "50000.00";
  const amountValue = !isNaN(Number(rawAmount)) && !String(rawAmount).includes(".")
    ? Number(rawAmount).toFixed(2)
    : String(rawAmount);

  return {
    partnerReferenceNo: generateTrxId("ref"),
    // terminalId: "TERM GIGIH", // jika terminal ada yang lain
    // subMerchantId: "17000", // jika ingin generate qris untuk submerchant
    amount: {
      value: amountValue,
      currency: "IDR"
    },
    validityPeriod: generateTimestamp(5),
    additionalInfo: {
      isStatic: false
    }
  };
}

module.exports = { createQRISBody };
