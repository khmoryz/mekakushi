/**
 * プロジェクト管理のデータモデル
 */

/**
 * プロジェクト情報のスキーマ
 */
class Project {
  constructor(name, id = null) {
    this.id = id || this.generateId();
    this.name = name;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.dictionaryPath = `projects/${this.id}/dictionary.json`;
  }

  /**
   * ユニークなプロジェクトIDを生成
   */
  generateId() {
    return 'project-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * プロジェクト情報を更新
   */
  updateTimestamp() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * JSONシリアライゼーション用
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      dictionaryPath: this.dictionaryPath
    };
  }

  /**
   * JSONから復元
   */
  static fromJSON(json) {
    const project = new Project(json.name, json.id);
    project.createdAt = json.createdAt;
    project.updatedAt = json.updatedAt;
    project.dictionaryPath = json.dictionaryPath;
    return project;
  }
}

/**
 * マスキング辞書エントリのスキーマ
 */
class MaskingEntry {
  constructor(original, masked) {
    this.original = original;
    this.masked = masked;
    this.count = 1;
    this.lastUsed = new Date().toISOString();
  }

  /**
   * 使用回数を増加
   */
  incrementUsage() {
    this.count++;
    this.lastUsed = new Date().toISOString();
  }

  /**
   * JSONシリアライゼーション用
   */
  toJSON() {
    return {
      original: this.original,
      masked: this.masked,
      count: this.count,
      lastUsed: this.lastUsed
    };
  }

  /**
   * JSONから復元
   */
  static fromJSON(json) {
    const entry = new MaskingEntry(json.original, json.masked);
    entry.count = json.count || 1;
    entry.lastUsed = json.lastUsed || new Date().toISOString();
    return entry;
  }
}

/**
 * マスキング辞書のスキーマ
 */
class MaskingDictionary {
  constructor(projectId) {
    this.projectId = projectId;
    this.entries = new Map();
    this.version = '1.0';
    this.lastModified = new Date().toISOString();
  }

  /**
   * エントリを追加
   */
  addEntry(original, masked) {
    const key = original.toLowerCase();
    if (this.entries.has(key)) {
      this.entries.get(key).incrementUsage();
    } else {
      this.entries.set(key, new MaskingEntry(original, masked));
    }
    this.updateTimestamp();
  }

  /**
   * エントリを削除
   */
  removeEntry(original) {
    const key = original.toLowerCase();
    const removed = this.entries.delete(key);
    if (removed) {
      this.updateTimestamp();
    }
    return removed;
  }

  /**
   * エントリを取得
   */
  getEntry(original) {
    const key = original.toLowerCase();
    return this.entries.get(key);
  }

  /**
   * 全エントリを取得
   */
  getAllEntries() {
    return Array.from(this.entries.values());
  }

  /**
   * タイムスタンプを更新
   */
  updateTimestamp() {
    this.lastModified = new Date().toISOString();
  }

  /**
   * JSONシリアライゼーション用
   */
  toJSON() {
    const entriesObj = {};
    for (const [key, entry] of this.entries) {
      entriesObj[key] = entry.toJSON();
    }

    return {
      projectId: this.projectId,
      entries: entriesObj,
      version: this.version,
      lastModified: this.lastModified
    };
  }

  /**
   * JSONから復元
   */
  static fromJSON(json) {
    const dictionary = new MaskingDictionary(json.projectId);
    dictionary.version = json.version || '1.0';
    dictionary.lastModified = json.lastModified || new Date().toISOString();

    if (json.entries) {
      for (const [key, entryJson] of Object.entries(json.entries)) {
        dictionary.entries.set(key, MaskingEntry.fromJSON(entryJson));
      }
    }

    return dictionary;
  }
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Project, MaskingEntry, MaskingDictionary };
}

// グローバル変数として定義（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.ProjectModels = { Project, MaskingEntry, MaskingDictionary };
}
