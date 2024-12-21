// scripts/update-pdf-list.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// PPT/PPTXがあるディレクトリ
const SLIDES_DIR = path.join(__dirname, "..", "slides");
// PDFの出力先
const PDF_DIR = path.join(__dirname, "..", "docs", "pdfs");
// PDFリスト(json)のパス
const PDF_LIST_PATH = path.join(__dirname, "..", "docs", "pdf-list.json");

// LibreOfficeコマンド
const LIBREOFFICE_CMD = "libreoffice --headless --convert-to pdf";

async function main() {
  // 1) 既存の pdf-list.json を読み込み
  let pdfList = [];
  if (fs.existsSync(PDF_LIST_PATH)) {
    try {
      const jsonStr = fs.readFileSync(PDF_LIST_PATH, "utf8");
      pdfList = JSON.parse(jsonStr); // [{ file, mtime }, ...]
    } catch (e) {
      console.warn("Failed to parse pdf-list.json, start with empty list.");
      pdfList = [];
    }
  }

  // 2) orphan削除 (pdf-listにあるがslidesに無いファイルを除去)
  pdfList = removeOrphans(pdfList);

  // 3) slides/ のファイルを走査 → 差分チェック
  const slidesFiles = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.toLowerCase().endsWith(".pptx") || f.toLowerCase().endsWith(".ppt"));
  
  for (const fileName of slidesFiles) {
    const fullPath = path.join(SLIDES_DIR, fileName);
    const stats = fs.statSync(fullPath);
    // mtimeをISO文字列で保持
    const currentMtime = stats.mtime.toISOString();

    // pdfList内に既存エントリあるか？
    let entry = pdfList.find(e => e.file === fileName);
    if (!entry) {
      // 新規 => PDF変換
      console.log(`New file detected: ${fileName}`);
      convertToPdf(fullPath);
      // リストに追加
      pdfList.push({ file: fileName, mtime: currentMtime });
    } else {
      // 既存 => mtimeが変わっているかチェック
      if (currentMtime > entry.mtime) {
        // ファイルが新しくなっている => 再変換
        console.log(`Updated file detected: ${fileName}`);
        convertToPdf(fullPath);
        // mtimeを更新
        entry.mtime = currentMtime;
      } else {
        // 変更なし
        console.log(`No change: ${fileName}`);
      }
    }
  }

  // 4) pdf-list.json に保存
  fs.writeFileSync(PDF_LIST_PATH, JSON.stringify(pdfList, null, 2), "utf8");
  console.log("pdf-list.json updated!");
}

function removeOrphans(pdfList) {
  // 現在のslidesフォルダのファイル名をリストアップ
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
  const baseName = path.basename(fullPath, path.extname(fullPath)); // sample
  const cmd = `${LIBREOFFICE_CMD} "${fullPath}" --outdir "${PDF_DIR}"`;
  console.log("Exec:", cmd);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("LibreOffice convert error:", err);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
