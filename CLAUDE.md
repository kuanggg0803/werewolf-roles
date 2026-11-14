# CLAUDE.md

本專案的完整規則寫在 [AGENTS.md](./AGENTS.md)，請先閱讀並遵守。

重點摘要：
- 角色內容只寫在 `data/roles/<id>.json`，網頁版型所有角色共用。
- 新增角色：複製 `templates/role.template.json` → 填寫 → 加入 `data/roles.json` → 執行 `python scripts/check.py`。
- 規則只寫有依據的事實；打法放 `tips`，爭議放 `variant`。
