/**
 * Generate timestamp modular
 * - format ISO +07:00
 * - jika minutesToAdd diisi, akan ditambahkan ke waktu sekarang
 * - default minutesToAdd = 0 (waktu sekarang)
 */
function generateTimestamp(minutesToAdd = 0) {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutesToAdd);
  
    // offset WIB +7 jam dari UTC
    const offset = 7 * 60; // menit
    const localDate = new Date(date.getTime() + offset * 60 * 1000);
  
    const yyyy = localDate.getUTCFullYear();
    const mm = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(localDate.getUTCDate()).padStart(2, "0");
    const hh = String(localDate.getUTCHours()).padStart(2, "0");
    const min = String(localDate.getUTCMinutes()).padStart(2, "0");
    const ss = String(localDate.getUTCSeconds()).padStart(2, "0");
  
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+07:00`;
  }
  
  module.exports = { generateTimestamp };
  