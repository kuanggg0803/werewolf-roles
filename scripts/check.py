"""檢查角色資料是否符合 AGENTS.md 的規則。

用法：python scripts/check.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROLES_DIR = ROOT / "data" / "roles"
CAMPS = ["wolf", "god", "villager", "third"]
REQUIRED = {
    "id": str, "name": str, "camp": str, "glyph": str, "summary": str,
    "skills": list, "limits": list, "interactions": list, "tips": list, "source": str,
}

errors = []


def err(where, msg):
    errors.append(f"[{where}] {msg}")


index = json.loads((ROOT / "data" / "roles.json").read_text(encoding="utf-8"))
order = index.get("roles", [])
files = {p.stem for p in ROLES_DIR.glob("*.json")}

# 清單與檔案一致
for rid in order:
    if rid not in files:
        err("roles.json", f"列出了 {rid}，但找不到 data/roles/{rid}.json")
for rid in sorted(files - set(order)):
    err("roles.json", f"data/roles/{rid}.json 存在，但沒有加入 roles.json")
if len(order) != len(set(order)):
    err("roles.json", "有重複的角色 id")

roles = {}
for rid in order:
    if rid in files:
        roles[rid] = json.loads((ROLES_DIR / f"{rid}.json").read_text(encoding="utf-8"))

glyphs = {}
for rid, r in roles.items():
    for key, typ in REQUIRED.items():
        if key not in r:
            err(rid, f"缺少欄位 {key}")
        elif not isinstance(r[key], typ):
            err(rid, f"{key} 應該是 {typ.__name__}")
    if "night_order" not in r:
        err(rid, "缺少欄位 night_order（夜晚不行動請填 null）")
    elif r["night_order"] is not None and not isinstance(r["night_order"], int):
        err(rid, "night_order 應該是整數或 null")

    if r.get("id") != rid:
        err(rid, f"id「{r.get('id')}」和檔名不一致")
    if not re.fullmatch(r"[a-z]+(-[a-z]+)*", rid):
        err(rid, "id 只能用英文小寫，單字用 - 連接")
    if r.get("camp") not in CAMPS:
        err(rid, f"camp 必須是 {CAMPS} 之一")
    if len(r.get("glyph", "")) != 1:
        err(rid, "glyph 必須剛好一個字")
    elif r["glyph"] in glyphs:
        err(rid, f"glyph「{r['glyph']}」和 {glyphs[r['glyph']]} 重複")
    else:
        glyphs[r["glyph"]] = rid
    if len(r.get("summary", "")) > 30:
        err(rid, "summary 超過 30 字")
    if not r.get("skills"):
        err(rid, "skills 至少要有 1 項")
    if not 2 <= len(r.get("tips", [])) <= 4:
        err(rid, "tips 應該有 2～4 項")
    for field in ("skills", "limits", "tips"):
        for item in r.get(field, []):
            if len(item) > 40:
                err(rid, f"{field} 有一項超過 40 字：{item[:15]}…")

# 互動：對象存在且雙向
for rid, r in roles.items():
    for it in r.get("interactions", []):
        other = it.get("with")
        if other not in roles:
            err(rid, f"interactions 引用了不存在的角色 {other}")
        elif not any(x.get("with") == rid for x in roles[other].get("interactions", [])):
            err(rid, f"和 {other} 的互動只寫了單向，請在 {other}.json 也補上")

# 陣營順序
camp_rank = [CAMPS.index(roles[rid]["camp"]) for rid in order if rid in roles and roles[rid].get("camp") in CAMPS]
if camp_rank != sorted(camp_rank):
    err("roles.json", "角色順序應該依陣營排列：wolf → god → villager → third")

if errors:
    print(f"發現 {len(errors)} 個問題：")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print(f"全部通過：{len(roles)} 個角色")
