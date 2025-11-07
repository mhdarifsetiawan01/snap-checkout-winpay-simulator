const { generateTimestamp } = require("../../helpers/timestamp");
const { generateTrxId } = require("../../helpers/trxId");

function createVABody() {
  return {
    customerNo: "089601014551",
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

module.exports = { createVABody };
