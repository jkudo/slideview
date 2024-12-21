// scripts/generate-index.js

const fs = require('fs-extra');
const path = require('path');

// PDFsが格納されるディレクトリ
const pdfDir = path.join(__dirname, '..', 'docs', 'pdfs');
// 出力先 (index.html)
const outputHtml = path.join(__dirname, '..', 'docs', 'index.html');

async function main() {
  // docs/pdfsディレクトリ内のファイルをスキャン
  let pdfFiles = [];
  if (fs.existsSync(pdfDir)) {
    pdfFiles = fs.readdirSync(pdfDir).filter(file => file.toLowerCase().endsWith('.pdf'));
  }

  // シンプルなHTML生成
  let htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>PDF List</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 20px;
    }
    a {
      color: blue;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>PDF List</h1>
  <p>以下のPDFをクリックすると「viewer.html」でページめくり表示ができます。</p>
  <ul>
`;

  // PDF ファイルを一覧にして <li>リンクを生成
  pdfFiles.forEach(file => {
    htmlContent += `
    <li><a href="./viewer.html?pdf=${file}">${file}</a></li>`;
  });

  htmlContent += `
  </ul>
</body>
</html>
`;

  // docs/index.html に書き込み
  fs.writeFileSync(outputHtml, htmlContent, 'utf8');
  console.log(`index.html generated successfully!
  => Found ${pdfFiles.length} PDF(s).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
