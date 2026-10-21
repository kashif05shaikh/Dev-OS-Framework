const fs = require('fs');

const css1 = fs.readFileSync('scratch_1c31508e0044c832.css', 'utf8');
const css2 = fs.readFileSync('scratch_feae2124c0c57867.css', 'utf8');
const allCss = css1 + '\n' + css2;

const vars = allCss.match(/--[a-zA-Z0-9_-]+:\s*[^;]+/g) || [];
console.log('--- ALL UNIQUE CSS VARS ---');
const uniqueVars = [...new Set(vars)];
uniqueVars.forEach(v => console.log(v));

// Check color themes and fonts
console.log('\n--- FONT DECLARATIONS ---');
const fontFaces = allCss.match(/@font-face\s*\{[^}]+\}/g) || [];
fontFaces.forEach(f => console.log(f));

// Check classes with bg-, text-, border-
console.log('\n--- KEY THEME CLASSES ---');
const themeBlocks = allCss.match(/(?::root|\[data-theme=[^\]]+\]|\.dark)[^{]*\{[^}]+\}/g) || [];
themeBlocks.forEach(b => console.log(b));

