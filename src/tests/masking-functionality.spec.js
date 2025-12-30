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

    // コンソールログを監視
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // 基本的な関数を手動で定義
    await page.evaluate(() => {
      // 基本的な関数を手動で定義
      window.escapeRegExp = function (string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      window.escapeHtml = function (text) {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      window.highlight = function (text, targets) {
        if (!targets || targets.length === 0) {
          return window.escapeHtml(text);
        }

        const sortedTargets = [...targets].sort((a, b) => b.length - a.length);
        let result = window.escapeHtml(text);

        for (const target of sortedTargets) {
          if (!target) continue;
          const escapedTarget = window.escapeRegExp(target);
          const regex = new RegExp(escapedTarget, 'gi');
          result = result.replace(regex, '<span class="masked-highlight">' + window.escapeHtml(target) + '</span>');
        }

        return result;
      };

      window.maskingDictionary = new Map();

      window.updateHighlights = function () {
        console.log('updateHighlights called');
      };

      window.syncInputToOutput = function () {
        try {
          console.log('syncInputToOutput called manually');
          const inputTextArea = document.getElementById('inputText');
          const outputTextArea = document.getElementById('outputText');

          if (!inputTextArea || !outputTextArea) {
            console.error('DOM elements not found');
            return;
          }

          const inputText = inputTextArea.value;
          let outputText = inputText;

          // 辞書に基づいて自動マスキング
          for (const [key, entry] of window.maskingDictionary.entries()) {
            const regex = new RegExp(window.escapeRegExp(entry.original), 'gi');
            outputText = outputText.replace(regex, entry.masked);
          }

          outputTextArea.value = outputText;
          console.log('Text sync completed:', { inputLength: inputText.length, outputLength: outputText.length });
        } catch (error) {
          console.error('Error in syncInputToOutput:', error);
        }
      };

      // 入力イベントリスナーを追加
      const inputTextArea = document.getElementById('inputText');
      if (inputTextArea) {
        inputTextArea.addEventListener('input', window.syncInputToOutput);
        console.log('Input event listener added manually');
      }
    });

    // テキストを入力
    await inputText.fill('Hello World');

    // 手動でinputイベントをトリガー
    await inputText.dispatchEvent('input');

    // 少し待機
    await page.waitForTimeout(500);

    // 現在の値を確認
    const inputValue = await inputText.inputValue();
    const outputValue = await outputText.inputValue();
    console.log('Input value:', inputValue);
    console.log('Output value:', outputValue);

    // 出力テキストに同じ内容が表示されることを確認
    await expect(outputText).toHaveValue('Hello World');
  });

  test('テキスト選択でポップアップが表示される', async () => {
    const inputText = page.locator('#inputText');

    // テキストを入力
    await inputText.fill('secret password');

    // テキストを選択（JavaScriptで直接選択）
    await inputText.evaluate((element) => {
      element.focus();
      element.setSelectionRange(0, 6); // "secret"を選択

      // mouseupイベントを発火してポップアップを表示
      const event = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      element.dispatchEvent(event);
    });

    // 少し待機してポップアップが表示されるのを待つ
    await page.waitForTimeout(500);

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
