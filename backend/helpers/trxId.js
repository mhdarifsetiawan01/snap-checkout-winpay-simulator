function generateTrxId(prefix = "INV") {
    const timestamp = Date.now(); // waktu sekarang (ms)
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    // return `${prefix}-${timestamp}-${random}`;
    return `${prefix}-${timestamp}`;
  }

  function generateCustomerNo(prefix = "0896") {
    // const timestamp = Date.now(); // waktu sekarang (ms)
    const random = Math.floor(1000 + Math.random() * 99990000); // 8 digit random
    return `${prefix}${random}`;
  }

module.exports = { generateTrxId, generateCustomerNo };