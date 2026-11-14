# 狼人殺角色圖鑑

用同一套格式整理狼人殺每個角色的能力、限制、角色互動與常見打法的靜態網站。

- 首頁：角色卡片牆（可依陣營篩選）＋ 夜晚行動順序（由角色資料自動排序產生）
- 角色頁：`role.html?id=<角色 id>`，所有角色共用同一個版型

## 專案特色：用 AGENTS.md 讓 AI 接手擴充

這個專案的重點不是做完一個網頁，而是建立一套「之後怎麼繼續做」的規則：

| 檔案 | 作用 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | 給 AI 的完整專案規則：目的、結構、JSON 欄位、命名、夜晚順序表、新增步驟、檢查清單 |
| [`CLAUDE.md`](./CLAUDE.md) | 指向 AGENTS.md（Claude Code 會自動讀取） |
| [`templates/role.template.json`](./templates/role.template.json) | 新角色的空白範本 |
| [`scripts/check.py`](./scripts/check.py) | 自動檢查資料是否符合規則（欄位、id、陣營、頭像字重複、互動雙向、排列順序） |

**內容與畫面分離**：角色內容只存在 `data/roles/<id>.json`，網頁由 `assets/app.js` 讀取 JSON 產生。新增角色不用改任何 HTML。

## 示範：依照規則新增「騎士」

對 AI 下的指令只有一句：

> 請依照 AGENTS.md 新增「騎士」角色。

AI 依 AGENTS.md 第 6 節執行：

1. 複製範本為 `data/roles/knight.json`，依第 4 節填寫欄位，查第 5 節確認騎士夜晚不行動（`night_order: null`）。
2. 在 `data/roles.json` 的神職區加入 `knight`。
3. 執行 `python scripts/check.py`，檢查腳本回報：
   ```
   發現 1 個問題：
    - [knight] 和 werewolf 的互動只寫了單向，請在 werewolf.json 也補上
   ```
4. 依規則在 `werewolf.json` 補上與騎士的互動，再檢查一次：`全部通過：12 個角色`。
5. 首頁自動出現騎士卡片，狼人頁面的「角色互動」也自動出現騎士的連結。

整個過程沒有修改任何 HTML／CSS／JS。

## 本機預覽

網頁用 `fetch` 讀取 JSON，需要透過本機伺服器開啟（直接雙擊 HTML 會讀不到資料）：

```bash
python -m http.server 8000
# 開啟 http://localhost:8000
```

## 部署

推上 GitHub 後：Settings → Pages → Branch 選 `main`、資料夾選 `/ (root)` → Save。

## 資料來源

規則整理自冒險安迪〈狼人殺－角色能力和基礎規則〉：https://andyventure.com/boardgame-langrensha/
「常見打法」為玩家經驗整理，非官方規則。

本專案的規則文件、網頁程式與角色資料初版由生成式 AI（Claude）協助產生，並經人工檢查。
