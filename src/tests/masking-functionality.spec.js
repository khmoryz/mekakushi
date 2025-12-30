const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test.describe('基本マスキング機能', () => {
  let electronApp;
  let page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['.'],
      cwd: __dirname + '/..'
    });

    page = await electronApp.firstWindow();
    await page.waitForSelector('#projectSelect');
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('テキスト入力と表示が正常に動作する', async () => {
    const inputText = page.locator('#inputText');
    const outputText = page.locator('#outputText');

    // テキストを入力
    await inputText.fill('Hello World');

    // 出力テキストに同じ内容が表示されることを確認
    await expect(outputText).toHaveValue('Hello World');
  });

  test('テキスト選択でポップアップが表示される', async () => {
    const inputText = page.locator('#inputText');

    // テキストを入力
    await inputText.fill('secret password');

    // テキストを選択
    await inputText.selectText();

    // ポップアップが表示されることを確認
    const candidatePopup = page.locator('#candidatePopup');
    await expect(candidatePopup).toHaveClass(/show/);

    // 候補グリッドが表示されることを確認
    const candidateGrid = page.locator('#candidateGrid');
    await expect(candidateGrid).toBeVisible();

    // 候補アイテムが表示されることを確認
    const candidateItems = page.locator('.candidate-item');
    await expect(candidateItems.first()).toBeVisible();
  });

  test('UIコンポーネントが正しく表示される', async () => {
    // メインコンテンツエリアが表示されていることを確認
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();

    // テキストパネルが表示されていることを確認
    const textPanels = page.locator('.text-panels');
    await expect(textPanels).toBeVisible();

    // 辞書パネルが表示されていることを確認
    const dictionaryPanel = page.locator('.dictionary-panel');
    await expect(dictionaryPanel).toBeVisible();

    // コピーボタンが表示されていることを確認
    const copyButtons = page.locator('.copy-button');
    await expect(copyButtons.first()).toBeVisible();
  });
});
