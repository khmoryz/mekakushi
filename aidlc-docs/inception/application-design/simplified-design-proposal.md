# 簡素化された設計提案

## 問題の分析

現在の設計は単純なマスキングアプリに対して過度に複雑です：
- 不必要な抽象化レイヤー
- 責任の重複
- テストが困難な深い依存関係
- 型定義の不完全性

## 簡素化された設計

### 1. 簡素化されたアーキテクチャ

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

### 2. 統合されたコンポーネント

#### メインプロセス（3コンポーネントのみ）

```typescript
// 1. MaskingEngine - 全ての処理を統合
class MaskingEngine {
  private dictionary: Dictionary;
  private fileManager: FileManager;
  
  async maskText(text: string, options: MaskingOptions): Promise<MaskingResult>
  async loadDictionary(): Promise<void>
  async saveDictionary(): Promise<void>
}

// 2. Dictionary - 辞書データのみ
class Dictionary {
  private entries: Map<string, string>;
  
  find(text: string): string | null
  add(original: string, masked: string): void
  remove(original: string): void
  getAll(): DictionaryEntry[]
}

// 3. FileManager - ファイル操作のみ
class FileManager {
  async readFile(path: string): Promise<string>
  async writeFile(path: string, content: string): Promise<void>
  async exists(path: string): Promise<boolean>
}
```

#### レンダラープロセス（1つのApp + 4つのコンポーネント）

```typescript
// メインアプリ
const App = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  
  return (
    <div className="app">
      <InputPanel text={inputText} onTextChange={setInputText} />
      <OutputPanel text={outputText} />
      <Controls onMask={handleMask} />
      <DictionaryPanel entries={dictionary} onUpdate={handleDictionaryUpdate} />
    </div>
  );
};

// 簡素化されたコンポーネント
const InputPanel = ({ text, onTextChange }) => { /* ... */ };
const OutputPanel = ({ text }) => { /* ... */ };
const Controls = ({ onMask }) => { /* ... */ };
const DictionaryPanel = ({ entries, onUpdate }) => { /* ... */ };
```

### 3. 簡素化されたIPC通信

```typescript
// IPCチャンネル（4つのみ）
const IPC_CHANNELS = {
  MASK_TEXT: 'mask-text',
  LOAD_DICTIONARY: 'load-dictionary', 
  SAVE_DICTIONARY: 'save-dictionary',
  UPDATE_DICTIONARY: 'update-dictionary'
} as const;

// メインプロセス
ipcMain.handle(IPC_CHANNELS.MASK_TEXT, async (_, text: string, options: MaskingOptions) => {
  return await maskingEngine.maskText(text, options);
});

// レンダラープロセス
const maskText = async (text: string, options: MaskingOptions): Promise<MaskingResult> => {
  return await ipcRenderer.invoke(IPC_CHANNELS.MASK_TEXT, text, options);
};
```

### 4. 完全な型定義

```typescript
// 基本型
interface MaskingOptions {
  mode: 'manual' | 'pattern' | 'dictionary';
  patterns?: RegExp[];
  maskChar?: string;
  preserveLength?: boolean;
}

interface MaskingResult {
  maskedText: string;
  matches: TextMatch[];
  appliedRules: string[];
}

interface TextMatch {
  original: string;
  masked: string;
  start: number;
  end: number;
  type: 'manual' | 'pattern' | 'dictionary';
}

interface DictionaryEntry {
  id: string;
  original: string;
  masked: string;
  createdAt: Date;
  usageCount: number;
}

// エラー型
class MaskingError extends Error {
  constructor(
    message: string,
    public code: 'FILE_ERROR' | 'PATTERN_ERROR' | 'DICTIONARY_ERROR',
    public details?: any
  ) {
    super(message);
  }
}
```

### 5. テスタビリティの改善

```typescript
// 依存性注入でテスト可能
class MaskingEngine {
  constructor(
    private dictionary: Dictionary = new Dictionary(),
    private fileManager: FileManager = new FileManager()
  ) {}
}

// テスト例
describe('MaskingEngine', () => {
  let engine: MaskingEngine;
  let mockDictionary: jest.Mocked<Dictionary>;
  let mockFileManager: jest.Mocked<FileManager>;
  
  beforeEach(() => {
    mockDictionary = createMockDictionary();
    mockFileManager = createMockFileManager();
    engine = new MaskingEngine(mockDictionary, mockFileManager);
  });
  
  it('should mask email addresses', async () => {
    const result = await engine.maskText('Contact: john@example.com', {
      mode: 'pattern',
      patterns: [EMAIL_PATTERN]
    });
    
    expect(result.maskedText).toBe('Contact: ***@***.***');
    expect(result.matches).toHaveLength(1);
  });
});
```

## 利点

### 🎯 **簡素性**
- 3層 → 2層アーキテクチャ
- 11コンポーネント → 7コンポーネント
- 複雑な依存関係の排除

### 🧪 **テスタビリティ**
- 浅い依存関係でモックが容易
- 各コンポーネントの独立テスト
- IPC通信の最小化

### 🚀 **保守性**
- 明確な責任分離
- 完全な型定義
- 一貫したエラーハンドリング

### ⚡ **パフォーマンス**
- IPC通信の最小化
- 不要な抽象化レイヤーの排除
- 直接的なデータフロー

## 移行計画

1. **フェーズ1**: 型定義の完全化
2. **フェーズ2**: サービス層の統合
3. **フェーズ3**: UIコンポーネントの簡素化
4. **フェーズ4**: テストスイートの実装

この簡素化により、開発時間を30-40%短縮し、バグ発生率を大幅に削減できると予想されます。
