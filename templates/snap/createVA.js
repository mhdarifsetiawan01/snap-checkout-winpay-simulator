const { generateTimestamp } = require("../../helpers/timestamp");
const { generateTrxId } = require("../../helpers/trxId");

function createVABody() {
  return {
    // customerNo: "089601014551",
    virtualAccountName: "Gajah Mada",
    trxId: generateTrxId(),
    // trxId: "INV-000000023212x2221",
    totalAmount: {
        value: "25000.00",
        currency: "IDR"
    },
    virtualAccountTrxType: "c",
    expiredDate: generateTimestamp(5),
    // expiredDate: "2025-11-06T16:43:19+07:00",
    additionalInfo: {
        channel: "BRI"
    }
  };
}

function createQRISBody() {
  return {
    partnerReferenceNo: generateTrxId("ref"),
    // terminalId: "TERM GIGIH", // jika terminal ada yang lain
    // subMerchantId: "17000", // jika ingin generate qris untuk submerchant
    amount: {
      value: "50000.00",
      currency: "IDR"
    },
    validityPeriod: generateTimestamp(3),
    additionalInfo: {
      isStatic: false
  }
  };
}

module.exports = { createVABody, createQRISBody };
