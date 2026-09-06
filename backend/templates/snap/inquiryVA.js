const { getKey } = require("../../helpers/storage");

function inquiryVABody() {
  const contractId = getKey("lastContractId");
  const trxId = getKey("lastTrxId");

  if (!contractId) {
    throw new Error("ContractId tidak ditemukan. Jalankan createVA dulu.");
  }

  return {
    trxId: trxId,
    additionalInfo: {
      contractId: contractId,
    },
  };
}

module.exports = { inquiryVABody };
