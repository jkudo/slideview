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
    const allFiles = fs.readdirSync(pdfDir);

    // ファイルごとに { name, mtime } オブジェクトを作る
    pdfFiles = allFiles
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(pdfDir, file);
        const stats = fs.statSync(filePath);
        // stats.mtime は JS Date オブジェクト
        // 見やすい文字列に変換 (例: YYYY-MM-DD HH:mm:ss)
        const mtimeStr = formatDateTime(stats.mtime);
        return {
          name: file,
          mtime: mtimeStr
        };
      });
  }

  console.log(`Found PDFs:`, pdfFiles);

  // pdfFilesをJSON文字列化
  const jsonContent = JSON.stringify(pdfFiles, null, 2);

  // docs/pdf-list.json に書き込む
  await fs.writeFile(outputJson, jsonContent, 'utf8');
  console.log(`Successfully written: ${outputJson}`);
}

// mtimeを "YYYY-MM-DD HH:mm:ss" 形式に整形する例
function formatDateTime(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mi = String(dateObj.getMinutes()).padStart(2, '0');
  const ss = String(dateObj.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
