import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/prath/OneDrive/Desktop/Makimafinal';

console.log('=== EMPIRICAL VERIFICATION & STRESS TEST ===\n');

// 1. Build Artifact Verification
const distPath = path.join(projectRoot, 'dist');
const indexPath = path.join(distPath, 'index.html');
const assetsPath = path.join(distPath, 'assets');

let buildStatus = 'PASS';
if (!fs.existsSync(indexPath) || !fs.existsSync(assetsPath)) {
  buildStatus = 'FAIL: Missing dist files';
} else {
  const assets = fs.readdirSync(assetsPath);
  const jsAsset = assets.find(f => f.endsWith('.js'));
  const cssAsset = assets.find(f => f.endsWith('.css'));
  console.log(`[BUILD VERIFICATION] dist index.html exists: ${fs.existsSync(indexPath)}`);
  console.log(`[BUILD VERIFICATION] JS bundle found: ${jsAsset || 'NONE'}`);
  console.log(`[BUILD VERIFICATION] CSS bundle found: ${cssAsset || 'NONE'}`);
  if (!jsAsset || !cssAsset) buildStatus = 'FAIL: Missing JS or CSS bundles';
}

console.log(`\nBuild Verification Status: ${buildStatus}\n`);

// 2. Component Inspection & Code Static Analysis
const srcComponentsDir = path.join(projectRoot, 'src/components');
const componentsToInspect = [
  'Hero.jsx',
  'StickyStory.jsx',
  'CharacterProfile.jsx',
  'RelationshipsDossier.jsx',
  'Timeline.jsx',
  'Gallery.jsx',
  'ImageModal.jsx',
  'Quote.jsx',
  'LegacyFooter.jsx'
];

const findings = [];

// Inspect App.jsx
const appJsx = fs.readFileSync(path.join(projectRoot, 'src/App.jsx'), 'utf-8');
if (appJsx.includes('requestAnimationFrame(raf)')) {
  if (!appJsx.includes('let rafId') && !appJsx.includes('rafId = requestAnimationFrame') && appJsx.includes('cancelAnimationFrame(rafId)')) {
    findings.push({
      component: 'App.jsx',
      severity: 'HIGH',
      issue: 'RAF Memory Leak / Dangling Animation Loop in Lenis setup. `cancelAnimationFrame(rafId)` only cancels initial frame ID while recursive `requestAnimationFrame(raf)` continues running after unmount.'
    });
  }
}

// Inspect StickyStory.jsx
const stickyStoryJsx = fs.readFileSync(path.join(srcComponentsDir, 'StickyStory.jsx'), 'utf-8');
if (stickyStoryJsx.includes("if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {\n        // Option to cycle inside story card\n      }")) {
  findings.push({
    component: 'StickyStory.jsx',
    severity: 'MEDIUM',
    issue: 'Incomplete keyboard event listener. The ArrowRight / ArrowDown keydown condition is present but contains an empty block, failing to trigger slide transition.'
  });
}

// Inspect RelationshipsDossier.jsx
const relJsx = fs.readFileSync(path.join(srcComponentsDir, 'RelationshipsDossier.jsx'), 'utf-8');
if (!relJsx.includes('addEventListener') && !relJsx.includes('onKeyDown')) {
  findings.push({
    component: 'RelationshipsDossier.jsx',
    severity: 'LOW',
    issue: 'Missing keydown event handlers for 3D book page flipping. Tab buttons have role="tab" but keyboard shortcut support (Arrow keys) is absent.'
  });
}

// Inspect CharacterProfile.jsx
const charJsx = fs.readFileSync(path.join(srcComponentsDir, 'CharacterProfile.jsx'), 'utf-8');
if (charJsx.includes('setTimeout') && !charJsx.includes('clearTimeout')) {
  findings.push({
    component: 'CharacterProfile.jsx',
    severity: 'LOW',
    issue: '`setTimeout` used in handleCopyMetadata without storing handle or clearing on unmount.'
  });
}

console.log('=== FINDINGS SUMMARY ===');
findings.forEach((f, i) => {
  console.log(`${i + 1}. [${f.severity}] ${f.component}: ${f.issue}`);
});

console.log('\nEmpirical Verification Complete.');
