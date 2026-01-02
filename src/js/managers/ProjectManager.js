/**
 * プロジェクト管理クラス
 */

class ProjectManager {
  constructor(electronAPI) {
    this.electronAPI = electronAPI;
    this.currentProject = null;
    this.projects = new Map();
    this.initialized = false;
  }

  /**
   * ProjectManagerを初期化
   */
  async initialize() {
    try {
      // ファイルシステム構造を初期化
      await this.electronAPI.initializeFileSystem();

      // プロジェクト一覧を読み込み
      await this.loadProjects();

      // 現在のプロジェクトを読み込み
      await this.loadCurrentProject();

      this.initialized = true;
      console.log('ProjectManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ProjectManager:', error);
      throw error;
    }
  }

  /**
   * 新しいプロジェクトを作成
   */
  async createProject(name) {
    if (!this.initialized) {
      throw new Error('ProjectManager is not initialized');
    }

    if (!name || name.trim() === '') {
      throw new Error('プロジェクト名は必須です');
    }

    // 同名プロジェクトの存在チェック
    for (const project of this.projects.values()) {
      if (project.name === name.trim()) {
        throw new Error('同じ名前のプロジェクトが既に存在します');
      }
    }

    try {
      // 新しいプロジェクトオブジェクトを作成
      const { Project } = window.ProjectModels;
      const project = new Project(name.trim());

      // プロジェクトファイルを作成
      await this.electronAPI.createProject(project.toJSON());

      // メモリに追加
      this.projects.set(project.id, project);

      // プロジェクト一覧を保存
      await this.saveProjects();

      console.log('Project created successfully:', project.id);
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * プロジェクトを切り替え
   */
  async switchProject(projectId) {
    if (!this.initialized) {
      throw new Error('ProjectManager is not initialized');
    }

    if (!projectId) {
      throw new Error('プロジェクトIDは必須です');
    }

    if (!this.projects.has(projectId)) {
      throw new Error('指定されたプロジェクトが見つかりません');
    }

    try {
      // 現在のプロジェクトを保存（必要に応じて）
      if (this.currentProject) {
        await this.saveCurrentProjectState();
      }

      // 新しいプロジェクトを設定
      this.currentProject = this.projects.get(projectId);

      // 現在のプロジェクト情報を保存
      await this.electronAPI.setCurrentProject(projectId);

      // プロジェクトの辞書を読み込み
      const dictionary = await this.electronAPI.loadProjectDictionary(projectId);

      console.log('Project switched successfully:', projectId);
      return {
        project: this.currentProject,
        dictionary: dictionary
      };
    } catch (error) {
      console.error('Failed to switch project:', error);
      throw error;
    }
  }

  /**
   * プロジェクトを削除
   */
  async deleteProject(projectId) {
    if (!this.initialized) {
      throw new Error('ProjectManager is not initialized');
    }

    if (!projectId) {
      throw new Error('プロジェクトIDは必須です');
    }

    if (!this.projects.has(projectId)) {
      throw new Error('指定されたプロジェクトが見つかりません');
    }

    // 現在のプロジェクトを削除しようとしている場合
    if (this.currentProject && this.currentProject.id === projectId) {
      throw new Error('現在選択中のプロジェクトは削除できません');
    }

    try {
      // プロジェクトファイルを削除
      await this.electronAPI.deleteProject(projectId);

      // メモリから削除
      this.projects.delete(projectId);

      // プロジェクト一覧を保存
      await this.saveProjects();

      console.log('Project deleted successfully:', projectId);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * 全プロジェクト一覧を取得
   */
  listProjects() {
    if (!this.initialized) {
      throw new Error('ProjectManager is not initialized');
    }

    return Array.from(this.projects.values()).map(project => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isCurrent: this.currentProject && this.currentProject.id === project.id
    }));
  }

  /**
   * 現在のプロジェクトを取得
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * プロジェクト一覧を読み込み
   */
  async loadProjects() {
    try {
      const projectsData = await this.electronAPI.loadProjects();
      this.projects.clear();

      if (projectsData && projectsData.projects) {
        const { Project } = window.ProjectModels;
        for (const projectData of projectsData.projects) {
          const project = Project.fromJSON(projectData);
          this.projects.set(project.id, project);
        }
      }

      console.log('Projects loaded:', this.projects.size);
    } catch (error) {
      console.error('Failed to load projects:', error);
      // エラーが発生しても続行（空のプロジェクト一覧として扱う）
    }
  }

  /**
   * プロジェクト一覧を保存
   */
  async saveProjects() {
    try {
      const projectsData = {
        version: '1.0',
        projects: Array.from(this.projects.values()).map(p => p.toJSON()),
        lastModified: new Date().toISOString()
      };

      await this.electronAPI.saveProjects(projectsData);
      console.log('Projects saved successfully');
    } catch (error) {
      console.error('Failed to save projects:', error);
      throw error;
    }
  }

  /**
   * 現在のプロジェクトを読み込み
   */
  async loadCurrentProject() {
    try {
      const currentProjectData = await this.electronAPI.getCurrentProject();

      if (currentProjectData && currentProjectData.currentProjectId) {
        const projectId = currentProjectData.currentProjectId;
        if (this.projects.has(projectId)) {
          this.currentProject = this.projects.get(projectId);
          console.log('Current project loaded:', projectId);
        } else {
          console.warn('Current project not found in projects list:', projectId);
          // 現在のプロジェクト設定をクリア
          await this.electronAPI.setCurrentProject(null);
        }
      }
    } catch (error) {
      console.error('Failed to load current project:', error);
      // エラーが発生しても続行（現在のプロジェクトなしとして扱う）
    }
  }

  /**
   * 現在のプロジェクト状態を保存
   */
  async saveCurrentProjectState() {
    if (!this.currentProject) {
      return;
    }

    try {
      // プロジェクトのタイムスタンプを更新
      this.currentProject.updateTimestamp();

      // プロジェクト一覧を保存
      await this.saveProjects();

      console.log('Current project state saved');
    } catch (error) {
      console.error('Failed to save current project state:', error);
    }
  }

  /**
   * プロジェクト名を更新
   */
  async updateProjectName(projectId, newName) {
    if (!this.initialized) {
      throw new Error('ProjectManager is not initialized');
    }

    if (!projectId || !newName || newName.trim() === '') {
      throw new Error('プロジェクトIDと新しい名前は必須です');
    }

    if (!this.projects.has(projectId)) {
      throw new Error('指定されたプロジェクトが見つかりません');
    }

    // 同名プロジェクトの存在チェック（自分以外）
    for (const [id, project] of this.projects) {
      if (id !== projectId && project.name === newName.trim()) {
        throw new Error('同じ名前のプロジェクトが既に存在します');
      }
    }

    try {
      const project = this.projects.get(projectId);
      project.name = newName.trim();
      project.updateTimestamp();

      // プロジェクトメタデータを更新
      await this.electronAPI.updateProjectMetadata(projectId, project.toJSON());

      // プロジェクト一覧を保存
      await this.saveProjects();

      console.log('Project name updated successfully:', projectId);
      return project;
    } catch (error) {
      console.error('Failed to update project name:', error);
      throw error;
    }
  }

  /**
   * デフォルトプロジェクトを作成
   */
  async createDefaultProject() {
    try {
      const defaultProject = await this.createProject('デフォルト');
      await this.switchProject(defaultProject.id);
      return defaultProject;
    } catch (error) {
      console.error('Failed to create default project:', error);
      throw error;
    }
  }
}

// グローバル変数として定義（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.ProjectManager = ProjectManager;
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProjectManager;
}
