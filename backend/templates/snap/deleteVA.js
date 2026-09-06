const { getKey } = require("../../helpers/storage");

function deleteVABody() {
  const virtualAccountNo = getKey("lastVirtualAccountNo");
  const channel = getKey("lastChannel");
  const contractId = getKey("lastContractId");
  const trxId = getKey("lastTrxId");

  if (!virtualAccountNo) {
    throw new Error("No. Virtual Account tidak ditemukan. Jalankan createVA dulu.");
  }

  return {
    virtualAccountNo: virtualAccountNo,
    trxId: trxId,
    additionalInfo: {
      contractId: contractId,
      channel: channel,
    },
  };
}

module.exports = { deleteVABody };
