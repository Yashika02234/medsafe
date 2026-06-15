#!/usr/bin/env node
/**
 * P0-T3: RxNorm API Validation
 *
 * Measures resolution rate + p50/p95/p99 latency for 50 Indian drug salt names.
 * Uses built-in https — no npm packages required.
 *
 * Run: node backend/scripts/validate_rxnorm.js
 * Output: backend/scripts/rxnorm-results.json (raw) + console summary
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// 50 test names in 4 groups:
// A: Common salts that should resolve to RxCUI
// B: Indian spelling variants (diverge from US INN)
// C: India-specific drugs (may not exist in RxNorm)
// D: Additional common salts
const TEST_NAMES = [
  // -- Group A: Common salts (expected: resolve) --------------------------------
  { name: 'Paracetamol',        group: 'A', expect: 'resolve' },
  { name: 'Ibuprofen',          group: 'A', expect: 'resolve' },
  { name: 'Aspirin',            group: 'A', expect: 'resolve' },
  { name: 'Metformin',          group: 'A', expect: 'resolve' },
  { name: 'Glimepiride',        group: 'A', expect: 'resolve' },
  { name: 'Atorvastatin',       group: 'A', expect: 'resolve' },
  { name: 'Amlodipine',         group: 'A', expect: 'resolve' },
  { name: 'Telmisartan',        group: 'A', expect: 'resolve' },
  { name: 'Pantoprazole',       group: 'A', expect: 'resolve' },
  { name: 'Omeprazole',         group: 'A', expect: 'resolve' },
  { name: 'Azithromycin',       group: 'A', expect: 'resolve' },
  { name: 'Ciprofloxacin',      group: 'A', expect: 'resolve' },
  { name: 'Cephalexin',         group: 'A', expect: 'resolve' },
  { name: 'Cetirizine',         group: 'A', expect: 'resolve' },
  { name: 'Montelukast',        group: 'A', expect: 'resolve' },
  { name: 'Fexofenadine',       group: 'A', expect: 'resolve' },
  { name: 'Alprazolam',         group: 'A', expect: 'resolve' },
  { name: 'Diazepam',           group: 'A', expect: 'resolve' },
  { name: 'Atenolol',           group: 'A', expect: 'resolve' },
  { name: 'Metoprolol',         group: 'A', expect: 'resolve' },
  { name: 'Rosuvastatin',       group: 'A', expect: 'resolve' },
  { name: 'Clopidogrel',        group: 'A', expect: 'resolve' },
  { name: 'Losartan',           group: 'A', expect: 'resolve' },
  { name: 'Hydrochlorothiazide',group: 'A', expect: 'resolve' },
  { name: 'Ranitidine',         group: 'A', expect: 'resolve' },

  // -- Group B: Indian spelling variants (INN vs USP) ---------------------------
  { name: 'Amoxycillin',        group: 'B', expect: 'variant', usName: 'Amoxicillin'      },
  { name: 'Salbutamol',         group: 'B', expect: 'variant', usName: 'Albuterol'         },
  { name: 'Levosalbutamol',     group: 'B', expect: 'variant', usName: 'Levalbuterol'      },
  { name: 'Thyroxine',          group: 'B', expect: 'variant', usName: 'Levothyroxine'     },
  { name: 'Lignocaine',         group: 'B', expect: 'variant', usName: 'Lidocaine'         },
  { name: 'Adrenaline',         group: 'B', expect: 'variant', usName: 'Epinephrine'       },
  { name: 'Noradrenaline',      group: 'B', expect: 'variant', usName: 'Norepinephrine'    },
  { name: 'Pethidine',          group: 'B', expect: 'variant', usName: 'Meperidine'        },
  { name: 'Frusemide',          group: 'B', expect: 'variant', usName: 'Furosemide'        },
  { name: 'Clonazepam',         group: 'B', expect: 'resolve', usName: 'same'              },

  // -- Group C: India-specific drugs (may not be in RxNorm) --------------------
  { name: 'Aceclofenac',        group: 'C', expect: 'unknown' },
  { name: 'Nimesulide',         group: 'C', expect: 'unknown' },
  { name: 'Doxofylline',        group: 'C', expect: 'unknown' },
  { name: 'Etoricoxib',         group: 'C', expect: 'unknown' },
  { name: 'Torsemide',          group: 'C', expect: 'unknown' },

  // -- Group D: Additional common salts -----------------------------------------
  { name: 'Sertraline',         group: 'D', expect: 'resolve' },
  { name: 'Fluoxetine',         group: 'D', expect: 'resolve' },
  { name: 'Amitriptyline',      group: 'D', expect: 'resolve' },
  { name: 'Tramadol',           group: 'D', expect: 'resolve' },
  { name: 'Codeine',            group: 'D', expect: 'resolve' },
  { name: 'Warfarin',           group: 'D', expect: 'resolve' },
  { name: 'Digoxin',            group: 'D', expect: 'resolve' },
  { name: 'Lisinopril',         group: 'D', expect: 'resolve' },
  { name: 'Ramipril',           group: 'D', expect: 'resolve' },
  { name: 'Spironolactone',     group: 'D', expect: 'resolve' },
];

/**
 * GET https://rxnav.nlm.nih.gov/REST/rxcui.json?name={name}&search=2
 * search=2 = approximate matching (best for spelling variants)
 * Returns: { rxcui: string|null, latency_ms: number }
 */
function queryRxNorm(name) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(name);
    const options = {
      hostname: 'rxnav.nlm.nih.gov',
      path: `/REST/rxcui.json?name=${encoded}&search=2`,
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'MedSafe-Research/1.0' },
      timeout: 10000,
    };

    const t0 = Date.now();
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const latency = Date.now() - t0;
        try {
          const json = JSON.parse(body);
          const ids = json?.idGroup?.rxnormId;
          const rxcui = Array.isArray(ids) && ids.length > 0 ? ids[0] : null;
          resolve({ rxcui, latency_ms: latency, status: res.statusCode });
        } catch {
          resolve({ rxcui: null, latency_ms: latency, status: res.statusCode, error: 'parse_error' });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function percentile(sortedArr, p) {
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('P0-T3: RxNorm API Validation');
  console.log(`Testing ${TEST_NAMES.length} drug names sequentially`);
  console.log('Endpoint: rxnav.nlm.nih.gov/REST/rxcui.json?search=2\n');

  const results = [];
  const failed  = [];

  for (let i = 0; i < TEST_NAMES.length; i++) {
    const entry = TEST_NAMES[i];
    process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${TEST_NAMES.length}] ${entry.name.padEnd(24)} `);

    let result;
    try {
      result = await queryRxNorm(entry.name);
    } catch (err) {
      result = { rxcui: null, latency_ms: -1, error: err.message };
    }

    const resolved = result.rxcui !== null;
    const marker = resolved ? '✓' : '✗';
    const rxcuiStr = resolved ? result.rxcui.padEnd(8) : '—       ';
    const note = entry.expect === 'variant' && !resolved ? `→ try "${entry.usName}"` : '';
    console.log(`${marker} rxcui=${rxcuiStr} ${result.latency_ms}ms ${note}`);

    results.push({
      name:       entry.name,
      group:      entry.group,
      expect:     entry.expect,
      resolved,
      rxcui:      result.rxcui,
      latency_ms: result.latency_ms,
      error:      result.error || null,
    });

    if (!resolved) {
      failed.push({ name: entry.name, group: entry.group, usName: entry.usName || null });
    }

    // Small delay to be polite to the NIH server
    if (i < TEST_NAMES.length - 1) await sleep(150);
  }

  // --- Stats ---
  const latencies = results.map(r => r.latency_ms).filter(l => l >= 0).sort((a, b) => a - b);
  const resolvedCount = results.filter(r => r.resolved).length;
  const resolvedRate  = ((resolvedCount / results.length) * 100).toFixed(1);

  // By group
  const groups = ['A', 'B', 'C', 'D'];
  const groupStats = groups.map(g => {
    const rows = results.filter(r => r.group === g);
    const ok   = rows.filter(r => r.resolved).length;
    return { group: g, total: rows.length, resolved: ok, rate: ((ok / rows.length) * 100).toFixed(0) };
  });

  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const pMin = latencies[0];
  const pMax = latencies[latencies.length - 1];

  console.log('\n============================================================');
  console.log('RESULTS SUMMARY');
  console.log('============================================================');
  console.log(`Total calls:       ${results.length}`);
  console.log(`Resolved:          ${resolvedCount} / ${results.length} (${resolvedRate}%)`);
  console.log(`Failed:            ${results.length - resolvedCount}`);
  console.log('');
  console.log('Resolution by group:');
  groupStats.forEach(g => console.log(`  Group ${g.group}: ${g.resolved}/${g.total} (${g.rate}%)`));
  console.log('');
  console.log('Latency (ms):');
  console.log(`  min:  ${pMin}`);
  console.log(`  p50:  ${p50}`);
  console.log(`  p95:  ${p95}`);
  console.log(`  p99:  ${p99}`);
  console.log(`  max:  ${pMax}`);
  console.log('');
  if (failed.length > 0) {
    console.log('Failed resolutions (need synonym or manual mapping):');
    failed.forEach(f => {
      const hint = f.usName && f.usName !== 'same' ? ` → try "${f.usName}"` : '';
      console.log(`  [Group ${f.group}] ${f.name}${hint}`);
    });
  }
  console.log('============================================================');

  // Write raw results to JSON
  const outPath = path.resolve(__dirname, 'rxnorm-results.json');
  fs.writeFileSync(outPath, JSON.stringify({ results, stats: { resolvedCount, total: results.length, resolvedRate, p50, p95, p99, pMin, pMax, groupStats } }, null, 2));
  console.log(`\nRaw results: ${outPath}`);

  // Decision guidance
  console.log('\nGO/NO-GO SIGNAL:');
  const rate = parseFloat(resolvedRate);
  if (p95 > 800) {
    console.log(`⚠️  p95 latency ${p95}ms > 800ms threshold — batch ceiling may be too low`);
  } else {
    console.log(`✓  p95 latency ${p95}ms ≤ 800ms — latency acceptable`);
  }
  if (rate < 40) {
    console.log('✗  Resolution rate < 40% — BLOCKER. Consider Gemini fallback (R8).');
  } else if (rate < 60) {
    console.log('⚠️  Resolution rate < 60% — synonym table expansion needed before Phase 1.');
  } else {
    console.log(`✓  Resolution rate ${resolvedRate}% ≥ 60% — acceptable. Synonym table covers remaining gaps.`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
