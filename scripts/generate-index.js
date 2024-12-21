// scripts/generate-index.js
const fs = require('fs-extra');
const path = require('path');

const pdfDir = path.join(__dirname, '..', 'docs', 'pdfs');
const outputJson = path.join(__dirname, '..', 'docs', 'pdf-list.json');

async function main() {
  let pdfFiles = [];
  if (fs.existsSync(pdfDir)) {
    pdfFiles = fs.readdirSync(pdfDir).filter(file => file.toLowerCase().endsWith('.pdf'));
  }

  console.log(`Found PDFs:`, pdfFiles);
  const jsonContent = JSON.stringify(pdfFiles, null, 2);

  await fs.writeFile(outputJson, jsonContent, 'utf8');
  console.log(`Successfully written: ${outputJson}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
