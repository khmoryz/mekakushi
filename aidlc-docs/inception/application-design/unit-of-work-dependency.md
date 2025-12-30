# 作業単位依存関係

## 依存関係概要

### ユニット構成
**Mekakushi** - 単一の統合Electronアプリケーション

### 内部コンポーネント依存関係

#### メインプロセス依存関係マトリックス

| コンポーネント | MaskingEngine | Dictionary | FileManager |
|---|---|---|---|
| **MaskingEngine** | - | ✓ | ✓ |
| **Dictionary** | - | - | - |
| **FileManager** | - | - | - |

#### レンダラープロセス依存関係マトリックス

| コンポーネント | App State | IPC Service |
|---|---|---|
| **App** | ✓ | ✓ |
| **InputPanel** | ✓ | - |
| **OutputPanel** | ✓ | - |
| **Controls** | ✓ | ✓ |
| **DictionaryPanel** | ✓ | ✓ |

## 詳細依存関係分析

### メインプロセス内部依存関係

#### MaskingEngine → Dictionary
- **依存タイプ**: 直接依存
- **理由**: 辞書ベースマスキングの実行
- **インターフェース**: 
  - `dictionary.find(text)` - エントリ検索
  - `dictionary.add(original, masked)` - 新規エントリ追加
  - `dictionary.getAll()` - 全エントリ取得

#### MaskingEngine → FileManager
- **依存タイプ**: 間接依存（Dictionaryを通じて）
- **理由**: 辞書の永続化
- **インターフェース**:
  - `fileManager.readFile(path)` - 辞書ファイル読み込み
  - `fileManager.writeFile(path, content)` - 辞書ファイル保存

### レンダラープロセス内部依存関係

#### App → App State
- **依存タイプ**: 直接依存
- **理由**: アプリケーション全体の状態管理
- **インターフェース**: React Context/Redux Store

#### App → IPC Service
- **依存タイプ**: 直接依存
- **理由**: メインプロセスとの通信
- **インターフェース**: 
  - `IPCService.maskText(text, options)`
  - `IPCService.loadDictionary()`
  - `IPCService.updateDictionary(action)`

#### UI Components → App State
- **依存タイプ**: 直接依存
- **理由**: 状態の読み取りと更新
- **インターフェース**: React Hooks (useContext, useSelector)

#### Controls/DictionaryPanel → IPC Service
- **依存タイプ**: 直接依存
- **理由**: バックエンド処理の実行
- **インターフェース**: 非同期メソッド呼び出し

## プロセス間依存関係

### IPC通信チャンネル

#### レンダラー → メイン
```typescript
// 4つの主要チャンネル
const IPC_CHANNELS = {
  MASK_TEXT: 'mask-text',
  LOAD_DICTIONARY: 'load-dictionary',
  SAVE_DICTIONARY: 'save-dictionary',
  UPDATE_DICTIONARY: 'update-dictionary'
} as const;
```

#### 通信フロー
```
1. マスキング処理
   Controls → IPC Service → MaskingEngine → Dictionary

2. 辞書管理
   DictionaryPanel → IPC Service → MaskingEngine → Dictionary → FileManager

3. 状態同期
   MaskingEngine → IPC Service → App State → UI Components
```

## 外部依存関係

### システム依存関係

#### Electron Framework
- **依存コンポーネント**: App, IPC Service
- **提供機能**: 
  - デスクトップアプリケーション基盤
  - プロセス間通信（IPC）
  - ネイティブAPI アクセス

#### Node.js Runtime
- **依存コンポーネント**: MaskingEngine, Dictionary, FileManager
- **提供機能**:
  - JavaScript実行環境
  - ファイルシステムAPI
  - 正規表現エンジン

#### macOS System APIs
- **依存コンポーネント**: Electron (間接的)
- **提供機能**:
  - クリップボードアクセス
  - ファイルシステムアクセス
  - ウィンドウ管理

### 開発時依存関係

#### TypeScript Compiler
- **依存範囲**: 全コンポーネント
- **提供機能**: 型チェック、トランスパイル

#### React/Vue Framework
- **依存コンポーネント**: レンダラープロセスの全UIコンポーネント
- **提供機能**: UI コンポーネントシステム、状態管理

#### Electron Builder
- **依存範囲**: ビルドプロセス
- **提供機能**: アプリケーションパッケージング

## データフロー依存関係

### 主要データフロー

#### テキストマスキングフロー
```
InputPanel (text input)
  ↓ App State
Controls (masking request)
  ↓ IPC Service
MaskingEngine (processing)
  ↓ Dictionary (lookup/update)
  ↓ FileManager (persistence)
MaskingEngine (result)
  ↓ IPC Service
App State (result update)
  ↓ OutputPanel (display)
```

#### 辞書管理フロー
```
DictionaryPanel (user action)
  ↓ IPC Service
MaskingEngine (dictionary operation)
  ↓ Dictionary (data manipulation)
  ↓ FileManager (file operations)
Dictionary (updated data)
  ↓ IPC Service
App State (dictionary update)
  ↓ DictionaryPanel (UI refresh)
```

## 依存関係管理戦略

### 依存性注入
```typescript
// メインプロセス
class MaskingEngine {
  constructor(
    private dictionary: Dictionary = new Dictionary(),
    private fileManager: FileManager = new FileManager()
  ) {}
}

// レンダラープロセス
const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  // 依存関係は React Context で管理
};
```

### インターフェース分離
```typescript
// 抽象インターフェース
interface IDictionary {
  find(text: string): string | null;
  add(original: string, masked: string): void;
  getAll(): DictionaryEntry[];
}

// 具象実装
class Dictionary implements IDictionary {
  // 実装
}
```

### 循環依存の回避
- **設計原則**: 単方向依存関係のみ
- **実装**: 上位レイヤーが下位レイヤーに依存
- **通信**: イベント駆動パターンで疎結合

## リスク分析と軽減策

### 高リスク依存関係

#### Electron Framework依存
- **リスク**: Electronバージョン互換性問題
- **軽減策**: 
  - 安定版Electronの使用
  - 段階的アップグレード戦略
  - 互換性テストの自動化

#### ファイルシステム依存
- **リスク**: ファイル操作エラー、権限問題
- **軽減策**:
  - 適切なエラーハンドリング
  - ファイルロック機構
  - バックアップ戦略

### 中リスク依存関係

#### IPC通信依存
- **リスク**: プロセス間通信の失敗
- **軽減策**:
  - タイムアウト設定
  - 再試行機構
  - エラー境界の実装

#### UI Framework依存
- **リスク**: React/Vueバージョン互換性
- **軽減策**:
  - 長期サポート版の使用
  - 段階的移行計画

## パフォーマンス考慮事項

### 最適化ポイント

#### IPC通信の最小化
- **戦略**: バッチ処理、キャッシュ活用
- **実装**: 複数操作の統合、結果キャッシュ

#### メモリ使用量の最適化
- **戦略**: 遅延読み込み、ガベージコレクション
- **実装**: 大容量テキストの分割処理

#### ファイルI/O の最適化
- **戦略**: 非同期処理、バッファリング
- **実装**: Promise ベース API、ストリーミング

この依存関係分析により、Mekakushiの内部構造と外部依存関係が明確になり、開発時の設計決定とリスク管理に役立ちます。
