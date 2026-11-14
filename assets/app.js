// 狼人殺角色圖鑑：讀取 data/ 下的 JSON 並產生畫面。
// 角色內容請改 data/roles/<id>.json，不要寫在這裡（見 AGENTS.md）。

const CAMP_NAMES = { wolf: "狼人陣營", god: "神職", villager: "平民", third: "第三方" };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`讀取 ${path} 失敗（${res.status}）`);
  return res.json();
}

async function loadAllRoles() {
  const { roles } = await loadJSON("data/roles.json");
  return Promise.all(roles.map((id) => loadJSON(`data/roles/${id}.json`)));
}

function showError(el, e) {
  el.innerHTML = `<p class="error">${esc(e.message)}。若是直接打開 HTML 檔，請改用本機伺服器（見 README）。</p>`;
}

/* ---------- 首頁 ---------- */
async function renderIndex() {
  const grid = document.getElementById("grid");
  const night = document.getElementById("night");
  const filters = document.getElementById("filters");
  let roles;
  try { roles = await loadAllRoles(); } catch (e) { return showError(grid, e); }

  document.getElementById("count").textContent = roles.length;

  const drawCards = (camp) => {
    grid.innerHTML = roles
      .filter((r) => camp === "all" || r.camp === camp)
      .map((r) => `
        <a class="card" href="role.html?id=${esc(r.id)}" data-camp="${esc(r.camp)}">
          <span class="glyph">${esc(r.glyph)}</span>
          <span>
            <span class="camp-tag">${CAMP_NAMES[r.camp]}</span>
            <h3>${esc(r.name)}</h3>
            <p>${esc(r.summary)}</p>
          </span>
        </a>`).join("");
  };

  const camps = ["all", ...Object.keys(CAMP_NAMES).filter((c) => roles.some((r) => r.camp === c))];
  filters.innerHTML = camps.map((c) => `
    <button class="filter" data-camp-filter="${c}" aria-pressed="${c === "all"}">
      ${c === "all" ? "全部" : CAMP_NAMES[c]}
    </button>`).join("");
  filters.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-camp-filter]");
    if (!btn) return;
    filters.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", b === btn));
    drawCards(btn.dataset.campFilter);
  });
  drawCards("all");

  night.innerHTML = roles
    .filter((r) => r.night_order !== null)
    .sort((a, b) => a.night_order - b.night_order)
    .map((r) => `
      <li data-camp="${esc(r.camp)}">
        <span class="step">${String(r.night_order).padStart(2, "0")}</span>
        <a href="role.html?id=${esc(r.id)}">${esc(r.name)}</a>
      </li>`).join("");
}

/* ---------- 角色詳細頁 ---------- */
async function renderRole() {
  const main = document.getElementById("role");
  const id = new URLSearchParams(location.search).get("id");
  let roles;
  try { roles = await loadAllRoles(); } catch (e) { return showError(main, e); }

  const byId = Object.fromEntries(roles.map((r) => [r.id, r]));
  const r = byId[id];
  if (!r) {
    main.innerHTML = `<p class="error">找不到角色「${esc(id ?? "")}」。</p>`;
    return;
  }
  document.title = `${r.name}｜狼人殺角色圖鑑`;

  const list = (items) => items.length
    ? `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
    : `<p class="empty">無</p>`;

  const interactions = r.interactions.length
    ? `<ul>${r.interactions.map((it) => {
        const o = byId[it.with];
        return `<li><a href="role.html?id=${esc(it.with)}" data-camp="${esc(o.camp)}">${esc(o.name)}</a>：${esc(it.text)}</li>`;
      }).join("")}</ul>`
    : `<p class="empty">無</p>`;

  main.dataset.camp = r.camp;
  main.innerHTML = `
    <div class="role-head">
      <span class="glyph">${esc(r.glyph)}</span>
      <div>
        <h1>${esc(r.name)}</h1>
        <p class="summary">${esc(r.summary)}</p>
      </div>
    </div>
    <div class="meta">
      <span class="pill camp">${CAMP_NAMES[r.camp]}</span>
      <span class="pill">${r.night_order === null ? "夜晚不行動" : `夜晚第 ${r.night_order} 順位行動`}</span>
    </div>
    <div class="blocks">
      <div class="block"><h2>能力</h2>${list(r.skills)}</div>
      <div class="block"><h2>限制與例外</h2>${list(r.limits)}</div>
      <div class="block interactions"><h2>角色互動</h2>${interactions}</div>
      <div class="block"><h2>常見打法</h2>${list(r.tips)}</div>
      ${r.variant ? `<div class="block note"><h2>變體規則</h2><p>${esc(r.variant)}</p></div>` : ""}
    </div>
    <p class="source">規則出處：<a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(r.source)}</a>　「常見打法」為玩家經驗，非官方規則。</p>`;
}

if (document.body.dataset.page === "index") renderIndex();
if (document.body.dataset.page === "role") renderRole();
