import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

const source = path.resolve('.output/chrome-mv3');
const targetDir = path.resolve('public/downloads');
const target = path.join(targetDir, 'export-proof-chrome.zip');

if (!fs.existsSync(path.join(source, 'manifest.json'))) {
  throw new Error('Extension build missing: run npm run build:extension first.');
}

fs.mkdirSync(targetDir, { recursive: true });
const zip = new AdmZip();
zip.addLocalFolder(source);
zip.writeZip(target);
console.log(`Packaged ${target}`);
