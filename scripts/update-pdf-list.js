// scripts/update-pdf-list.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// PPT/PPTXがあるフォルダ
const SLIDES_DIR = path.join(__dirname, "..", "slides");
// PDFの出力先フォルダ
const PDF_DIR = path.join(__dirname, "..", "docs", "pdfs");
// PDFリスト(json)のパス
const PDF_LIST_PATH = path.join(__dirname, "..", "docs", "pdf-list.json");

// LibreOfficeコマンド（Ubuntuでインストール済み想定）
const LIBREOFFICE_CMD = "libreoffice --headless --convert-to pdf";

async function main() {
  // 1) pdf-list.json のロード
  let pdfList = [];
  try {
    if (fs.existsSync(PDF_LIST_PATH)) {
      pdfList = JSON.parse(fs.readFileSync(PDF_LIST_PATH, "utf8"));
    }
  } catch (e) {
    pdfList = [];
  }

  // pdfList: Array<{ file: string, mtime: string }>
  // 例: [{ file: "sample1.pptx", mtime: "2024-01-20T12:34:56.789Z" }, ... ]

  // 2) slides/ にある pptx/ppt をスキャン
  const filesInSlides = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.toLowerCase().endsWith(".pptx") || f.toLowerCase().endsWith(".ppt"));

  // 3) orphan削除 (pdf-list.jsonにあるがslides/に無いファイル)
  pdfList = await removeOrphans(pdfList, filesInSlides);

  // 4) ファイル毎に最終更新をチェック
  for (const f of filesInSlides) {
    const fullPath = path.join(SLIDES_DIR, f);
    const stats = fs.statSync(fullPath);
    // ここでは ISO文字列にする
    const currentMtime = stats.mtime.toISOString();

    // 既にpdf-list.jsonに記録されているものを探す
    const entry = pdfList.find(e => e.file === f);

    if (!entry) {
      // 新規ファイル => PDF変換
      console.log(`New file: ${f}, converting...`);
      await convertToPdf(fullPath, f);
      // PDFリストに追加
      pdfList.push({ file: f, mtime: currentMtime });
    } else {
      // 既存 => mtime が更新されているかチェック
      if (currentMtime > entry.mtime) {
        // 更新されている => PDF再変換
        console.log(`Updated file: ${f}, converting...`);
        await convertToPdf(fullPath, f);
        // mtime更新
        entry.mtime = currentMtime;
      } else {
        // 変更なし => スキップ
        console.log(`No change: ${f}`);
      }
    }
  }

  // 5) pdf-list.json を保存
  fs.writeFileSync(PDF_LIST_PATH, JSON.stringify(pdfList, null, 2), "utf8");
  console.log("pdf-list.json updated!");
}

async function removeOrphans(pdfList, slidesFiles) {
  // slidesFiles に無いファイルがpdfListにあれば orphan
  // => docs/pdfs/xxx.pdf を削除し、リストから外す
  const updatedList = [];
  for (const entry of pdfList) {
    if (!slidesFiles.includes(entry.file)) {
      // orphan => PDF削除
      const baseNoExt = path.parse(entry.file).name;  // sample1.pptx => sample1
      const pdfPath = path.join(PDF_DIR, baseNoExt + ".pdf");
      if (fs.existsSync(pdfPath)) {
        console.log(`Removing orphan PDF: ${pdfPath}`);
        fs.unlinkSync(pdfPath);
      }
      // entry をリストから外す
      console.log(`Removing orphan from pdf-list: ${entry.file}`);
    } else {
      // slidesにまだ残っている => keep
      updatedList.push(entry);
    }
  }
  return updatedList;
}

async function convertToPdf(fullPath, fileName) {
  // fileName: sample1.pptx => PDF => sample1.pdf
  const baseNoExt = path.parse(fileName).name; 
  const pdfName = baseNoExt + ".pdf";

  // LibreOfficeで変換 (slides -> docs/pdfs)
  // 1) 一時フォルダに出力 or 直接 docs/pdfs に出力する場合
  //    "--outdir docs/pdfs" が可能
  const pdfOutputDir = path.join(__dirname, "..", "docs", "pdfs");
  const cmd = `${LIBREOFFICE_CMD} "${fullPath}" --outdir "${pdfOutputDir}"`;
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
