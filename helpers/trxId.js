function generateTrxId(prefix = "INV") {
    const timestamp = Date.now(); // waktu sekarang (ms)
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    // return `${prefix}-${timestamp}-${random}`;
    return `${prefix}-${timestamp}`;
  }

module.exports = { generateTrxId };