const { generateTimestamp } = require("../../helpers/timestamp");
const { generateTrxId, generateCustomerNo } = require("../../helpers/trxId");

function createVABody() {
  const rawAmount = process.env.AMOUNT || "15000.00";
  const amountValue = !isNaN(Number(rawAmount)) && !String(rawAmount).includes(".")
    ? Number(rawAmount).toFixed(2)
    : String(rawAmount);

  return {
    customerNo: generateCustomerNo(),
    virtualAccountName: process.env.VA_NAME || "Gajah Mada",
    trxId: generateTrxId(),
    totalAmount: {
      value: amountValue,
      currency: "IDR"
    },
    virtualAccountTrxType: "c",
    expiredDate: generateTimestamp(5),
    additionalInfo: {
      channel: process.env.CHANNEL || "PERMATA",
    }
  };
}

module.exports = { createVABody };


