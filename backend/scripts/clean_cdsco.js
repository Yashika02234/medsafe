#!/usr/bin/env node
/**
 * backend/scripts/clean_cdsco.js
 *
 * Transforms backend/data/cdsco_raw.csv → frontend/public/data/cdsco.json
 *
 * Input:  253,973-row CSV from junioralive/Indian-Medicine-Dataset
 * Output: JSON array of { name, mfr, salts[] } for Fuse.js client-side search
 *
 * Run: node backend/scripts/clean_cdsco.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const INPUT_PATH  = path.resolve(__dirname, '../data/cdsco_raw.csv');
const OUTPUT_PATH = path.resolve(__dirname, '../../frontend/public/data/cdsco.json');

/**
 * Extract a clean salt name from a raw composition string.
 * Strips dosage/percentage notation and normalises whitespace.
 *
 * Examples:
 *   "Ibuprofen (400mg)"          → "Ibuprofen"
 *   "Amoxycillin  (500mg) "      → "Amoxycillin"
 *   "  Clavulanic Acid (125mg)"  → "Clavulanic Acid"
 *   "Phenylephrine (0.10% w/w)"  → "Phenylephrine"
 *   "Azithromycin (500mg)"       → "Azithromycin"
 */
function extractSaltName(raw) {
  if (!raw || !raw.trim()) return null;

  // Normalise internal whitespace first
  const s = raw.trim().replace(/\s+/g, ' ');

  // Strip everything from the first '(' onwards (that's the dosage)
  const parenIdx = s.indexOf('(');
  const name = parenIdx > -1 ? s.slice(0, parenIdx).trim() : s;

  return name || null;
}

/**
 * Split a CSV line into exactly 9 fields, tolerating extra commas
 * that may appear inside the last (composition2) field.
 * Fields: id, name, price, discontinued, manufacturer, type, pack, comp1, comp2
 */
function parseLine(line) {
  // Find the positions of the first 8 commas, then take the rest as field 8
  const fields = [];
  let start = 0;
  let commasFound = 0;

  for (let i = 0; i < line.length && commasFound < 8; i++) {
    if (line[i] === ',') {
      fields.push(line.slice(start, i));
      start = i + 1;
      commasFound++;
    }
  }
  fields.push(line.slice(start)); // field 8 = everything after 8th comma

  return fields;
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`ERROR: Input file not found: ${INPUT_PATH}`);
    console.error('Run this first: download the raw CSV with curl or from the README.');
    process.exit(1);
  }

  console.log(`Input:  ${INPUT_PATH}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log('Processing...\n');

  const fileStream = fs.createReadStream(INPUT_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const results = [];
  let lineNum = 0;
  const stats = {
    total: 0,
    skippedDiscontinued: 0,
    skippedNonAllopathy: 0,
    skippedNoSalt: 0,
    singleSalt: 0,
    twoSalts: 0,
  };

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // skip header

    const parts = parseLine(line);
    if (parts.length < 8) continue;

    stats.total++;

    const discontinued = parts[3].trim().toUpperCase() === 'TRUE';
    if (discontinued) { stats.skippedDiscontinued++; continue; }

    const type = parts[5].trim().toLowerCase();
    if (type !== 'allopathy') { stats.skippedNonAllopathy++; continue; }

    const salt1 = extractSaltName(parts[7]);
    if (!salt1) { stats.skippedNoSalt++; continue; }

    const salt2 = extractSaltName(parts[8]);

    const salts = salt2 ? [salt1, salt2] : [salt1];
    const name  = parts[1].trim().replace(/\s+/g, ' ');
    const mfr   = parts[4].trim().replace(/\s+/g, ' ');

    results.push({ name, mfr, salts });

    if (salts.length === 2) stats.twoSalts++;
    else stats.singleSalt++;
  }

  // Deduplicate: remove entries where both name and salts are identical
  // (Source data has duplicate rows for the same medicine)
  const seen = new Set();
  const deduped = results.filter(r => {
    const key = r.name + '|' + r.salts.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const dupCount = results.length - deduped.length;

  // Write output
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(deduped), 'utf8');

  const outputBytes = fs.statSync(OUTPUT_PATH).size;
  const outputMB    = (outputBytes / 1024 / 1024).toFixed(2);

  console.log('=== CDSCO Cleaning Report ===');
  console.log(`Total input rows:          ${stats.total.toLocaleString()}`);
  console.log(`Skipped (discontinued):    ${stats.skippedDiscontinued.toLocaleString()}`);
  console.log(`Skipped (non-allopathy):   ${stats.skippedNonAllopathy.toLocaleString()}`);
  console.log(`Skipped (no salt found):   ${stats.skippedNoSalt.toLocaleString()}`);
  console.log(`Deduplicated (exact dups): ${dupCount.toLocaleString()}`);
  console.log(`─────────────────────────────`);
  console.log(`Output entries:            ${deduped.length.toLocaleString()}`);
  console.log(`  Single-salt medicines:   ${stats.singleSalt.toLocaleString()}`);
  console.log(`  Two-salt medicines:      ${stats.twoSalts.toLocaleString()}`);
  console.log(`Output file size:          ${outputMB} MB (uncompressed)`);
  console.log(`                           ~${(outputBytes * 0.25 / 1024 / 1024).toFixed(2)} MB (estimated gzip)`);
  console.log(`\nOutput: ${OUTPUT_PATH}`);

  // Sample output for verification
  console.log('\n=== Sample Output (first 5 entries) ===');
  deduped.slice(0, 5).forEach(r => console.log(JSON.stringify(r)));
  console.log('\n=== Sample Combination Drugs ===');
  deduped.filter(r => r.salts.length > 1).slice(0, 5).forEach(r => console.log(JSON.stringify(r)));
}

main().catch(err => { console.error(err); process.exit(1); });
