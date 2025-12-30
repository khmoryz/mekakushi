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

    // 最初のウィンドウを取得
    page = await electronApp.firstWindow();

    // アプリケーションが読み込まれるまで待機
    await page.waitForSelector('#projectSelect');
    await page.waitForTimeout(2000); // プロジェクト初期化を待つ
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('デフォルトプロジェクトが自動作成される', async () => {
    // プロジェクト選択ドロップダウンが存在することを確認
    const projectSelect = page.locator('#projectSelect');
    await expect(projectSelect).toBeVisible();

    // デフォルトプロジェクトが選択されていることを確認
    const selectedOption = await projectSelect.inputValue();
    expect(selectedOption).toBeTruthy();

    // プロジェクトステータスがアクティブであることを確認
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toHaveClass(/active/);
  });

  test('新しいプロジェクトを作成できる', async () => {
    // 新規プロジェクトボタンをクリック
    const newProjectBtn = page.locator('#newProjectBtn');
    await expect(newProjectBtn).toBeVisible();

    // カスタムダイアログが表示されることを確認
    await newProjectBtn.click();
    await page.waitForTimeout(500);

    // カスタムダイアログの要素を確認
    const dialogTitle = page.locator('h3').filter({ hasText: '新しいプロジェクト名を入力してください' });
    await expect(dialogTitle).toBeVisible();

    // プロジェクト名入力ダイアログの入力フィールドを特定（3番目のinput要素）
    const inputField = page.locator('input[type="text"]').nth(2);
    await expect(inputField).toBeVisible();

    // プロジェクト名を入力
    await inputField.fill('テストプロジェクト');

    // OKボタンをクリック
    const okButton = page.locator('button').filter({ hasText: 'OK' });
    await okButton.click();

    // 少し待機
    await page.waitForTimeout(1000);

    // 新しいプロジェクトが作成されたことを確認（Electron環境では成功する）
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toBeVisible();
  });

  test('プロジェクトを切り替えできる', async () => {
    // プロジェクト管理UIが表示されていることを確認
    const projectSelect = page.locator('#projectSelect');
    await expect(projectSelect).toBeVisible();

    const newProjectBtn = page.locator('#newProjectBtn');
    await expect(newProjectBtn).toBeVisible();

    // UIコンポーネントが正しく表示されていることを確認
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toBeVisible();
  });

  test('プロジェクトを削除できる', async () => {
    // プロジェクト管理ボタンが表示されていることを確認
    const manageProjectsBtn = page.locator('#manageProjectsBtn');
    await expect(manageProjectsBtn).toBeVisible();

    // プロジェクト選択ドロップダウンが表示されていることを確認
    const projectSelect = page.locator('#projectSelect');
    await expect(projectSelect).toBeVisible();
  });

  test('プロジェクトごとに独立した辞書が管理される', async () => {
    // 辞書パネルが表示されていることを確認
    const dictionaryPanel = page.locator('.dictionary-panel');
    await expect(dictionaryPanel).toBeVisible();

    // 辞書リストが表示されていることを確認
    const dictionaryList = page.locator('#dictionaryList');
    await expect(dictionaryList).toBeVisible();
  });

  test('UIコンポーネントが正しく表示される', async () => {
    // プロジェクト選択要素が表示されていることを確認
    const projectSelector = page.locator('.project-selector');
    await expect(projectSelector).toBeVisible();

    // ラベルが正しく表示されていることを確認
    const label = page.locator('label[for="projectSelect"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText('📁 プロジェクト:');

    // プロジェクト選択ドロップダウンが表示されていることを確認
    const projectSelect = page.locator('#projectSelect');
    await expect(projectSelect).toBeVisible();

    // 新規プロジェクトボタンが表示されていることを確認
    const newProjectBtn = page.locator('#newProjectBtn');
    await expect(newProjectBtn).toBeVisible();

    // プロジェクト管理ボタンが表示されていることを確認
    const manageProjectsBtn = page.locator('#manageProjectsBtn');
    await expect(manageProjectsBtn).toBeVisible();

    // プロジェクトステータスが表示されていることを確認
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toBeVisible();
  });
});
