# 🥷 Mekakushi

<div align="center">
  <img src="icon.png" alt="Mekakushi Icon" width="128" height="128">
  
  **シンプルで直感的なテキストマスキングアプリ**
  
  機密情報を安全に隠して、安心してテキストを共有しよう
  
  [![macOS](https://img.shields.io/badge/macOS-supported-blue.svg)](https://www.apple.com/macos/)
  [![Electron](https://img.shields.io/badge/Electron-39.2.7-47848f.svg)](https://electronjs.org/)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
</div>

## ✨ 特徴

### 🚀 **超簡単操作**
- テキストを選択 → 候補をクリック → 完了！
- 3ステップで瞬時にマスキング

### 🎯 **豊富なマスキング候補**
- **🔤 記号・文字**: `***`, `[SECRET]`, `●●●` など30種類
- **🍎 果物**: りんご、みかん、バナナ など18種類  
- **🐱 動物**: ねこ、いぬ、うさぎ など20種類
- **⭐ 星**: シリウス、ベガ、カペラ など20種類
- **🎨 色**: あか、あお、きいろ など18種類
- **🌍 国**: にほん、アメリカ、イギリス など18種類

### 🔍 **正規表現パターンマスキング**
- **事前定義パターン**: メール、電話番号、URL、IPアドレス、クレジットカード、日付
- **カスタムパターン**: 独自の正規表現でパターンマッチング
- **テスト機能**: 適用前にマッチ結果をプレビュー

### ⚡ **リアルタイム同期**
- 入力と同時に出力テキストに反映
- 過去のマスキング履歴を自動適用
- 薄い青色ハイライトで変換箇所を視覚化

### 📋 **便利機能**
- ワンクリックコピー機能
- 辞書の個別削除
- プロジェクト管理機能
- 使用履歴の記録

## 🖼️ スクリーンショット

<div align="center">
  <img src="screenshot.png" alt="Mekakushi Screenshot" width="800">
  <p><em>シンプルで直感的なインターフェース</em></p>
</div>

## 🚀 クイックスタート

### 📥 ダウンロード（推奨）

**最新版をダウンロード:**
1. [Releases ページ](https://github.com/your-username/mekakushi/releases)にアクセス
2. 最新の `Mekakushi-x.x.x.dmg` をダウンロード
3. DMGファイルをダブルクリックしてインストール
4. アプリケーションフォルダにドラッグ&ドロップ

### 🛠️ 開発者向けインストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/mekakushi.git
cd mekakushi/src

# 依存関係をインストール
npm install

# アプリを起動
npm start
```

### 基本的な使い方

1. **📝 テキスト入力**
   - 左側のテキストエリアに機密情報を含むテキストを入力

2. **🎯 マスキング実行**
   - マスキングしたい部分を選択
   - ポップアップから好きなカテゴリと候補を選択
   - 自動的にマスキングされて辞書に記録

3. **🔍 正規表現マスキング**
   - 🔍ボタンをクリック
   - 事前定義パターンまたはカスタムパターンを選択
   - 一括でパターンマッチした文字列をマスキング

4. **📋 結果をコピー**
   - 右下のコピーボタンでマスキング済みテキストをコピー

## 🎨 使用例

### Before（マスキング前）
```
田中太郎さん（taro.tanaka@example.com）に
電話番号090-1234-5678で連絡してください。
パスワードはsecret123です。
```

### After（マスキング後）
```
りんごさん（🌐URL）に
電話番号📞電話番号で連絡してください。
パスワードは⭐シリウスです。
```

## 🛠️ 高度な機能

### 正規表現パターン例

```javascript
// メールアドレス
/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// 電話番号（日本）
/0\d{1,4}-\d{1,4}-\d{4}/g

// クレジットカード番号
/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g
```

### プロジェクト管理

- 複数のプロジェクトでマスキング辞書を分離
- プロジェクトごとの設定保存
- 履歴とメタデータの管理

## 🔧 開発者向け

### 技術スタック

- **フレームワーク**: Electron 39.2.7
- **言語**: JavaScript (ES6+)
- **UI**: HTML5 + CSS3
- **テスト**: Playwright
- **ビルド**: electron-builder

### 開発環境セットアップ

```bash
# 開発モードで起動
npm run dev

# テスト実行
npm test

# ビルド（macOS）
npm run build:mac

# 配布用ビルド
npm run dist
```

### リリース手順

1. **バージョンアップ**
```bash
npm version patch  # または minor, major
```

2. **タグをプッシュ**
```bash
git push origin --tags
```

3. **自動ビルド・リリース**
- GitHub Actionsが自動的にDMGをビルド
- GitHub Releasesに自動アップロード
- リリースノートも自動生成

### プロジェクト構造

```
src/
├── main.js          # Electronメインプロセス
├── preload.js       # プリロードスクリプト
├── index.html       # メインUI
├── js/
│   ├── managers/    # 機能管理クラス
│   ├── models/      # データモデル
│   └── utils/       # ユーティリティ
├── assets/
│   └── icon.png     # アプリアイコン
└── tests/           # テストファイル
```

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: 素晴らしい機能を追加'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コミットメッセージ規約

```
feat(scope): 新機能を追加
fix(scope): バグを修正
docs: ドキュメントを更新
style: コードスタイルを修正
refactor: リファクタリング
test: テストを追加
chore: その他の変更
```

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。
