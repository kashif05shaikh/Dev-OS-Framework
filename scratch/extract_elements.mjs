import fs from 'fs';

const html = fs.readFileSync('scratch_visuvate.html', 'utf8');

// Find all className occurrences
const classMatches = html.match(/className\\":\\"([^\\"]+)\\"/g) || [];
console.log('Total class occurrences:', classMatches.length);

const cleaned = classMatches.map(c => c.replace('className\\":\\"', '').replace('\\"', ''));
const set = new Set(cleaned);

console.log('\n--- SAMPLE COMPONENT CLASSES ---');
let count = 0;
for (const cls of set) {
  if (cls.includes('rounded') || cls.includes('border') || cls.includes('bg-') || cls.includes('font-')) {
    console.log(cls);
    count++;
    if (count > 40) break;
  }
}

