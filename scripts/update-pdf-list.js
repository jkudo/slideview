// scripts/update-pdf-list.js

/**
 * 役割:
 *  1. docs/pdf-list.json を読み込み、orphan削除 (slidesに無いファイルをPDF削除＆リスト除外)
 *  2. slides/ をスキャンして、前回の最終更新日時より新しいファイルがあれば PDF 変換
 *  3. pdf-list.json を更新 (ファイル名 & mtime)
 *  4. docs/index.html を自動生成 (PDFリンク一覧 + 更新日時表示)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// slidesディレクトリに .pptx/.ppt が置かれる想定
const SLIDES_DIR = path.join(__dirname, '..', 'slides');

// 変換後PDFの保存先
const PDF_DIR = path.join(__dirname, '..', 'docs', 'pdfs');

// PDFファイルの最終更新日時を管理するJSON
const PDF_LIST_PATH = path.join(__dirname, '..', 'docs', 'pdf-list.json');

// 自動生成するindex.html
const INDEX_HTML_PATH = path.join(__dirname, '..', 'docs', 'index.html');

// LibreOffice コマンド (Ubuntu)
const LIBREOFFICE_CMD = 'libreoffice --headless --convert-to pdf';

async function main() {
  // 1) pdf-list.json を読み込み (なければ空)
  let pdfList = [];
  if (fs.existsSync(PDF_LIST_PATH)) {
    try {
      const jsonStr = fs.readFileSync(PDF_LIST_PATH, 'utf8');
      pdfList = JSON.parse(jsonStr); // [{ file: 'sample.pptx', mtime: '2024-01-01T12:34:56.789Z' }, ...]
    } catch (e) {
      console.warn('Failed to parse pdf-list.json, start with empty list.');
      pdfList = [];
    }
  }

  // 2) orphan削除: pdf-listにあるが slides/ から消えたファイル → PDF削除 & リスト除外
  pdfList = removeOrphans(pdfList);

  // 3) slides/ をスキャンして差分チェック
  const slidesFiles = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.toLowerCase().endsWith('.pptx') || f.toLowerCase().endsWith('.ppt'));

  for (const fileName of slidesFiles) {
    const fullPath = path.join(SLIDES_DIR, fileName);
    const stats = fs.statSync(fullPath);
    const currentMtime = stats.mtime.toISOString(); // ISO文字列 (例: '2024-01-25T10:00:00.000Z')

    // pdfListにすでにあるかどうか
    let entry = pdfList.find(e => e.file === fileName);
    if (!entry) {
      // 新規ファイル
      console.log(`New file detected: ${fileName}`);
      convertToPdf(fullPath);
      pdfList.push({ file: fileName, mtime: currentMtime });
    } else {
      // 既存ファイル => mtimeを比較
      if (currentMtime > entry.mtime) {
        // 更新されたファイル
        console.log(`Updated file detected: ${fileName}`);
        convertToPdf(fullPath);
        entry.mtime = currentMtime;
      } else {
        // 変化なし
        console.log(`No change: ${fileName}`);
      }
    }
  }

  // 4) pdf-list.json を更新
  fs.writeFileSync(PDF_LIST_PATH, JSON.stringify(pdfList, null, 2), 'utf8');
  console.log('pdf-list.json updated!');

  // 5) index.html を生成
  generateIndexHtml(pdfList);
  console.log('index.html updated!');
}

function removeOrphans(pdfList) {
  // slidesフォルダに今あるファイル
  const slidesFiles = fs.readdirSync(SLIDES_DIR);

  const newList = [];
  for (const entry of pdfList) {
    if (!slidesFiles.includes(entry.file)) {
      // orphan => docs/pdfs/xxx.pdf を削除
      const baseNoExt = path.parse(entry.file).name; // sample.pptx → sample
      const pdfPath = path.join(PDF_DIR, baseNoExt + '.pdf');
      if (fs.existsSync(pdfPath)) {
        console.log(`Removing orphan PDF: ${pdfPath}`);
        fs.unlinkSync(pdfPath);
      }
      console.log(`Removing orphan from pdf-list: ${entry.file}`);
    } else {
      newList.push(entry);
    }
  }
  return newList;
}

function convertToPdf(fullPath) {
  // LibreOffice で PDF へ変換
  // 例: `libreoffice --headless --convert-to pdf "slides/sample.pptx" --outdir "docs/pdfs"`
  const cmd = `${LIBREOFFICE_CMD} "${fullPath}" --outdir "${PDF_DIR}"`;
  console.log('Exec:', cmd);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('LibreOffice convert error:', err);
  }
}

function generateIndexHtml(pdfList) {
  // PDFの一覧を index.html に出力
  // pdfList は [{ file: "sample.pptx", mtime: "2024-01-25T12:34:56.789Z" }, ...]
  // 新しい順にしたい場合は:
  pdfList.sort((a, b) => b.mtime.localeCompare(a.mtime));

  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Slides Index</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    a { color: blue; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .mtime { color: #888; font-size: 0.9em; margin-left: 8px; }
  </style>
</head>
<body>
  <h1>Slides Index</h1>
  <p>以下のPDFをクリックすると別タブで開きます。</p>
  <ul>
`;

  for (const entry of pdfList) {
    // sample.pptx -> sample.pdf
    const baseNoExt = path.parse(entry.file).name;
    const pdfFilename = `${baseNoExt}.pdf`;
    const pdfUrl = `./pdfs/${pdfFilename}`;
    html += `
    <li>
      <a href="${pdfUrl}" target="_blank">${pdfFilename}</a>
      <span class="mtime">(updated: ${entry.mtime})</span>
    </li>`;
  }

  html += `
  </ul>
</body>
</html>
`;

  fs.writeFileSync(INDEX_HTML_PATH, html, 'utf8');
}

// メイン実行
main().catch(e => {
  console.error(e);
  process.exit(1);
});
