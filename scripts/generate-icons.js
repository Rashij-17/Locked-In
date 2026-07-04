const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let crc = -1;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const combined = Buffer.concat([t, data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(combined));
  return Buffer.concat([len, t, data, c]);
}

function createPNG(width, height, bgHex, fgHex) {
  const bgR = parseInt(bgHex.slice(1,3), 16), bgG = parseInt(bgHex.slice(3,5), 16), bgB = parseInt(bgHex.slice(5,7), 16);
  const fgR = parseInt(fgHex.slice(1,3), 16), fgG = parseInt(fgHex.slice(3,5), 16), fgB = parseInt(fgHex.slice(5,7), 16);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const cx = width / 2, cy = height / 2, outerR = width * 0.42, innerR = width * 0.28;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      let R, G, B;
      if (dist < innerR) {
        // Inner circle: slightly lighter accent
        R = Math.min(255, fgR + 30); G = Math.min(255, fgG + 30); B = Math.min(255, fgB + 30);
      } else if (dist < outerR) {
        // Ring: accent color
        R = fgR; G = fgG; B = fgB;
      } else {
        // Background
        R = bgR; G = bgG; B = bgB;
      }
      row[1 + x * 3] = R; row[2 + x * 3] = G; row[3 + x * 3] = B;
    }
    rows.push(row);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows));
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync('public/icons', { recursive: true });
fs.mkdirSync('public/sounds', { recursive: true });

const bg = '#F5F0E8', fg = '#5B7E6E';
fs.writeFileSync('public/icons/icon-192.png', createPNG(192, 192, bg, fg));
console.log('Created public/icons/icon-192.png');
fs.writeFileSync('public/icons/icon-512.png', createPNG(512, 512, bg, fg));
console.log('Created public/icons/icon-512.png');

// Favicon: minimal ICO wrapping a 32x32 PNG
const png32 = createPNG(32, 32, bg, fg);
const ico = Buffer.alloc(6 + 16 + png32.length);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico[6] = 32; ico[7] = 32; ico[8] = 0; ico[9] = 0;
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png32.length, 14);
ico.writeUInt32LE(22, 18);
png32.copy(ico, 22);
fs.writeFileSync('public/favicon.ico', ico);
console.log('Created public/favicon.ico');
console.log('NOTE: public/sounds/reminder.mp3 directory created but file is missing — add a real MP3 manually.');
