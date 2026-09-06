const { generateTimestamp } = require("../../helpers/timestamp");
const { generateTrxId } = require("../../helpers/trxId");

function createEwalletBody() {
  const rawAmount = process.env.AMOUNT || "10000.00";
  const amountValue = !isNaN(Number(rawAmount)) && !String(rawAmount).includes(".")
    ? Number(rawAmount).toFixed(2)
    : String(rawAmount);

  return {
    partnerReferenceNo: generateTrxId("EWL"),
    amount: {
      value: amountValue,
      currency: "IDR"
    },
    urlParam: [
      {
        url: process.env.CALLBACK_URL || "https://winpay.id",
        type: "PAY_NOTIFY",
        isDeeplink: "N"
      },
      {
        url: process.env.RETURN_URL || "https://winpay.id",
        type: "PAY_RETURN",
        isDeeplink: "N"
      }
    ],
    validUpTo: generateTimestamp(15),
    additionalInfo: {
      channel: process.env.CHANNEL || "SPAY",
      customerPhone: process.env.CUSTOMER_PHONE || "081234567890",
      customerName: process.env.CUSTOMER_NAME || "Budi Santoso"
    }
  };
}

module.exports = { createEwalletBody };
