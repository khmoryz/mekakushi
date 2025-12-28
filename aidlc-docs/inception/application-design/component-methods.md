# 簡素化されたコンポーネントメソッド設計

## メインプロセス（3コンポーネント）

### 1. MaskingEngine
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
  async maskText(text: string, options: MaskingOptions): Promise<MaskingResult>
  
  // 辞書読み込み
  async loadDictionary(): Promise<void>
  
  // 辞書保存
  async saveDictionary(): Promise<void>
  
  // パターン検出とマスキング
  private detectAndMaskPatterns(text: string, patterns: RegExp[]): TextMatch[]
  
  // 一貫性チェック
  private ensureConsistency(text: string, matches: TextMatch[]): TextMatch[]
}
```

### 2. Dictionary
```typescript
class Dictionary {
  private entries: Map<string, string>;
  private stats: Map<string, number>;
  
  constructor() {
    this.entries = new Map();
    this.stats = new Map();
  }
  
  // エントリ検索
  find(text: string): string | null
  
  // エントリ追加
  add(original: string, masked: string): void
  
  // エントリ削除
  remove(original: string): void
  
  // 全エントリ取得
  getAll(): DictionaryEntry[]
  
  // 使用統計更新
  incrementUsage(original: string): void
  
  // 辞書クリア
  clear(): void
  
  // JSON形式でエクスポート
  toJSON(): string
  
  // JSON形式からインポート
  fromJSON(json: string): void
}
```

### 3. FileManager
```typescript
class FileManager {
  private configDir: string;
  
  constructor() {
    this.configDir = this.getConfigDirectory();
  }
  
  // ファイル読み取り
  async readFile(path: string): Promise<string>
  
  // ファイル書き込み
  async writeFile(path: string, content: string): Promise<void>
  
  // ファイル存在確認
  async exists(path: string): Promise<boolean>
  
  // 設定ディレクトリ取得
  private getConfigDirectory(): string
  
  // バックアップ作成
  async createBackup(path: string): Promise<string>
}
```

## レンダラープロセス（1つのApp + 4つのコンポーネント）

### App
```typescript
const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // マスキング実行
  const handleMask = async (options: MaskingOptions): Promise<void>
  
  // 辞書更新
  const handleDictionaryUpdate = async (action: DictionaryAction): Promise<void>
  
  // エラーハンドリング
  const handleError = (error: Error): void
  
  // 初期化
  useEffect(() => {
    initializeApp();
  }, []);
}
```

### InputPanel
```typescript
interface InputPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  onTextSelect?: (selection: TextSelection) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ text, onTextChange, onTextSelect }) => {
  // テキスト変更処理
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void
  
  // テキスト選択処理
  const handleTextSelect = (): void
  
  // クリップボードから貼り付け
  const handlePaste = async (): Promise<void>
  
  // 選択範囲取得
  const getSelection = (): TextSelection | null
}
```

### OutputPanel
```typescript
interface OutputPanelProps {
  text: string;
  matches?: TextMatch[];
}

const OutputPanel: React.FC<OutputPanelProps> = ({ text, matches }) => {
  // クリップボードにコピー
  const handleCopy = async (): Promise<void>
  
  // マスキング箇所のハイライト表示
  const renderHighlightedText = (): JSX.Element
  
  // 結果クリア
  const handleClear = (): void
}
```

### Controls
```typescript
interface ControlsProps {
  onMask: (options: MaskingOptions) => Promise<void>;
  isLoading: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onMask, isLoading }) => {
  const [mode, setMode] = useState<MaskingMode>('manual');
  const [patterns, setPatterns] = useState<string[]>([]);
  const [maskChar, setMaskChar] = useState<string>('*');
  
  // マスキング実行
  const handleMask = async (): Promise<void>
  
  // パターン追加
  const addPattern = (pattern: string): void
  
  // パターン削除
  const removePattern = (index: number): void
  
  // 正規表現検証
  const validatePattern = (pattern: string): boolean
}
```

### DictionaryPanel
```typescript
interface DictionaryPanelProps {
  entries: DictionaryEntry[];
  onUpdate: (action: DictionaryAction) => Promise<void>;
}

const DictionaryPanel: React.FC<DictionaryPanelProps> = ({ entries, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredEntries, setFilteredEntries] = useState<DictionaryEntry[]>([]);
  
  // エントリ追加
  const handleAddEntry = async (original: string, masked: string): Promise<void>
  
  // エントリ編集
  const handleEditEntry = async (id: string, entry: Partial<DictionaryEntry>): Promise<void>
  
  // エントリ削除
  const handleDeleteEntry = async (id: string): Promise<void>
  
  // 検索処理
  const handleSearch = (query: string): void
  
  // エントリフィルタリング
  const filterEntries = (entries: DictionaryEntry[], query: string): DictionaryEntry[]
}
```

## IPC通信メソッド

### メインプロセス（IPC ハンドラー）
```typescript
// マスキング処理
ipcMain.handle(IPC_CHANNELS.MASK_TEXT, async (_, text: string, options: MaskingOptions): Promise<MaskingResult> => {
  return await maskingEngine.maskText(text, options);
});

// 辞書読み込み
ipcMain.handle(IPC_CHANNELS.LOAD_DICTIONARY, async (): Promise<DictionaryEntry[]> => {
  await maskingEngine.loadDictionary();
  return maskingEngine.dictionary.getAll();
});

// 辞書保存
ipcMain.handle(IPC_CHANNELS.SAVE_DICTIONARY, async (): Promise<void> => {
  await maskingEngine.saveDictionary();
});

// 辞書更新
ipcMain.handle(IPC_CHANNELS.UPDATE_DICTIONARY, async (_, action: DictionaryAction): Promise<DictionaryEntry[]> => {
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
```

### レンダラープロセス（IPC クライアント）
```typescript
// マスキング実行
const maskText = async (text: string, options: MaskingOptions): Promise<MaskingResult> => {
  return await ipcRenderer.invoke(IPC_CHANNELS.MASK_TEXT, text, options);
};

// 辞書読み込み
const loadDictionary = async (): Promise<DictionaryEntry[]> => {
  return await ipcRenderer.invoke(IPC_CHANNELS.LOAD_DICTIONARY);
};

// 辞書保存
const saveDictionary = async (): Promise<void> => {
  await ipcRenderer.invoke(IPC_CHANNELS.SAVE_DICTIONARY);
};

// 辞書更新
const updateDictionary = async (action: DictionaryAction): Promise<DictionaryEntry[]> => {
  return await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DICTIONARY, action);
};
```

## 完全な型定義

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

// エラー型
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

// IPC チャンネル定数
const IPC_CHANNELS = {
  MASK_TEXT: 'mask-text',
  LOAD_DICTIONARY: 'load-dictionary',
  SAVE_DICTIONARY: 'save-dictionary',
  UPDATE_DICTIONARY: 'update-dictionary'
} as const;

// React Props型
interface InputPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  onTextSelect?: (selection: TextSelection) => void;
}

interface OutputPanelProps {
  text: string;
  matches?: TextMatch[];
}

interface ControlsProps {
  onMask: (options: MaskingOptions) => Promise<void>;
  isLoading: boolean;
}

interface DictionaryPanelProps {
  entries: DictionaryEntry[];
  onUpdate: (action: DictionaryAction) => Promise<void>;
}

// 状態管理型
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

// ユーティリティ型
type MaskingMode = MaskingOptions['mode'];
type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
```

## 注意事項
- **非同期処理**: ファイルI/OとIPC通信は全て非同期（Promise/async-await）
- **エラーハンドリング**: 全メソッドで適切な例外処理を実装
- **型安全性**: TypeScriptを使用して型安全性を確保
- **パフォーマンス**: 大きなテキストの処理では進捗表示とキャンセル機能を提供
- **テスタビリティ**: 依存性注入により各コンポーネントを独立してテスト可能
