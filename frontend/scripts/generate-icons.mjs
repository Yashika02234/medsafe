// Generates the PWA app icons as raw PNGs — no image library dependency.
// Draws a flat brand-blue square with a white cross (the Midnight Safe accent
// color, --ms-acc #4F8EFF), since adding an image-processing package for two
// static icon files isn't justified. Re-run with `node scripts/generate-icons.mjs`
// if the icon design ever needs to change.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const ACCENT = [0x4f, 0x8e, 0xff]; // --ms-acc
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  // Cross arm bounds — kept within the central ~50% as a maskable-safe zone.
  const armThickness = size * 0.22;
  const armStart = (size - size * 0.56) / 2;
  const armEnd = armStart + size * 0.56;
  const cMin = (size - armThickness) / 2;
  const cMax = cMin + armThickness;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inHorizontalArm = y >= cMin && y < cMax && x >= armStart && x < armEnd;
      const inVerticalArm = x >= cMin && x < cMax && y >= armStart && y < armEnd;
      const isCross = inHorizontalArm || inVerticalArm;
      const [r, g, b] = isCross ? WHITE : ACCENT;
      const i = (y * size + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // filter type: none
    pixels.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, drawIcon(size));
  console.log(`wrote public/icons/icon-${size}.png`);
}
writeFileSync("public/icons/apple-touch-icon.png", drawIcon(180));
console.log("wrote public/icons/apple-touch-icon.png");
