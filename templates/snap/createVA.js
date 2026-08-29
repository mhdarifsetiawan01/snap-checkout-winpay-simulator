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

module.exports = { createVABody };

