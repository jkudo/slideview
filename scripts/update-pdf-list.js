// scripts/update-pdf-list.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SLIDES_DIR = path.join(__dirname, "..", "slides");
const PDF_DIR = path.join(__dirname, "..", "docs", "pdfs");
const PDF_LIST_PATH = path.join(__dirname, "..", "docs", "pdf-list.json");
const INDEX_HTML_PATH = path.join(__dirname, "..", "docs", "index.html");

const LIBREOFFICE_CMD = "libreoffice --headless --convert-to pdf";

async function main() {
  // 1) 既存のpdf-list.json を読み込み
  let pdfList = [];
  if (fs.existsSync(PDF_LIST_PATH)) {
    try {
      pdfList = JSON.parse(fs.readFileSync(PDF_LIST_PATH, "utf8"));
    } catch (e) {
      console.warn("Failed to parse pdf-list.json, start with empty list.");
      pdfList = [];
    }
  }

  // 2) orphan削除: pdf-list にあるが slides/ に無いファイル → PDF削除 & リスト除外
  pdfList = removeOrphans(pdfList);

  // 3) slides/ をスキャンして差分変換
  const slidesFiles = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.toLowerCase().endsWith(".pptx") || f.toLowerCase().endsWith(".ppt"));

  for (const fileName of slidesFiles) {
    const fullPath = path.join(SLIDES_DIR, fileName);
    const stats = fs.statSync(fullPath);
    const currentMtime = stats.mtime.toISOString();

    // pdfList内にあるか
    let entry = pdfList.find(e => e.file === fileName);
    if (!entry) {
      // 新規
      console.log(`New file detected: ${fileName}`);
      convertToPdf(fullPath);
      pdfList.push({ file: fileName, mtime: currentMtime });
    } else {
      // 既存 => 更新日時比較
      if (currentMtime > entry.mtime) {
        // 更新されている
        console.log(`Updated file detected: ${fileName}`);
        convertToPdf(fullPath);
        entry.mtime = currentMtime;
      } else {
        // 変更なし
        console.log(`No change: ${fileName}`);
      }
    }
  }

  // 4) pdf-list.json を保存 (JSON)
  fs.writeFileSync(PDF_LIST_PATH, JSON.stringify(pdfList, null, 2), "utf8");
  console.log("pdf-list.json updated!");

  // 5) index.html を自動生成
  generateIndexHtml(pdfList);
  console.log("index.html updated!");
}

function removeOrphans(pdfList) {
  const slidesFiles = fs.readdirSync(SLIDES_DIR);

  const newList = [];
  for (const entry of pdfList) {
    if (!slidesFiles.includes(entry.file)) {
      // orphan => PDF削除
      const baseNoExt = path.parse(entry.file).name; // sample.pptx => sample
      const pdfPath = path.join(PDF_DIR, baseNoExt + ".pdf");
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
  const cmd = `${LIBREOFFICE_CMD} "${fullPath}" --outdir "${PDF_DIR}"`;
  console.log("Exec:", cmd);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("LibreOffice convert error:", err);
  }
}

function generateIndexHtml(pdfList) {
  // docs/pdfs/ フォルダにある PDF を一覧表示するHTMLを生成
  // もしくは pdfList を活用して「どの PPTX がいつ更新されたか」を示すのもOK
  // ここでは pdfList をソートして簡易的なリストを作る例

  // 1) PDFの一覧を作成
  //    "sample.pptx" => PDF名 "sample.pdf"
  //    "mtime" => ex) "2024-01-25T12:34:56.789Z"
  // 2) 新しい順にソートしたければ:
  pdfList.sort((a, b) => b.mtime.localeCompare(a.mtime));

  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Slides Index</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    .pdf-item { margin-bottom: 8px; }
    .mtime { color: #888; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Slides Index</h1>
  <p>以下のPDFをクリックすると別タブで表示されます。</p>
  <ul>
`;

  for (const entry of pdfList) {
    const baseNoExt = path.parse(entry.file).name; 
    const pdfFileName = baseNoExt + ".pdf";
    const pdfHref = `./pdfs/${pdfFileName}`;
    html += `
    <li class="pdf-item">
      <a href="${pdfHref}" target="_blank">${pdfFileName}</a>
      <span class="mtime">(updated: ${entry.mtime})</span>
    </li>`;
  }

  html += `
  </ul>
</body>
</html>
`;

  fs.writeFileSync(INDEX_HTML_PATH, html, "utf8");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
