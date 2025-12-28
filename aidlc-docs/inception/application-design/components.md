# 簡素化されたコンポーネント設計

## アーキテクチャ概要
**技術スタック**: Electron + React/Vue + Node.js + TypeScript
**アーキテクチャパターン**: 簡素化された2層アーキテクチャ
**プロセス分離**: メインプロセス（処理エンジン）+ レンダラープロセス（UI）

## 簡素化されたアーキテクチャ

```
レンダラープロセス          メインプロセス
┌─────────────────┐       ┌──────────────────┐
│ App (React/Vue) │ ←IPC→ │ MaskingEngine    │
│ ├─ InputPanel   │       │ ├─ TextProcessor │
│ ├─ OutputPanel  │       │ ├─ Dictionary    │
│ ├─ Controls     │       │ └─ FileManager   │
│ └─ Dictionary   │       └──────────────────┘
└─────────────────┘
```

## メインプロセス（3コンポーネント）

### 1. MaskingEngine
- **目的**: 全てのマスキング処理を統合
- **責任**:
  - テキストマスキング実行
  - パターン検出とマスキング
  - 辞書ベースマスキング
  - 一貫性チェック
- **技術**: Node.js + TypeScript + 正規表現

### 2. Dictionary
- **目的**: マスキング辞書データの管理
- **責任**:
  - 辞書エントリの検索・追加・削除
  - メモリ内辞書の管理
  - 使用統計の追跡
- **技術**: Map/Set + TypeScript

### 3. FileManager
- **目的**: ファイルシステム操作
- **責任**:
  - 辞書ファイルの読み書き
  - 設定ファイルの管理
  - バックアップ作成
- **技術**: Node.js fs + path

## レンダラープロセス（1つのApp + 4つのコンポーネント）

### App
- **目的**: アプリケーション全体の状態管理
- **責任**:
  - グローバル状態管理
  - IPC通信の調整
  - エラーハンドリング
- **技術**: React/Vue + TypeScript + Context/Redux

### InputPanel
- **目的**: テキスト入力と選択
- **責任**:
  - テキスト入力・編集
  - テキスト選択とハイライト
  - クリップボード統合
- **技術**: React/Vue + contentEditable

### OutputPanel
- **目的**: マスキング結果の表示
- **責任**:
  - マスキング済みテキスト表示
  - マスキング箇所の視覚化
  - 結果のコピー機能
- **技術**: React/Vue + 読み取り専用表示

### Controls
- **目的**: マスキング操作の制御
- **責任**:
  - マスキングモードの選択
  - パターン設定
  - 実行ボタン
- **技術**: React/Vue + フォーム

### DictionaryPanel
- **目的**: 辞書の表示と編集
- **責任**:
  - 辞書エントリの一覧表示
  - エントリの追加・編集・削除
  - 検索とフィルタリング
- **技術**: React/Vue + テーブル

## 簡素化されたIPC通信

```typescript
// 4つの明確なチャンネル
const IPC_CHANNELS = {
  MASK_TEXT: 'mask-text',
  LOAD_DICTIONARY: 'load-dictionary', 
  SAVE_DICTIONARY: 'save-dictionary',
  UPDATE_DICTIONARY: 'update-dictionary'
} as const;
```

## 設計原則
- **簡素性**: 最小限のコンポーネントで最大の機能
- **明確性**: 各コンポーネントの責任が明確
- **テスタビリティ**: 浅い依存関係で容易なテスト
- **保守性**: 直接的なデータフローで理解しやすい
