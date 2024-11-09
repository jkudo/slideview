# Slides Viewer

PowerPointスライドをGitHub Pagesで表示するアプリケーション

## 使い方

1. `slides/` ディレクトリにPowerPointファイル（.pptx）をアップロードします
2. mainブランチにpushすると、GitHub Actionsが自動的に:
   - PowerPointファイルをPDFに変換
   - アプリケーションをビルド
   - GitHub Pagesにデプロイ

## 開発方法

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```