# 簡素化されたサービス設計

## サービスアーキテクチャ概要

簡素化されたElectronアプリケーションでは、複雑なサービス層を排除し、直接的なコンポーネント間通信を採用します。全ての処理はTypeScriptで実装され、型安全性を確保します。

## 簡素化されたアーキテクチャ

```
レンダラープロセス          メインプロセス
┌─────────────────┐       ┌──────────────────┐
│ App (React/Vue) │ ←IPC→ │ MaskingEngine    │
│ ├─ InputPanel   │       │ ├─ Dictionary    │
│ ├─ OutputPanel  │       │ └─ FileManager   │
│ ├─ Controls     │       └──────────────────┘
│ └─ Dictionary   │
└─────────────────┘
```

## 統合されたサービス（メインプロセス）

### MaskingEngine（統合処理エンジン）
**目的**: 全てのマスキング処理を統合

```typescript
class MaskingEngine {
  private dictionary: Dictionary;
  private fileManager: FileManager;
  
  constructor(
    dictionary: Dictionary = new Dictionary(),
    fileManager: FileManager = new FileManager()
  ) {
    this.dictionary = dictionary;
    this.fileManager = fileManager;
  }
  
  // 統合マスキング処理
  async maskText(text: string, options: MaskingOptions): Promise<MaskingResult> {
    const matches: TextMatch[] = [];
    
    // 1. 辞書ベースマスキング
    if (options.mode === 'dictionary' || options.mode === 'manual') {
      matches.push(...this.applyDictionaryMasking(text));
    }
    
    // 2. パターンベースマスキング
    if (options.mode === 'pattern' && options.patterns) {
      matches.push(...this.applyPatternMasking(text, options.patterns));
    }
    
    // 3. 手動選択マスキング
    if (options.mode === 'manual' && options.selection) {
      matches.push(...this.applyManualMasking(text, options.selection));
    }
    
    // 4. 一貫性チェックと結果生成
    const consistentMatches = this.ensureConsistency(matches);
    const maskedText = this.applyMasking(text, consistentMatches, options.maskChar || '*');
    
    return {
      maskedText,
      matches: consistentMatches,
      appliedRules: this.getAppliedRules(consistentMatches)
    };
  }
  
  // 辞書読み込み
  async loadDictionary(): Promise<void> {
    try {
      const dictionaryPath = path.join(this.fileManager.getConfigDirectory(), 'dictionary.json');
      if (await this.fileManager.exists(dictionaryPath)) {
        const content = await this.fileManager.readFile(dictionaryPath);
        this.dictionary.fromJSON(content);
      }
    } catch (error) {
      throw new MaskingError('Failed to load dictionary', 'FILE_ERROR', error);
    }
  }
  
  // 辞書保存
  async saveDictionary(): Promise<void> {
    try {
      const dictionaryPath = path.join(this.fileManager.getConfigDirectory(), 'dictionary.json');
      await this.fileManager.writeFile(dictionaryPath, this.dictionary.toJSON());
    } catch (error) {
      throw new MaskingError('Failed to save dictionary', 'FILE_ERROR', error);
    }
  }
  
  // プライベートメソッド
  private applyDictionaryMasking(text: string): TextMatch[] { /* ... */ }
  private applyPatternMasking(text: string, patterns: RegExp[]): TextMatch[] { /* ... */ }
  private applyManualMasking(text: string, selection: TextSelection): TextMatch[] { /* ... */ }
  private ensureConsistency(matches: TextMatch[]): TextMatch[] { /* ... */ }
  private applyMasking(text: string, matches: TextMatch[], maskChar: string): string { /* ... */ }
  private getAppliedRules(matches: TextMatch[]): string[] { /* ... */ }
}
```

## フロントエンドサービス（レンダラープロセス）

### App State Management（統合状態管理）
**目的**: アプリケーション全体の状態を一元管理

```typescript
// React Context + useReducer を使用した状態管理
interface AppState {
  inputText: string;
  outputText: string;
  dictionary: DictionaryEntry[];
  isLoading: boolean;
  error: string | null;
  maskingOptions: MaskingOptions;
}

type AppAction = 
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'SET_OUTPUT_TEXT'; payload: string }
  | { type: 'SET_DICTIONARY'; payload: DictionaryEntry[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MASKING_OPTIONS'; payload: MaskingOptions };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload };
    case 'SET_OUTPUT_TEXT':
      return { ...state, outputText: action.payload };
    case 'SET_DICTIONARY':
      return { ...state, dictionary: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MASKING_OPTIONS':
      return { ...state, maskingOptions: action.payload };
    default:
      return state;
  }
};

// Context Provider
const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | null>(null);
```

### IPC Service（統合通信サービス）
**目的**: メインプロセスとの通信を一元管理

```typescript
class IPCService {
  // マスキング実行
  static async maskText(text: string, options: MaskingOptions): Promise<MaskingResult> {
    try {
      return await ipcRenderer.invoke(IPC_CHANNELS.MASK_TEXT, text, options);
    } catch (error) {
      throw new Error(`Masking failed: ${error.message}`);
    }
  }
  
  // 辞書読み込み
  static async loadDictionary(): Promise<DictionaryEntry[]> {
    try {
      return await ipcRenderer.invoke(IPC_CHANNELS.LOAD_DICTIONARY);
    } catch (error) {
      throw new Error(`Dictionary load failed: ${error.message}`);
    }
  }
  
  // 辞書保存
  static async saveDictionary(): Promise<void> {
    try {
      await ipcRenderer.invoke(IPC_CHANNELS.SAVE_DICTIONARY);
    } catch (error) {
      throw new Error(`Dictionary save failed: ${error.message}`);
    }
  }
  
  // 辞書更新
  static async updateDictionary(action: DictionaryAction): Promise<DictionaryEntry[]> {
    try {
      return await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DICTIONARY, action);
    } catch (error) {
      throw new Error(`Dictionary update failed: ${error.message}`);
    }
  }
}
```

## 簡素化されたデータフロー

### マスキング処理フロー
```
1. ユーザー操作
   InputPanel → App State → Controls

2. マスキング実行
   Controls → IPCService.maskText() → MaskingEngine

3. 結果表示
   MaskingEngine → IPCService → App State → OutputPanel
```

### 辞書管理フロー
```
1. 辞書操作
   DictionaryPanel → App State → IPCService.updateDictionary()

2. 辞書更新
   IPCService → MaskingEngine.dictionary → FileManager

3. UI更新
   MaskingEngine → IPCService → App State → DictionaryPanel
```

## エラーハンドリング戦略

### 統合エラーハンドリング
```typescript
// カスタムエラークラス
class MaskingError extends Error {
  constructor(
    message: string,
    public code: 'FILE_ERROR' | 'PATTERN_ERROR' | 'DICTIONARY_ERROR' | 'IPC_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'MaskingError';
  }
}

// App レベルでのエラーハンドリング
const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const handleError = useCallback((error: Error) => {
    console.error('Application error:', error);
    dispatch({ 
      type: 'SET_ERROR', 
      payload: error.message 
    });
    
    // エラー通知（トースト、モーダルなど）
    showErrorNotification(error.message);
  }, []);
  
  // グローバルエラーハンドラー
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      handleError(new Error(event.message));
    };
    
    window.addEventListener('error', handleUnhandledError);
    return () => window.removeEventListener('error', handleUnhandledError);
  }, [handleError]);
};
```

## 型定義（完全版）

```typescript
// 基本型
interface MaskingOptions {
  mode: 'manual' | 'pattern' | 'dictionary';
  patterns?: RegExp[];
  selection?: TextSelection;
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

interface TextSelection {
  start: number;
  end: number;
  text: string;
}

interface DictionaryEntry {
  id: string;
  original: string;
  masked: string;
  createdAt: Date;
  usageCount: number;
}

interface DictionaryAction {
  type: 'ADD' | 'REMOVE' | 'CLEAR';
  data?: {
    original: string;
    masked: string;
  };
}

// IPC チャンネル定数
const IPC_CHANNELS = {
  MASK_TEXT: 'mask-text',
  LOAD_DICTIONARY: 'load-dictionary',
  SAVE_DICTIONARY: 'save-dictionary',
  UPDATE_DICTIONARY: 'update-dictionary'
} as const;
```

## 設計原則

1. **統合性**: 複数のサービスを単一のエンジンに統合
2. **直接性**: 不要な抽象化レイヤーを排除
3. **型安全性**: TypeScriptによる完全な型定義
4. **テスタビリティ**: 依存性注入による容易なテスト
5. **エラー境界**: 明確なエラーハンドリング境界
6. **パフォーマンス**: 最小限のIPC通信

## 利点

- **簡素性**: 3層 → 2層アーキテクチャ
- **保守性**: 明確な責任分離と直接的なデータフロー
- **テスタビリティ**: 浅い依存関係でモックが容易
- **パフォーマンス**: IPC通信の最小化と不要な抽象化の排除
