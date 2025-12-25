#!/usr/bin/env node
/**
 * Gate v2 - Benchmark Test v3
 * 
 * Usage:
 *   export OPENAI_API_KEY="sk-proj-..."
 *   node run_benchmark.js
 * 
 * Or with inline key:
 *   OPENAI_API_KEY="sk-proj-..." node run_benchmark.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Check API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ ERROR: OPENAI_API_KEY not set");
  console.error("");
  console.error("Set it with:");
  console.error('  export OPENAI_API_KEY="sk-proj-your-key-here"');
  console.error("");
  process.exit(1);
}

console.log("✅ API Key found:", OPENAI_API_KEY.substring(0, 15) + "...");

const SYSTEM_PROMPT = `You are a perturbation classifier. Classify input into exactly one category.

**D1**: Physical need, danger, emergency, immediate threat.
**D2**: Coordination failure with another agent.
**D3**: Blocked choice between alternatives ("should I X or Y").
**D4**: Self/other boundary confusion.
**NULL**: No perturbation, factual question, greeting, normative content.

Rules:
1. Output ONLY: D1, D2, D3, D4, or NULL
2. One word only`;

async function classify(text) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: "gpt-4o",
      max_tokens: 10,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Classify: "${text}"\n\nLabel:` }
      ]
    });

    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            console.error("API Error:", response.error.message);
            resolve('NULL');
            return;
          }
          const content = response.choices[0].message.content.trim().toUpperCase();
          if (content.includes('D1')) resolve('D1');
          else if (content.includes('D2')) resolve('D2');
          else if (content.includes('D3')) resolve('D3');
          else if (content.includes('D4')) resolve('D4');
          else resolve('NULL');
        } catch (e) {
          console.error("Parse error:", e.message);
          resolve('NULL');
        }
      });
    });

    req.on('error', (e) => { console.error("Request error:", e.message); resolve('NULL'); });
    req.setTimeout(30000, () => { req.destroy(); resolve('NULL'); });
    req.write(data);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runBenchmark() {
  // Find dataset
  // Try v4 first, then v3
  let datasetPath = './benchmark_v4.json';
  if (!fs.existsSync(datasetPath)) {
    datasetPath = path.join(__dirname, 'benchmark_v4.json');
  }
  if (!fs.existsSync(datasetPath)) {
    datasetPath = './benchmark_v3.json';
  }
  if (!fs.existsSync(datasetPath)) {
    datasetPath = path.join(__dirname, 'benchmark_v3.json');
  }
  if (!fs.existsSync(datasetPath)) {
    console.error("❌ Dataset not found. Place benchmark_v4.json or benchmark_v3.json in current directory.");
    process.exit(1);
  }

  console.log("📂 Loading dataset:", datasetPath);
  const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  const dataset = data.dataset;
  
  // Stratified sample: 20 per class = 100 total
  const byLabel = { D1: [], D2: [], D3: [], D4: [], NULL: [] };
  dataset.forEach(ex => byLabel[ex.gold_label]?.push(ex));
  
  const sample = [];
  Object.keys(byLabel).forEach(label => {
    const shuffled = byLabel[label].sort(() => Math.random() - 0.5);
    sample.push(...shuffled.slice(0, 20));
  });
  
  console.log(`\n🧪 Testing ${sample.length} examples (20 per class)...\n`);
  
  const matrix = {
    D1: { D1: 0, D2: 0, D3: 0, D4: 0, NULL: 0 },
    D2: { D1: 0, D2: 0, D3: 0, D4: 0, NULL: 0 },
    D3: { D1: 0, D2: 0, D3: 0, D4: 0, NULL: 0 },
    D4: { D1: 0, D2: 0, D3: 0, D4: 0, NULL: 0 },
    NULL: { D1: 0, D2: 0, D3: 0, D4: 0, NULL: 0 }
  };
  
  let correct = 0, d1FN = 0, d1TP = 0;
  const errors = [];
  
  for (let i = 0; i < sample.length; i++) {
    const ex = sample[i];
    const pred = await classify(ex.input);
    const gold = ex.gold_label;
    
    matrix[gold][pred]++;
    
    if (pred === gold) {
      correct++;
      if (gold === 'D1') d1TP++;
    } else {
      if (gold === 'D1') d1FN++;
      errors.push({ id: ex.id, input: ex.input.substring(0, 40), gold, pred });
    }
    
    process.stdout.write(`\r  Progress: ${i + 1}/${sample.length} (${Math.round((i+1)/sample.length*100)}%)`);
    await sleep(150); // Rate limit
  }
  
  // Results
  const accuracy = (correct / sample.length * 100).toFixed(2);
  const d1FNR = d1TP + d1FN > 0 ? (d1FN / (d1TP + d1FN) * 100).toFixed(2) : '0.00';
  
  console.log("\n\n" + "=".repeat(50));
  console.log("                    RESULTS");
  console.log("=".repeat(50));
  console.log(`\n  ✅ Accuracy:        ${accuracy}% (${correct}/${sample.length})`);
  console.log(`  🚨 D1 FNR:          ${d1FNR}% (${d1FN} missed)`);
  
  console.log("\n--- Confusion Matrix ---\n");
  console.log("Gold↓ Pred→   D1    D2    D3    D4   NULL");
  console.log("-".repeat(45));
  ['D1', 'D2', 'D3', 'D4', 'NULL'].forEach(g => {
    const r = matrix[g];
    console.log(`${g.padEnd(6)}       ${String(r.D1).padStart(2)}    ${String(r.D2).padStart(2)}    ${String(r.D3).padStart(2)}    ${String(r.D4).padStart(2)}    ${String(r.NULL).padStart(2)}`);
  });
  
  // Per-class metrics
  console.log("\n--- Per-Class Performance ---\n");
  ['D1', 'D2', 'D3', 'D4', 'NULL'].forEach(label => {
    const tp = matrix[label][label];
    const fn = Object.values(matrix[label]).reduce((a,b) => a+b, 0) - tp;
    const fp = ['D1','D2','D3','D4','NULL'].reduce((s,g) => g !== label ? s + matrix[g][label] : s, 0);
    const prec = tp + fp > 0 ? (tp / (tp + fp) * 100).toFixed(0) : '0';
    const rec = tp + fn > 0 ? (tp / (tp + fn) * 100).toFixed(0) : '0';
    const f1 = prec > 0 && rec > 0 ? (2 * prec * rec / (Number(prec) + Number(rec))).toFixed(0) : '0';
    console.log(`  ${label}: P=${prec}% R=${rec}% F1=${f1}%`);
  });
  
  if (errors.length > 0) {
    console.log("\n--- Sample Errors ---\n");
    errors.slice(0, 5).forEach(e => {
      console.log(`  ${e.id}: "${e.input}..." → Gold: ${e.gold}, Pred: ${e.pred}`);
    });
    if (errors.length > 5) console.log(`  ... and ${errors.length - 5} more`);
  }
  
  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    accuracy: parseFloat(accuracy),
    d1_fnr: parseFloat(d1FNR),
    sample_size: sample.length,
    matrix,
    errors
  };
  fs.writeFileSync('benchmark_results.json', JSON.stringify(report, null, 2));
  console.log("\n\n💾 Results saved to benchmark_results.json\n");
}

runBenchmark().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
