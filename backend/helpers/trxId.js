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

function resolveCleanVaNumber(vaData = {}) {
  if (typeof vaData === "string") {
    const raw = vaData.replace(/\s+/g, "");
    if (raw.length > 16 && raw.includes("727004")) {
      return raw.substring(raw.indexOf("727004"));
    }
    return raw;
  }

  const rawVa = String(vaData.virtualAccountNo || "").replace(/\s+/g, "");
  const rawCust = String(vaData.customerNo || "").replace(/\s+/g, "");

  // 1. If customerNo is already 14-18 digits (full valid VA number like in Development), use it
  if (rawCust.length >= 14 && rawCust.length <= 18) {
    return rawCust;
  }

  // 2. If rawVa is longer than 16 digits and contains a known bank VA prefix (e.g. Permata 727004), strip prefix
  if (rawVa.length > 16 && rawVa.includes("727004")) {
    const idx = rawVa.indexOf("727004");
    return rawVa.substring(idx);
  }

  // 3. If rawVa is standard 14-18 digits (like in Sandbox), use it
  if (rawVa.length >= 14 && rawVa.length <= 18) {
    return rawVa;
  }

  return rawCust || rawVa;
}

module.exports = { generateTrxId, generateCustomerNo, resolveCleanVaNumber };