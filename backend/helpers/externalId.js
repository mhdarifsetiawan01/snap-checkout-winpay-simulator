function generateExternalId(prefix = "EXT") {
    const now = Date.now().toString(); // timestamp ms (13 digit)
    const random = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit random
    return `${now}${random}`.slice(-16); // contoh: 17308942451231234
}

module.exports = { generateExternalId };