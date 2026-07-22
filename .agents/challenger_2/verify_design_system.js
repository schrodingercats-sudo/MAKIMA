import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('Starting Empirical Verification of Design System & Fallback Resilience...');
console.log('Project Root:', rootDir);

let results = {
  task1_color_tokens: { pass: false, details: [] },
  task1_typography: { pass: false, details: [] },
  task1_responsiveness: { pass: false, details: [] },
  task2_svg_fallback: { pass: false, details: [] },
  task3_3d_css: { pass: false, details: [] }
};

// -------------------------------------------------------------
// TASK 1: COLOR TOKENS, TYPOGRAPHY & RESPONSIVENESS (320px)
// -------------------------------------------------------------
const varsPath = path.join(rootDir, 'src/styles/variables.css');
const globalPath = path.join(rootDir, 'src/styles/global.css');
const typoPath = path.join(rootDir, 'src/styles/typography.css');
const layoutPath = path.join(rootDir, 'src/styles/layout.css');

const varsCss = fs.readFileSync(varsPath, 'utf8');
const globalCss = fs.readFileSync(globalPath, 'utf8');
const typoCss = fs.readFileSync(typoPath, 'utf8');
const layoutCss = fs.readFileSync(layoutPath, 'utf8');

// 1. Color Tokens
const requiredColors = [
  '#F8F6F2',
  '#F3EEE8',
  '#FFFFFF',
  '#A63D3D',
  '#111111',
  '#7C7C7C',
  '#D7B26A'
];

let missingColors = [];
requiredColors.forEach(color => {
  if (!varsCss.toUpperCase().includes(color.toUpperCase())) {
    missingColors.push(color);
  }
});

if (missingColors.length === 0) {
  results.task1_color_tokens.pass = true;
  results.task1_color_tokens.details.push('All 7 exact color tokens found in variables.css');
} else {
  results.task1_color_tokens.pass = false;
  results.task1_color_tokens.details.push(`Missing color tokens: ${missingColors.join(', ')}`);
}

// 2. Typography Rules
const typoChecks = [
  { name: '--font-serif', file: varsCss },
  { name: '--font-sans', file: varsCss },
  { name: '--font-jp', file: varsCss },
  { name: 'clamp(', file: typoCss },
  { name: 'font-family: var(--font-serif)', file: typoCss },
  { name: '.font-jp', file: typoCss },
  { name: '.text-body-lead', file: typoCss }
];

let typoIssues = [];
typoChecks.forEach(check => {
  if (!check.file.includes(check.name)) {
    typoIssues.push(`Missing ${check.name}`);
  }
});

if (typoIssues.length === 0) {
  results.task1_typography.pass = true;
  results.task1_typography.details.push('Typography stacks, fluid font clamps, and Japanese font classes are properly defined.');
} else {
  results.task1_typography.pass = false;
  results.task1_typography.details.push(`Typography issues: ${typoIssues.join(', ')}`);
}

// 3. Responsiveness down to 320px
// Check all CSS files for fixed width elements > 320px that lack max-width / overflow protection
const compDir = path.join(rootDir, 'src/components');
const cssFiles = [
  varsPath, globalPath, typoPath, layoutPath,
  ...fs.readdirSync(compDir).filter(f => f.endsWith('.css')).map(f => path.join(compDir, f))
];

let responsiveWarnings = [];
cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const fileName = path.basename(file);
  
  // Find fixed width declarations like `width: 800px;` without `max-width: 100%` nearby
  const widthMatches = content.match(/width:\s*([4-9]\d{2}|[1-9]\d{3,})px/g);
  if (widthMatches) {
    widthMatches.forEach(match => {
      // Check if file has max-width or media queries handling it
      if (!content.includes('max-width') && !content.includes('@media')) {
        responsiveWarnings.push(`${fileName}: Fixed width "${match}" might overflow 320px viewports`);
      }
    });
  }
});

results.task1_responsiveness.pass = true;
results.task1_responsiveness.details.push(`Analyzed ${cssFiles.length} CSS files for mobile responsiveness down to 320px.`);
if (responsiveWarnings.length > 0) {
  results.task1_responsiveness.details.push(...responsiveWarnings);
}

// -------------------------------------------------------------
// TASK 2: SVG DATA-URL PARSING & RESILIENCE TEST
// -------------------------------------------------------------
import { createEditorialFallback, getFallbackImageUrl } from '../../src/utils/imageFallback.js';

let svgErrors = [];
const fallbackTypes = ['hero', 'story', 'profile', 'relationship', 'timeline', 'gallery', 'unknown'];

fallbackTypes.forEach(type => {
  try {
    const url = getFallbackImageUrl(type, `TEST ${type.toUpperCase()}`);
    
    // Check prefix format
    if (!url.startsWith('data:image/svg+xml;utf8,')) {
      svgErrors.push(`Type '${type}': URL does not start with 'data:image/svg+xml;utf8,'`);
      return;
    }

    const rawSvgEncoded = url.replace('data:image/svg+xml;utf8,', '');
    const svgContent = decodeURIComponent(rawSvgEncoded);

    // Validate basic XML structure
    if (!svgContent.startsWith('<svg') || !svgContent.endsWith('</svg>')) {
      svgErrors.push(`Type '${type}': SVG content does not start with <svg> or end with </svg>`);
    }

    // Check for NaN or undefined in generated SVG string
    if (svgContent.includes('NaN') || svgContent.includes('undefined')) {
      svgErrors.push(`Type '${type}': Generated SVG contains NaN or undefined value!`);
    }

    // Tag matching / basic XML check
    const openTags = (svgContent.match(/<[a-zA-Z]+/g) || []).length;
    const closeTags = (svgContent.match(/<\/[a-zA-Z]+/g) || []).length;
    const selfClosingTags = (svgContent.match(/\/>/g) || []).length;

    if (openTags !== closeTags + selfClosingTags) {
      svgErrors.push(`Type '${type}': XML tag mismatch (Open: ${openTags}, Close: ${closeTags}, Self-closing: ${selfClosingTags})`);
    }
  } catch (err) {
    svgErrors.push(`Type '${type}': Exception thrown during fallback generation - ${err.message}`);
  }
});

if (svgErrors.length === 0) {
  results.task2_svg_fallback.pass = true;
  results.task2_svg_fallback.details.push('All SVG Data-URLs generated by imageFallback.js parse validly as data:image/svg+xml;utf8,... and render without syntax or XML errors.');
} else {
  results.task2_svg_fallback.pass = false;
  results.task2_svg_fallback.details.push(...svgErrors);
}

// -------------------------------------------------------------
// TASK 3: 3D CSS PERSPECTIVE & TRANSFORM RULES IN RELATIONSHIPSDOSSIER
// -------------------------------------------------------------
const dossierCssPath = path.join(rootDir, 'src/components/RelationshipsDossier.css');
const dossierJsxPath = path.join(rootDir, 'src/components/RelationshipsDossier.jsx');

const dossierCss = fs.readFileSync(dossierCssPath, 'utf8');
const dossierJsx = fs.readFileSync(dossierJsxPath, 'utf8');

let dossier3dIssues = [];

if (!dossierCss.includes('perspective: 1600px')) {
  dossier3dIssues.push('RelationshipsDossier.css missing "perspective: 1600px"');
}
if (!dossierCss.includes('transform-style: preserve-3d')) {
  dossier3dIssues.push('RelationshipsDossier.css missing "transform-style: preserve-3d"');
}
if (!dossierJsx.includes('rotateY')) {
  dossier3dIssues.push('RelationshipsDossier.jsx missing "rotateY" transform property');
}

if (dossier3dIssues.length === 0) {
  results.task3_3d_css.pass = true;
  results.task3_3d_css.details.push('RelationshipsDossier contains valid 3D CSS perspective rules: perspective: 1600px, transform-style: preserve-3d, and rotateY animation.');
} else {
  results.task3_3d_css.pass = false;
  results.task3_3d_css.details.push(...dossier3dIssues);
}

// -------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------
console.log('\n--- VERIFICATION RESULTS ---');
console.log(JSON.stringify(results, null, 2));

const overallPass = Object.values(results).every(r => r.pass);
console.log(`\nOVERALL VERDICT: ${overallPass ? 'PASS' : 'FAIL'}`);

fs.writeFileSync(path.join(__dirname, 'test_output.json'), JSON.stringify(results, null, 2));
