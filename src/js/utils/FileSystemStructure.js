/**
 * ファイルシステム構造の定義
 */

/**
 * Mekakushiアプリケーションのファイルシステム構造
 * 
 * ユーザーデータディレクトリ構造:
 * ~/Library/Application Support/Mekakushi/
 * ├── projects.json                    # プロジェクト一覧
 * ├── settings.json                    # アプリケーション設定
 * ├── current-project.json             # 現在選択中のプロジェクト
 * └── projects/                        # プロジェクトデータ
 *     ├── project-{id}/
 *     │   ├── dictionary.json          # マスキング辞書
 *     │   └── metadata.json            # プロジェクトメタデータ
 *     └── project-{id2}/
 *         ├── dictionary.json
 *         └── metadata.json
 */

class FileSystemStructure {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.projectsFile = this.getPath('projects.json');
    this.settingsFile = this.getPath('settings.json');
    this.currentProjectFile = this.getPath('current-project.json');
    this.projectsDir = this.getPath('projects');
  }

  /**
   * ユーザーデータディレクトリからの相対パスを取得
   */
  getPath(relativePath) {
    const path = require('path');
    return path.join(this.userDataPath, relativePath);
  }

  /**
   * プロジェクトディレクトリのパスを取得
   */
  getProjectDir(projectId) {
    const path = require('path');
    return path.join(this.projectsDir, `project-${projectId}`);
  }

  /**
   * プロジェクトの辞書ファイルパスを取得
   */
  getProjectDictionaryPath(projectId) {
    const path = require('path');
    return path.join(this.getProjectDir(projectId), 'dictionary.json');
  }

  /**
   * プロジェクトのメタデータファイルパスを取得
   */
  getProjectMetadataPath(projectId) {
    const path = require('path');
    return path.join(this.getProjectDir(projectId), 'metadata.json');
  }

  /**
   * 必要なディレクトリを作成
   */
  ensureDirectories() {
    const fs = require('fs');

    // メインディレクトリ
    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
    }

    // プロジェクトディレクトリ
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true });
    }
  }

  /**
   * プロジェクト用ディレクトリを作成
   */
  ensureProjectDirectory(projectId) {
    const fs = require('fs');
    const projectDir = this.getProjectDir(projectId);

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    return projectDir;
  }

  /**
   * デフォルト設定ファイルを作成
   */
  createDefaultFiles() {
    const fs = require('fs');

    // projects.json
    if (!fs.existsSync(this.projectsFile)) {
      const defaultProjects = {
        version: '1.0',
        projects: [],
        lastModified: new Date().toISOString()
      };
      fs.writeFileSync(this.projectsFile, JSON.stringify(defaultProjects, null, 2));
    }

    // settings.json
    if (!fs.existsSync(this.settingsFile)) {
      const defaultSettings = {
        version: '1.0',
        theme: 'dark',
        autoSave: true,
        maxTextSize: 10485760, // 10MB
        lastModified: new Date().toISOString()
      };
      fs.writeFileSync(this.settingsFile, JSON.stringify(defaultSettings, null, 2));
    }

    // current-project.json
    if (!fs.existsSync(this.currentProjectFile)) {
      const defaultCurrentProject = {
        version: '1.0',
        currentProjectId: null,
        lastModified: new Date().toISOString()
      };
      fs.writeFileSync(this.currentProjectFile, JSON.stringify(defaultCurrentProject, null, 2));
    }
  }

  /**
   * ファイルシステム構造を初期化
   */
  initialize() {
    this.ensureDirectories();
    this.createDefaultFiles();
  }

  /**
   * プロジェクトファイルの整合性をチェック
   */
  validateProjectFiles(projectId) {
    const fs = require('fs');
    const projectDir = this.getProjectDir(projectId);
    const dictionaryPath = this.getProjectDictionaryPath(projectId);
    const metadataPath = this.getProjectMetadataPath(projectId);

    const issues = [];

    if (!fs.existsSync(projectDir)) {
      issues.push(`プロジェクトディレクトリが存在しません: ${projectDir}`);
    }

    if (!fs.existsSync(dictionaryPath)) {
      issues.push(`辞書ファイルが存在しません: ${dictionaryPath}`);
    }

    if (!fs.existsSync(metadataPath)) {
      issues.push(`メタデータファイルが存在しません: ${metadataPath}`);
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * 破損したプロジェクトファイルを修復
   */
  repairProjectFiles(projectId, projectData) {
    const fs = require('fs');

    // プロジェクトディレクトリを作成
    this.ensureProjectDirectory(projectId);

    // 辞書ファイルを作成/修復
    const dictionaryPath = this.getProjectDictionaryPath(projectId);
    if (!fs.existsSync(dictionaryPath)) {
      const emptyDictionary = {
        projectId: projectId,
        entries: {},
        version: '1.0',
        lastModified: new Date().toISOString()
      };
      fs.writeFileSync(dictionaryPath, JSON.stringify(emptyDictionary, null, 2));
    }

    // メタデータファイルを作成/修復
    const metadataPath = this.getProjectMetadataPath(projectId);
    if (!fs.existsSync(metadataPath)) {
      const metadata = {
        projectId: projectId,
        name: projectData?.name || 'Untitled Project',
        createdAt: projectData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
  }
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileSystemStructure;
}

// グローバル変数として定義（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.FileSystemStructure = FileSystemStructure;
}
