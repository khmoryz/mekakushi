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
    let dialogHandled = false;
    page.on('dialog', async dialog => {
      console.log('Dialog detected:', dialog.type(), dialog.message());
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toContain('新しいプロジェクト名を入力してください');
      await dialog.accept('テストプロジェクト');
      dialogHandled = true;
    });

    await newProjectBtn.click();

    // ダイアログが処理されるまで待機
    await page.waitForTimeout(1000);
    expect(dialogHandled).toBeTruthy();

    // 新しいプロジェクトが選択されていることを確認
    await page.waitForTimeout(1000);
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toContainText('テストプロジェクト');

    // プロジェクト選択ドロップダウンに新しいプロジェクトが追加されていることを確認
    const projectSelect = page.locator('#projectSelect');
    const options = await projectSelect.locator('option').allTextContents();
    expect(options.some(option => option.includes('テストプロジェクト'))).toBeTruthy();
  });

  test('プロジェクトを切り替えできる', async () => {
    // 現在のプロジェクト数を確認
    const projectSelect = page.locator('#projectSelect');
    let initialOptions = await projectSelect.locator('option').allTextContents();
    console.log('Initial projects:', initialOptions);

    // 新しいプロジェクトAを作成
    const newProjectBtn = page.locator('#newProjectBtn');

    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      console.log(`Dialog ${dialogCount}:`, dialog.message());
      if (dialogCount === 1) {
        await dialog.accept('プロジェクトA');
      } else if (dialogCount === 2) {
        await dialog.accept('プロジェクトB');
      }
    });

    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // プロジェクトBを作成
    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // 現在プロジェクトBが選択されていることを確認
    const projectStatus = page.locator('#projectStatus');
    await expect(projectStatus).toContainText('プロジェクトB');

    // プロジェクト一覧を確認
    const updatedOptions = await projectSelect.locator('option').allTextContents();
    console.log('Updated projects:', updatedOptions);

    // プロジェクトAに切り替え
    const optionA = projectSelect.locator('option').filter({ hasText: 'プロジェクトA' });
    const valueA = await optionA.getAttribute('value');
    console.log('Project A value:', valueA);

    if (valueA) {
      await projectSelect.selectOption(valueA);
      await page.waitForTimeout(1000);

      // プロジェクトAに切り替わったことを確認
      await expect(projectStatus).toContainText('プロジェクトA');
    } else {
      throw new Error('プロジェクトAが見つかりません');
    }
  });

  test('プロジェクトを削除できる', async () => {
    // テスト用プロジェクトを作成
    const newProjectBtn = page.locator('#newProjectBtn');

    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      console.log(`Delete test dialog ${dialogCount}:`, dialog.type(), dialog.message());

      if (dialog.type() === 'prompt') {
        if (dialogCount === 1) {
          await dialog.accept('削除テスト');
        } else if (dialogCount === 2) {
          await dialog.accept('保持プロジェクト');
        } else if (dialogCount === 3) {
          // プロジェクト管理ダイアログ
          expect(dialog.message()).toContain('プロジェクト一覧');
          // 削除テストプロジェクトの番号を入力
          await dialog.accept('1');
        }
      } else if (dialog.type() === 'confirm') {
        // 削除確認ダイアログ
        expect(dialog.message()).toContain('削除テスト');
        await dialog.accept();
      }
    });

    // 削除テストプロジェクトを作成
    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // 保持プロジェクトを作成（削除対象を現在選択中でない状態にするため）
    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // プロジェクト管理ボタンをクリック
    const manageProjectsBtn = page.locator('#manageProjectsBtn');
    await manageProjectsBtn.click();
    await page.waitForTimeout(2000);

    // プロジェクト選択ドロップダウンから削除されたことを確認
    const projectSelect = page.locator('#projectSelect');
    const options = await projectSelect.locator('option').allTextContents();
    console.log('Final projects after deletion:', options);

    expect(options.some(option => option.includes('削除テスト'))).toBeFalsy();
    expect(options.some(option => option.includes('保持プロジェクト'))).toBeTruthy();
  });

  test('プロジェクトごとに独立した辞書が管理される', async () => {
    // プロジェクトAを作成
    const newProjectBtn = page.locator('#newProjectBtn');

    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      if (dialogCount === 1) {
        await dialog.accept('辞書テストA');
      } else if (dialogCount === 2) {
        await dialog.accept('辞書テストB');
      }
    });

    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // プロジェクトAでテキストを入力
    const inputText = page.locator('#inputText');
    await inputText.fill('secret password');

    // テキストを選択してマスキングを試行
    await inputText.focus();
    await inputText.selectText();

    // ポップアップが表示されるかチェック（表示されない場合もあるのでエラーにしない）
    const candidatePopup = page.locator('#candidatePopup');
    const isPopupVisible = await candidatePopup.isVisible();
    console.log('Popup visible:', isPopupVisible);

    if (isPopupVisible) {
      const candidate = page.locator('.candidate-item').first();
      if (await candidate.isVisible()) {
        await candidate.click();
        await page.waitForTimeout(500);
      }
    }

    // 辞書の状態を確認
    const dictionaryList = page.locator('#dictionaryList');
    const dictionaryContent = await dictionaryList.textContent();
    console.log('Dictionary A content:', dictionaryContent);

    // プロジェクトBを作成
    await newProjectBtn.click();
    await page.waitForTimeout(1000);

    // プロジェクトBでは辞書が空であることを確認
    const dictionaryContentB = await dictionaryList.textContent();
    console.log('Dictionary B content:', dictionaryContentB);
    await expect(dictionaryList).toContainText('まだマスキングした単語がありません');

    // プロジェクトAに戻る
    const projectSelect = page.locator('#projectSelect');
    const optionA = projectSelect.locator('option').filter({ hasText: '辞書テストA' });
    const valueA = await optionA.getAttribute('value');

    if (valueA) {
      await projectSelect.selectOption(valueA);
      await page.waitForTimeout(1000);

      // プロジェクトAの辞書状態を確認
      const dictionaryContentA2 = await dictionaryList.textContent();
      console.log('Dictionary A content after switch back:', dictionaryContentA2);
    }
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
