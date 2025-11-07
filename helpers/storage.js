const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const file = path.join(__dirname, "../db.json");
const adapter = new FileSync(file);
const db = low(adapter);

// default data
db.defaults({
    lastContractId: null,
    lastTrxId: null,
    lastVirtualAccountNo: null,
    lastChannel: null
  }).write();

// simpan key apapun
function saveKey(key, value) {
    db.set(key, value).write();
  }
  
  // ambil key apapun
  function getKey(key) {
    return db.get(key).value();
  }

module.exports = { saveKey, getKey };
