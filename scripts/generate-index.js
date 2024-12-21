// scripts/generate-index.js
const fs = require('fs-extra');
const path = require('path');

// PDFが格納されるディレクトリ
const pdfDir = path.join(__dirname, '..', 'docs', 'pdfs');
// 書き出す先の JSONファイル
const outputJson = path.join(__dirname, '..', 'docs', 'pdf-list.json');

async function main() {
  let pdfDataList = [];
  if (fs.existsSync(pdfDir)) {
    const allFiles = fs.readdirSync(pdfDir);

    // pdfファイルごとに { name, mtime } を取得し JST化
    pdfDataList = allFiles
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(pdfDir, file);
        const stats = fs.statSync(filePath);
        // stats.mtime は現地時間ベース (GitHub ActionsならUTCかもしれません)
        // JST (+9h) に変換し、YYYY-MM-DD HH:mm:ss 形式で書き出す
        const jstMtimeStr = formatDateTimeJST(stats.mtime);
        return {
          name: file,
          mtime: jstMtimeStr,
          // ソート用に Dateオブジェクトやtimestampを持たせてもOK
          // rawTime: stats.mtime.getTime() // (msec, UTC)
        };
      });

    // mtime が新しい順 (降順) にソート
    // ただし JST文字列は比較しづらいので、rawTimeを付けて比較してもよい
    // ここでは "YYYY-MM-DD HH:mm:ss" の文字列が降順になるように単純比較
    // ("2024-01-15 10:00:00" > "2024-01-14 ..." → true)
    // ただし文字列比較では微妙なケースが少ないため一応OK。
    // 本来は stats.mtime.getTime() を使って数値比較を推奨。
    pdfDataList.sort((a, b) => {
      // もしrawTimeを持たせるなら a.rawTime > b.rawTime ? -1 : 1;
      return b.mtime.localeCompare(a.mtime);
    });
  }

  console.log(`Found PDFs:`, pdfDataList);

  // JSON文字列に変換
  const jsonContent = JSON.stringify(pdfDataList, null, 2);

  // docs/pdf-list.json に書き込む
  await fs.writeFile(outputJson, jsonContent, 'utf8');
  console.log(`Successfully written: ${outputJson}`);
}

// JST (+9h) で整形
function formatDateTimeJST(mtime) {
  // JS Date はUTC/ローカル色々あるので、確実に +9h 加算して文字列化する。
  // 例: GitHub Actions は基本UTCかもしれない
  // 以下のように getTime() + 9h するアプローチ
  const JST_OFFSET = 9 * 60; // 9時間(分)
  const localTime = mtime.getTime(); // msec
  const jstTime = localTime + JST_OFFSET * 60 * 1000;
  const jstDate = new Date(jstTime);

  const yyyy = jstDate.getFullYear();
  const mm = String(jstDate.getMonth() + 1).padStart(2, '0');
  const dd = String(jstDate.getDate()).padStart(2, '0');
  const hh = String(jstDate.getHours()).padStart(2, '0');
  const mi = String(jstDate.getMinutes()).padStart(2, '0');
  const ss = String(jstDate.getSeconds()).padStart(2, '0');
  // "YYYY-MM-DD HH:mm:ss"
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
