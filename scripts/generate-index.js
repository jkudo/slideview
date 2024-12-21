// scripts/generate-index.js
const fs = require('fs-extra');
const path = require('path');

// PDFが格納されるディレクトリ
const pdfDir = path.join(__dirname, '..', 'docs', 'pdfs');
// 書き出す先の JSONファイル
const outputJson = path.join(__dirname, '..', 'docs', 'pdf-list.json');

async function main() {
  let pdfFiles = [];
  if (fs.existsSync(pdfDir)) {
    pdfFiles = fs.readdirSync(pdfDir).filter(file => {
      return file.toLowerCase().endsWith('.pdf');
    });
  }

  console.log(`Found PDFs:`, pdfFiles);

  // pdfFilesをJSON文字列化
  const jsonContent = JSON.stringify(pdfFiles, null, 2);

  // docs/pdf-list.json に書き込む
  await fs.writeFile(outputJson, jsonContent, 'utf8');
  console.log(`Successfully written: ${outputJson}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
