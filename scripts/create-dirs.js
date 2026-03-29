const fs = require('fs');
const path = require('path');

const baseDir = 'openspec/changes/refactor-selective-authentication';

// Create all necessary directories
const dirs = [
  baseDir,
  `${baseDir}/specs/authentication`,
  `${baseDir}/specs/routing`,
  `${baseDir}/specs/project-management`
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
});

console.log('\n✓ All directories created successfully');
console.log('\nNext steps:');
console.log('1. Create proposal.md');
console.log('2. Create tasks.md');
console.log('3. Create design.md');
console.log('4. Create spec.md files in specs/ subdirectories');
