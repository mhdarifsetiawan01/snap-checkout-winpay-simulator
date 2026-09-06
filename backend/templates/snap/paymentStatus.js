const { getKey } = require("../../helpers/storage");

function paymentStatusBody() {
  const virtualAccountNo = getKey("lastVirtualAccountNo");
  const channel = getKey("lastChannel");
  const contractId = getKey("lastContractId");
  const trxId = getKey("lastTrxId");

  if (!virtualAccountNo) {
    throw new Error("No. Virtual Account tidak ditemukan. Jalankan createVA dulu.");
  }

  if (!contractId) {
    throw new Error("ContractId tidak ditemukan. Jalankan createVA dulu.");
  }

  if (!channel) {
    throw new Error("Channel tidak ditemukan. Jalankan createVA dulu.");
  }

  return {
    virtualAccountNo: virtualAccountNo,
    additionalInfo: {
        contractId: contractId,
        channel: channel,
        trxId: trxId
    }
  };
}

module.exports = { paymentStatusBody };
