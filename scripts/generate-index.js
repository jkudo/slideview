// scripts/generate-index.js
const fs = require('fs-extra');
const path = require('path');

const pdfDir = path.join(__dirname, '..', 'docs', 'pdfs');
const outputJson = path.join(__dirname, '..', 'docs', 'pdf-list.json');

async function main() {
  let pdfDataList = [];
  if (fs.existsSync(pdfDir)) {
    const allFiles = fs.readdirSync(pdfDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(pdfDir, file);
        const stats = fs.statSync(filePath);
        
        // JSTに変換
        const jstMtime = toJST(stats.mtime);
        const mtimeStr = formatDate(jstMtime);
        
        return {
          name: file,
          mtime: mtimeStr
        };
      });

    // mtime が新しい順にソート（文字列比較 or timestamp比較）
    allFiles.sort((a, b) => b.mtime.localeCompare(a.mtime));
    pdfDataList = allFiles;
  }

  const jsonContent = JSON.stringify(pdfDataList, null, 2);
  fs.writeFileSync(outputJson, jsonContent, 'utf8');
  console.log(`pdf-list.json updated with ${pdfDataList.length} PDFs.`);
}

function toJST(dateObj) {
  // UTC→JST(+9h)
  const JST_OFFSET_MINUTES = 9 * 60;
  const t = dateObj.getTime();
  return new Date(t + JST_OFFSET_MINUTES * 60000);
}

function formatDate(d) {
  // YYYY-MM-DD HH:mm:ss
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
