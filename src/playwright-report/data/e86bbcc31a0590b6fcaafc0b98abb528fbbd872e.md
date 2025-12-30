# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: "📁 プロジェクト:"
      - combobox "📁 プロジェクト:" [ref=e6]:
        - option "プロジェクトを選択..."
        - option "デフォルトプロジェクト" [selected]
      - button "➕" [active] [ref=e7] [cursor=pointer]
      - button "⚙️" [ref=e8] [cursor=pointer]
    - generic [ref=e9]: "現在のプロジェクト: デフォルトプロジェクト"
  - generic [ref=e10]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "📝 入力テキスト" [level=2] [ref=e14]
        - generic [ref=e15]:
          - generic: My password is secret123 and the admin account is confidential. Please keep this information private.
          - 'textbox "ここにテキストを入力してください... 例: My password is secret123 💡 テキストを選択するとマスク候補が表示されます" [ref=e16]':
            - /placeholder: "ここにテキストを入力してください...\n例: My password is secret123\n\n💡 テキストを選択するとマスク候補が表示されます"
            - text: My password is secret123 and the admin account is confidential. Please keep this information private.
          - button "入力テキストをコピー" [ref=e17] [cursor=pointer]
      - generic [ref=e21]:
        - heading "🔒 マスキング済みテキスト" [level=2] [ref=e22]
        - generic [ref=e23]:
          - generic: My password is secret123 and the admin account is confidential. Please keep this information private.
          - textbox "マスキング結果がここに表示されます..." [ref=e24]: My password is secret123 and the admin account is confidential. Please keep this information private.
          - button "マスキング済みテキストをコピー" [ref=e25] [cursor=pointer]
    - generic [ref=e26]:
      - heading "📚 マスキング辞書" [level=2] [ref=e27]
      - generic [ref=e29]: まだマスキングした単語がありません
```