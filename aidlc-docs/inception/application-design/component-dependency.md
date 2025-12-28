# 簡素化されたコンポーネント依存関係

## 依存関係マトリックス

### メインプロセス依存関係（3コンポーネント）

| コンポーネント | MaskingEngine | Dictionary | FileManager |
|---|---|---|---|
| **MaskingEngine** | - | ✓ | ✓ |
| **Dictionary** | - | - | - |
| **FileManager** | - | - | - |

### レンダラープロセス依存関係（1つのApp + 4つのコンポーネント）

| コンポーネント | App State | IPC Service |
|---|---|---|
| **App** | ✓ | ✓ |
| **InputPanel** | ✓ | - |
| **OutputPanel** | ✓ | - |
| **Controls** | ✓ | ✓ |
| **DictionaryPanel** | ✓ | ✓ |

## 簡素化されたアーキテクチャ図

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

## データフロー図

### 簡素化されたデータフロー

```
1. マスキング処理フロー
   InputPanel → App State → Controls → IPC Service → MaskingEngine
   MaskingEngine → IPC Service → App State → OutputPanel

2. 辞書管理フロー
   DictionaryPanel → App State → IPC Service → MaskingEngine.dictionary
   MaskingEngine.dictionary → FileManager → IPC Service → App State → DictionaryPanel

3. ファイル操作フロー
   MaskingEngine → FileManager → File System
   File System → FileManager → MaskingEngine
```

## 通信パターン

### 1. IPC通信パターン（プロセス間）

#### 統合されたIPCチャンネル（4つのみ）
```typescript
const IPC_CHANNELS = {
  MASK_TEXT: 'mask-text',
  LOAD_DICTIONARY: 'load-dictionary',
  SAVE_DICTIONARY: 'save-dictionary',
  UPDATE_DICTIONARY: 'update-dictionary'
} as const;

// メインプロセス - 統合ハンドラー
ipcMain.handle(IPC_CHANNELS.MASK_TEXT, async (_, text: string, options: MaskingOptions) => {
  return await maskingEngine.maskText(text, options);
});

ipcMain.handle(IPC_CHANNELS.LOAD_DICTIONARY, async () => {
  await maskingEngine.loadDictionary();
  return maskingEngine.dictionary.getAll();
});

ipcMain.handle(IPC_CHANNELS.SAVE_DICTIONARY, async () => {
  await maskingEngine.saveDictionary();
});

ipcMain.handle(IPC_CHANNELS.UPDATE_DICTIONARY, async (_, action: DictionaryAction) => {
  const { type, data } = action;
  
  switch (type) {
    case 'ADD':
      maskingEngine.dictionary.add(data.original, data.masked);
      break;
    case 'REMOVE':
      maskingEngine.dictionary.remove(data.original);
      break;
    case 'CLEAR':
      maskingEngine.dictionary.clear();
      break;
  }
  
  await maskingEngine.saveDictionary();
  return maskingEngine.dictionary.getAll();
});

// レンダラープロセス - 統合クライアント
class IPCService {
  static async maskText(text: string, options: MaskingOptions): Promise<MaskingResult> {
    return await ipcRenderer.invoke(IPC_CHANNELS.MASK_TEXT, text, options);
  }
  
  static async loadDictionary(): Promise<DictionaryEntry[]> {
    return await ipcRenderer.invoke(IPC_CHANNELS.LOAD_DICTIONARY);
  }
  
  static async saveDictionary(): Promise<void> {
    await ipcRenderer.invoke(IPC_CHANNELS.SAVE_DICTIONARY);
  }
  
  static async updateDictionary(action: DictionaryAction): Promise<DictionaryEntry[]> {
    return await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DICTIONARY, action);
  }
}
```

### 2. 状態管理パターン（レンダラープロセス内）

#### React Context + useReducer
```typescript
// 統合状態管理
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

// App コンポーネント
const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 統合されたハンドラー
  const handleMask = async (options: MaskingOptions) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await IPCService.maskText(state.inputText, options);
      dispatch({ type: 'SET_OUTPUT_TEXT', payload: result.maskedText });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  const handleDictionaryUpdate = async (action: DictionaryAction) => {
    try {
      const updatedDictionary = await IPCService.updateDictionary(action);
      dispatch({ type: 'SET_DICTIONARY', payload: updatedDictionary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="app">
        <InputPanel />
        <OutputPanel />
        <Controls onMask={handleMask} />
        <DictionaryPanel onUpdate={handleDictionaryUpdate} />
      </div>
    </AppContext.Provider>
  );
};
```

### 3. 依存性注入パターン（メインプロセス）

#### コンストラクタ注入
```typescript
class MaskingEngine {
  constructor(
    private dictionary: Dictionary = new Dictionary(),
    private fileManager: FileManager = new FileManager()
  ) {}
  
  async maskText(text: string, options: MaskingOptions): Promise<MaskingResult> {
    // dictionary と fileManager を使用
  }
}

// テスト用のモック注入
const mockDictionary = new MockDictionary();
const mockFileManager = new MockFileManager();
const testEngine = new MaskingEngine(mockDictionary, mockFileManager);
```

## エラー伝播パターン

### 簡素化されたエラーフロー
```
Error Source → Component → App State → UI Error Display

例:
FileManager (ファイル読み込みエラー)
  → MaskingEngine (MaskingError でラップ)
  → IPC Service (エラー送信)
  → App State (エラー状態更新)
  → Error Display (ユーザー通知)
```

### エラーハンドリング実装
```typescript
// カスタムエラークラス
class MaskingError extends Error {
  constructor(
    message: string,
    public code: 'FILE_ERROR' | 'PATTERN_ERROR' | 'DICTIONARY_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'MaskingError';
  }
}

// MaskingEngine でのエラーハンドリング
class MaskingEngine {
  async loadDictionary(): Promise<void> {
    try {
      // ファイル読み込み処理
    } catch (error) {
      throw new MaskingError('Failed to load dictionary', 'FILE_ERROR', error);
    }
  }
}

// App でのエラーハンドリング
const App: React.FC = () => {
  const handleError = useCallback((error: Error) => {
    console.error('Application error:', error);
    dispatch({ type: 'SET_ERROR', payload: error.message });
    
    // エラー通知
    if (error instanceof MaskingError) {
      showErrorNotification(`${error.code}: ${error.message}`);
    } else {
      showErrorNotification(error.message);
    }
  }, []);
};
```

## パフォーマンス最適化

### 1. 最小限のIPC通信
```typescript
// 悪い例: 複数のIPC呼び出し
const loadData = async () => {
  const dictionary = await IPCService.loadDictionary();
  const config = await IPCService.loadConfig();
  const history = await IPCService.loadHistory();
};

// 良い例: バッチ読み込み
const loadData = async () => {
  const data = await IPCService.loadAllData(); // 1回のIPC呼び出し
  const { dictionary, config, history } = data;
};
```

### 2. React最適化
```typescript
// メモ化されたコンポーネント
const InputPanel = React.memo<InputPanelProps>(({ text, onTextChange }) => {
  // コンポーネント実装
});

// useCallback でハンドラーをメモ化
const App: React.FC = () => {
  const handleMask = useCallback(async (options: MaskingOptions) => {
    // マスキング処理
  }, [state.inputText]);
  
  const handleDictionaryUpdate = useCallback(async (action: DictionaryAction) => {
    // 辞書更新処理
  }, []);
};
```

### 3. 遅延読み込み
```typescript
// MaskingEngine の遅延初期化
class Application {
  private _maskingEngine?: MaskingEngine;
  
  get maskingEngine(): MaskingEngine {
    if (!this._maskingEngine) {
      this._maskingEngine = new MaskingEngine();
    }
    return this._maskingEngine;
  }
}
```

## セキュリティ考慮事項

### 1. プロセス分離の維持
```typescript
// レンダラープロセス設定
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,        // Node.js統合を無効化
      contextIsolation: true,        // コンテキスト分離を有効化
      preload: path.join(__dirname, 'preload.js')
    }
  });
};

// preload.js でのAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  maskText: (text: string, options: MaskingOptions) => 
    ipcRenderer.invoke('mask-text', text, options),
  loadDictionary: () => 
    ipcRenderer.invoke('load-dictionary'),
  // 必要最小限のAPIのみ公開
});
```

### 2. 入力検証
```typescript
// IPC ハンドラーでの入力検証
ipcMain.handle('mask-text', async (_, text: string, options: MaskingOptions) => {
  // 入力検証
  if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) {
    throw new Error('Invalid text input');
  }
  
  if (!isValidMaskingOptions(options)) {
    throw new Error('Invalid masking options');
  }
  
  return await maskingEngine.maskText(text, options);
});
```

## 設計原則

1. **最小限の依存関係**: 必要最小限の依存関係のみを維持
2. **直接的な通信**: 不要な中間層を排除
3. **型安全性**: TypeScriptによる完全な型定義
4. **エラー境界**: 明確なエラーハンドリング境界
5. **テスタビリティ**: 依存性注入による容易なテスト
6. **パフォーマンス**: IPC通信の最小化

## 利点

- **簡素性**: 複雑な依存関係グラフを排除
- **保守性**: 明確で直接的なデータフロー
- **デバッグ容易性**: 浅い依存関係で問題の特定が容易
- **パフォーマンス**: 最小限のオーバーヘッド
