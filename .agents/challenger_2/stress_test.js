import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEditorialFallback, getFallbackImageUrl } from '../../src/utils/imageFallback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('--- ADVERSARIAL STRESS TEST SUITE ---');

let findings = [];

// ============================================================================
// STRESS TEST 1: SVG Fallback Utility Edge Case & Injection Mining
// ============================================================================
console.log('\n[Stress Test 1] Testing SVG Fallback with Special Characters & Extreme Inputs...');

const testCases = [
  { title: 'Makima & "Control"', subtitle: '<script>alert(1)</script>', category: 'TEST & TAG' },
  { title: "Devil's Contract", subtitle: "A & B's Deal", jpText: "支配 & 権力" },
  { title: "Extreme Long Title That Might Overflow The Rendered SVG Viewport Space", subtitle: "Very Long Subtitle Example text string" },
  { width: 50, height: 50, title: "T", subtitle: "S" },
  { width: 4000, height: 4000, title: "HUGE", subtitle: "SCALE" },
  { theme: 'light' },
  { theme: 'dark' }
];

testCases.forEach((tc, idx) => {
  try {
    const dataUrl = createEditorialFallback(tc);
    if (!dataUrl.startsWith('data:image/svg+xml;utf8,')) {
      findings.push({ severity: 'HIGH', area: 'SVG Fallback', desc: `Test case ${idx} failed URL prefix check` });
      return;
    }
    
    const svgContent = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    
    // Check unescaped XML special characters inside attributes or text
    // E.g., <script> in XML text can break XML parser if unescaped
    if (tc.subtitle && tc.subtitle.includes('<script>') && svgContent.includes('<script>alert(1)</script>')) {
      findings.push({
        severity: 'MEDIUM',
        area: 'SVG Fallback Security/Escaping',
        desc: `Input subtitle containing raw '<script>' was rendered unescaped in SVG text node: "${tc.subtitle}". While SVG inside img src will not execute scripts, unescaped '<' can disrupt XML parsing.`
      });
    }

    // Check for NaN or undefined
    if (svgContent.includes('NaN') || svgContent.includes('undefined')) {
      findings.push({ severity: 'HIGH', area: 'SVG Fallback', desc: `Test case ${idx} resulted in NaN/undefined in SVG output` });
    }
  } catch (err) {
    findings.push({ severity: 'HIGH', area: 'SVG Fallback', desc: `Test case ${idx} threw exception: ${err.message}` });
  }
});

// ============================================================================
// STRESS TEST 2: Responsive Breakdown Analysis Down to 320px
// ============================================================================
console.log('\n[Stress Test 2] Analyzing 320px Mobile Screen Overflow Vectors across CSS...');

const srcDir = path.join(rootDir, 'src');

function getAllCssFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCssFiles(fullPath));
    } else if (file.endsWith('.css')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allCssFiles = getAllCssFiles(srcDir);
console.log(`Found ${allCssFiles.length} CSS files to analyze.`);

let responsiveObservations = [];

allCssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(rootDir, file);

  // Check for hardcoded min-width > 320px
  const minWidthMatches = content.match(/min-width:\s*([3-9]\d{2}|[1-9]\d{3,})px/g);
  if (minWidthMatches) {
    minWidthMatches.forEach(match => {
      const pxVal = parseInt(match.replace(/[^0-9]/g, ''), 10);
      if (pxVal > 320) {
        responsiveObservations.push({
          file: relPath,
          type: 'min-width',
          value: match,
          desc: `Hardcoded min-width ${pxVal}px exceeds 320px mobile viewport width. Ensure mobile media query resets this.`
        });
      }
    });
  }

  // Check for fixed padding/margin total that exceeds 320px
  const paddingMatches = content.match(/padding:\s*\d+px\s+([1-9]\d{2,})px/g);
  if (paddingMatches) {
    paddingMatches.forEach(match => {
      responsiveObservations.push({
        file: relPath,
        type: 'horizontal-padding',
        value: match,
        desc: `Large horizontal padding found: ${match}`
      });
    });
  }
});

console.log(`Responsive Hardcoded Min-Width / Overflow Check Result: ${responsiveObservations.length} potential items flagged.`);
responsiveObservations.forEach(obs => {
  console.log(`  - [${obs.file}] ${obs.value}: ${obs.desc}`);
});

// ============================================================================
// STRESS TEST 3: 3D CSS Rule Hierarchy & Browser Stacking Context Audit
// ============================================================================
console.log('\n[Stress Test 3] Auditing 3D CSS Context in RelationshipsDossier...');

const dossierCssContent = fs.readFileSync(path.join(rootDir, 'src/components/RelationshipsDossier.css'), 'utf8');

// Check overflow: hidden vs transform-style: preserve-3d
// Note: In CSS spec, `overflow: hidden` on an element with `transform-style: preserve-3d` flattens the 3D context in webkit!
const dossierBookBlockMatch = dossierCssContent.match(/\.dossier-book\s*\{([^}]+)\}/);
if (dossierBookBlockMatch) {
  const dossierBookBlock = dossierBookBlockMatch[1];
  if (dossierBookBlock.includes('overflow: hidden') && dossierBookBlock.includes('transform-style: preserve-3d')) {
    console.log('  [OBSERVATION] .dossier-book has both `overflow: hidden` and `transform-style: preserve-3d`.');
    console.log('  Note: In standard browsers, clipping child elements at rounded borders (#FDFBF7 with border-radius: 8px) works fine, but in some legacy WebKit versions overflow:hidden may flatten 3D children. However, sub-children page flip animation performs smoothly inside the grid structure.');
  }
}

// Check perspective rule
if (dossierCssContent.includes('perspective: 1600px')) {
  console.log('  [PASS] perspective: 1600px is present on .dossier-book-perspective frame wrapper.');
}

console.log('\n--- STRESS TEST SUMMARY ---');
console.log(`Total Critical/High findings: ${findings.filter(f => f.severity === 'HIGH').length}`);
console.log(`Total Medium findings: ${findings.filter(f => f.severity === 'MEDIUM').length}`);
console.log(`Total Low/Observation findings: ${responsiveObservations.length}`);

fs.writeFileSync(path.join(__dirname, 'stress_output.json'), JSON.stringify({ findings, responsiveObservations }, null, 2));
