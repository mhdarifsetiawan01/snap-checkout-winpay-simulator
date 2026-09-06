const { getKey } = require("../../helpers/storage");

function paymentStatusBody() {
  const customerNo = getKey("lastCustomerNo");
  const virtualAccountNo = getKey("lastVirtualAccountNo");
  const channel = getKey("lastChannel");
  const contractId = getKey("lastContractId");
  const trxId = getKey("lastTrxId");

  const targetVa = (customerNo || virtualAccountNo || "").trim();

  if (!targetVa) {
    throw new Error("No. Virtual Account tidak ditemukan. Jalankan createVA dulu.");
  }

  if (!contractId) {
    throw new Error("ContractId tidak ditemukan. Jalankan createVA dulu.");
  }

  if (!channel) {
    throw new Error("Channel tidak ditemukan. Jalankan createVA dulu.");
  }

  return {
    virtualAccountNo: targetVa,
    additionalInfo: {
        contractId: contractId,
        channel: channel,
        trxId: trxId
    }
  };
}

module.exports = { paymentStatusBody };
