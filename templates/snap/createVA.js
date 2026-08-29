const { generateTimestamp } = require("../../helpers/timestamp");
const { generateTrxId, generateCustomerNo } = require("../../helpers/trxId");

function createVABody() {
  return {
    customerNo: generateCustomerNo(),
    virtualAccountName: process.env.VA_NAME || "Gajah Mada",
    trxId: generateTrxId(),
    // trxId: "INV-000000023212x2221",
    totalAmount: {
      value: process.env.AMOUNT || "15000.00",
      currency: "IDR"
    },
    virtualAccountTrxType: "c",
    expiredDate: generateTimestamp(25),
    // expiredDate: "2025-11-06T16:43:19+07:00",
    additionalInfo: {
      channel: process.env.CHANNEL || "PERMATA",
    }
  };
}
// function createVABody() {
//   return {
//     virtualAccountName: "Ahmad Fauzi",
//     trxId: "INV-2025-00042",
//     totalAmount: {
//       value: "167000.00",
//       currency: "IDR"
//     },
//     virtualAccountTrxType: "c",
//     expiredDate: "2025-12-27T00:00:00+07:00",
//     additionalInfo: {
//       channel: "CIMB",
//       customerPhone: "088802666101",
//       customerName: "Ahmad Fauzi",
//       contractId: "05a2054f-fb62-4284-836c-d8f56010ebba",
//       isStatic: false
//     }
//   };
// }

function createQRISBody() {
  return {
    partnerReferenceNo: generateTrxId("ref"),
    // terminalId: "TERM GIGIH", // jika terminal ada yang lain
    // subMerchantId: "17000", // jika ingin generate qris untuk submerchant
    amount: {
      value: process.env.AMOUNT || "50000.00",
      currency: "IDR"
    },
    validityPeriod: generateTimestamp(5),
    additionalInfo: {
      isStatic: false
    }
  };
}
// function createQRISBody() {
//   return {
//     partnerReferenceNo: "QRIS-02200313-1764222024123",
//     // terminalId: "AUFANET",
//     amount: {
//       value: "166500",
//       currency: "IDR"
//     },
//     validityPeriod: "2025-12-31T12:40:24+07:00",
//     additionalInfo: {
//       isStatic: false
//     }
//   };
// }

module.exports = { createVABody, createQRISBody };
