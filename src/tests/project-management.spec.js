const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test.describe('プロジェクト環境管理機能', () => {
  let electronApp;
  let page;

  test.beforeAll(async () => {
    // Electronアプリケーションを起動
    electronApp = await electron.launch({
      args: ['.'],
      cwd: __dirname + '/..'
    });

    // メインウィンドウを取得
    page = await electronApp.firstWindow();

    // アプリケーションが読み込まれるまで待機
    await page.waitForSelector('#projectSelect');
    await page.waitForTimeout(2000); // プロジェクト初期化を待つ
  });

  test.afterAll(async () => {
    // Electronアプリケーションを終了
    await electronApp.close();
  });

  test('デフォルトプロジェクトが自動作成される', async () => {
    // プロジェクト選択ドロップダウンが存在することを確認
    const projectSelect = page.locator('#projectSelect');
    await expect(projectSelect).toBeVisible();

    // デフォルトプロジェクトが選択されていることを確認
    const selectedOption = await projectSelect.inputValue();
    expect(selectedOption).toBeTruthy();

    // プロジェクト状態が表示されていることを確認
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toContainText('現在のプロジェクト:');
    await expect(projectStatus).toHaveClass(/active/);
  });

  test('新しいプロジェクトを作成できる', async () => {
    // 新規プロジェクトボタンをクリック
    const newProjectBtn = page.locator('#newProjectBtn');
    await expect(newProjectBtn).toBeVisible();

    // プロンプトダイアログをハンドル
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toContain('新しいプロジェクト名を入力してください');
      await dialog.accept('テストプロジェクト');
    });

    await newProjectBtn.click();

    // 新しいプロジェクトが選択されていることを確認
    await page.waitForTimeout(1000);
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toContainText('テストプロジェクト');

    // プロジェクト選択ドロップダウンに新しいプロジェクトが追加されていることを確認
    const projectSelect = page.locator('#projectSelect');
    const options = await projectSelect.locator('option').allTextContents();
    expect(options.some(option => option.includes('テストプロジェクト'))).toBeTruthy();
  });

  test('UIコンポーネントが正しく表示される', async () => {
    // プロジェクトヘッダーが表示されていることを確認
    const projectHeader = page.locator('.project-header');
    await expect(projectHeader).toBeVisible();

    // プロジェクト選択要素が表示されていることを確認
    const projectSelector = page.locator('.project-selector');
    await expect(projectSelector).toBeVisible();

    // ラベルが正しく表示されていることを確認
    const label = page.locator('.project-selector label');
    await expect(label).toContainText('📁 プロジェクト:');

    // ボタンが表示されていることを確認
    const newProjectBtn = page.locator('#newProjectBtn');
    const manageProjectsBtn = page.locator('#manageProjectsBtn');
    await expect(newProjectBtn).toBeVisible();
    await expect(manageProjectsBtn).toBeVisible();

    // プロジェクト状態が表示されていることを確認
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toBeVisible();
  });
});
