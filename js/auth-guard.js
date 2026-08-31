// Shared sidebar nav + auth gate + formatting/modal/period-control helpers for all protected pages.
// Requires supabaseClient.js loaded first.
const NAV_GROUPS = [
  { label: "매출현황", items: [
    { key: "dashboard", href: "dashboard.html", icon: "bi-bar-chart-line", label: "종합" },
    { key: "products", href: "products.html", icon: "bi-box-seam", label: "품목별 실적" },
    { key: "profit", href: "profit.html", icon: "bi-graph-up-arrow", label: "매출이익현황" },
  ]},
  { label: "영업", items: [
    { key: "deals", href: "deals.html", icon: "bi-kanban", label: "수주관리" },
    { key: "schedule", href: "schedule.html", icon: "bi-calendar-week", label: "일정·활동" },
  ]},
  { label: "거래처·재고", items: [
    { key: "customers", href: "customers.html", icon: "bi-building", label: "거래처" },
    { key: "inventory", href: "inventory.html", icon: "bi-archive", label: "재고" },
    { key: "sales", href: "sales.html", icon: "bi-receipt", label: "판매일보" },
  ]},
  { label: "관리", items: [
    { key: "upload", href: "upload.html", icon: "bi-cloud-upload", label: "데이터 업로드" },
  ]},
];

function renderNav(activeKey, email) {
  const sb_ = document.createElement("div");
  sb_.id = "sidebar";
  sb_.innerHTML = `
    <div class="brand"><div class="ico"><i class="bi bi-bar-chart-line"></i></div><div><div class="brand-name">영업관리 CRM</div><div class="brand-sub">사료원료 영업</div></div></div>
    <div style="padding:8px 10px 0">
      <button id="gsearch-btn" style="width:100%;justify-content:flex-start;gap:8px;color:#94a3b8;font-weight:500"><i class="bi bi-search"></i><span style="flex:1;text-align:left">거래처·품목 검색</span><kbd style="font-size:10px;background:#f1f5f9;border-radius:4px;padding:1px 5px">Ctrl K</kbd></button>
    </div>
    <div class="nav-section">
      ${NAV_GROUPS.map(g => `
        <div class="nav-label">${g.label}</div>
        ${g.items.map(i => `<a href="${i.href}" class="nav-link${i.key === activeKey ? " active" : ""}"><i class="bi ${i.icon}"></i>${i.label}</a>`).join("")}
      `).join("")}
    </div>
    <div class="sidebar-footer">
      <div class="su-box">
        <div class="su-top"><div class="su-av">${(email || "?").slice(0, 1).toUpperCase()}</div><div class="su-email">${email || ""}</div></div>
        <button id="logout-btn"><i class="bi bi-box-arrow-right"></i> 로그아웃</button>
      </div>
    </div>
  `;
  document.body.prepend(sb_);
  initGlobalSearch();

  const toggle = document.createElement("button");
  toggle.id = "mnav-toggle";
  toggle.innerHTML = '<i class="bi bi-list" style="font-size:18px"></i>';
  toggle.addEventListener("click", () => sb_.classList.toggle("open"));
  document.body.prepend(toggle);

  const main = document.createElement("div");
  main.id = "app-main";
  Array.from(document.body.childNodes)
    .filter((n) => n !== sb_ && n !== toggle)
    .forEach((n) => main.appendChild(n));
  document.body.appendChild(main);

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await sb.auth.signOut();
    location.href = "login.html";
  });
}

// Call on every protected page. Redirects to login.html if no session, else renders nav and returns the session.
async function requireAuth(activeKey) {
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  renderNav(activeKey, session.user.email);
  return session;
}

/* ───────────────── 통합검색 (Ctrl+K) ───────────────── */
let GS_DATA = null;
function initGlobalSearch() {
  const btn = document.getElementById("gsearch-btn");
  if (btn) btn.addEventListener("click", openGlobalSearch);
  if (!window.__gsKeyBound) {
    window.__gsKeyBound = true;
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openGlobalSearch(); }
      else if (e.key === "Escape") closeGlobalSearch();
    });
  }
}
function ensureGsRoot() {
  if (document.getElementById("gs-overlay")) return;
  const ov = document.createElement("div");
  ov.id = "gs-overlay";
  ov.className = "gs-overlay";
  ov.innerHTML = `
    <div class="gs-box">
      <div class="gs-input-wrap"><i class="bi bi-search"></i><input id="gs-input" placeholder="거래처명 또는 품목명 입력..." autocomplete="off" /><kbd>ESC</kbd></div>
      <div class="gs-results" id="gs-results"></div>
    </div>`;
  ov.addEventListener("click", (e) => { if (e.target === ov) closeGlobalSearch(); });
  document.body.appendChild(ov);
  document.getElementById("gs-input").addEventListener("input", (e) => renderGsResults(e.target.value));
}
async function openGlobalSearch() {
  ensureGsRoot();
  if (!GS_DATA) {
    const [{ data: customers }, { data: products }] = await Promise.all([
      sb.from("customers").select("code,name"),
      sb.from("products").select("code,name,spec"),
    ]);
    GS_DATA = { customers: customers || [], products: products || [] };
  }
  document.getElementById("gs-overlay").classList.add("on");
  const input = document.getElementById("gs-input");
  input.value = "";
  renderGsResults("");
  setTimeout(() => input.focus(), 30);
}
function closeGlobalSearch() {
  const ov = document.getElementById("gs-overlay");
  if (ov) ov.classList.remove("on");
}
function renderGsResults(q) {
  const el = document.getElementById("gs-results");
  const kw = q.trim().toLowerCase();
  if (!kw) { el.innerHTML = '<div class="gs-empty">거래처명 또는 품목명을 입력하세요</div>'; return; }
  const custMatches = GS_DATA.customers.filter((c) => (c.name || "").toLowerCase().includes(kw)).slice(0, 6);
  const prodMatches = GS_DATA.products.filter((p) => (p.name || "").toLowerCase().includes(kw)).slice(0, 6);
  if (!custMatches.length && !prodMatches.length) { el.innerHTML = '<div class="gs-empty">검색 결과가 없습니다</div>'; return; }
  let html = "";
  if (custMatches.length) html += `<div class="gs-group">거래처</div>` + custMatches.map((c) => `<a class="gs-item" href="customers.html?code=${encodeURIComponent(c.code)}"><i class="bi bi-building"></i><span>${esc(c.name)}</span></a>`).join("");
  if (prodMatches.length) html += `<div class="gs-group">품목</div>` + prodMatches.map((p) => `<a class="gs-item" href="products.html?code=${encodeURIComponent(p.code)}"><i class="bi bi-box-seam"></i><span>${esc(p.name)} <span class="mut">${esc(p.spec || "")}</span></span></a>`).join("");
  el.innerHTML = html;
}

function esc(s) {
  return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "-";
  return Math.round(Number(n)).toLocaleString("ko-KR");
}

function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "-";
  return Number(n).toFixed(2) + "%";
}

// 억/만원 단위 축약 표기 (KPI 히어로용) — 원텍 사내 사이트들과 동일한 표기 관례
function fmtWon(n) {
  n = Number(n || 0);
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toFixed(1) + "억";
  if (abs >= 1e4) return Math.round(n / 1e4).toLocaleString("ko-KR") + "만원";
  return Math.round(n).toLocaleString("ko-KR") + "원";
}

function yoyBadge(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "";
  const cls = pct >= 0 ? "up" : "down";
  const arrow = pct >= 0 ? "▲" : "▼";
  return `<span class="sb-badge ${cls}">${arrow}${Math.abs(pct).toFixed(1)}%</span>`;
}

/* ───────────────── 모달 ───────────────── */
function ensureModalRoot() {
  if (document.getElementById("modal-bg")) return;
  const bg = document.createElement("div");
  bg.id = "modal-bg";
  bg.className = "modal-bg";
  bg.innerHTML = '<div class="mbox" id="mbox"></div>';
  bg.addEventListener("click", (e) => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function openModal(title, bodyHtml, wide) {
  ensureModalRoot();
  document.getElementById("mbox").className = "mbox" + (wide ? " wide" : "");
  document.getElementById("mbox").innerHTML = `
    <div class="mhd"><h3>${title}</h3><button class="x" onclick="closeModal()">&times;</button></div>
    <div class="mbody">${bodyHtml}</div>`;
  document.getElementById("modal-bg").classList.add("on");
}
function closeModal() {
  const bg = document.getElementById("modal-bg");
  if (bg) bg.classList.remove("on");
}

/* ───────────────── 조회기간 컨트롤 ─────────────────
   연/월 범위 셀렉터 + 프리셋 칩(올해/작년/최근 12개월/전체기간).
   createPeriodCtrl(container, {minYear, maxYear, maxMonth, onChange}) */
function createPeriodCtrl(container, opts) {
  const minYear = opts.minYear, maxYear = opts.maxYear, maxMonth = opts.maxMonth;
  const years = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const yearOpt = years.map((y) => `<option value="${y}">${y}년</option>`).join("");
  const monthOpt = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}월</option>`).join("");

  let state = { sy: maxYear, sm: 1, ey: maxYear, em: maxMonth };

  container.innerHTML = `
    <span class="pl"><i class="bi bi-calendar3"></i> 조회 기간</span>
    <span class="period-range">
      <select id="pc-sy">${yearOpt}</select>
      <select id="pc-sm">${monthOpt}</select>
      <span class="mut">~</span>
      <select id="pc-ey">${yearOpt}</select>
      <select id="pc-em">${monthOpt}</select>
    </span>
    <span id="pc-chips" style="display:inline-flex;gap:5px;flex-wrap:wrap"></span>
    <span class="period-asof" id="pc-asof"></span>
  `;

  const presets = [
    ["올해", () => [maxYear, 1, maxYear, maxMonth]],
    [(maxYear - 1) + "년", () => [maxYear - 1, 1, maxYear - 1, 12]],
    ["최근 12개월", () => { let sy = maxYear, sm = maxMonth - 11; while (sm < 1) { sm += 12; sy--; } return [sy, sm, maxYear, maxMonth]; }],
    ["전체기간", () => [minYear, 1, maxYear, maxMonth]],
  ];
  const chipsEl = container.querySelector("#pc-chips");
  chipsEl.innerHTML = presets.map((p, i) => `<button type="button" class="pp-chip" data-i="${i}">${p[0]}</button>`).join("");

  function setSelects() {
    container.querySelector("#pc-sy").value = state.sy;
    container.querySelector("#pc-sm").value = state.sm;
    container.querySelector("#pc-ey").value = state.ey;
    container.querySelector("#pc-em").value = state.em;
  }
  function markChip(i) {
    chipsEl.querySelectorAll(".pp-chip").forEach((b, bi) => b.classList.toggle("on", bi === i));
  }
  function fire() {
    opts.onChange({ ...state, label: `${state.sy}.${String(state.sm).padStart(2, "0")} ~ ${state.ey}.${String(state.em).padStart(2, "0")}` });
  }
  chipsEl.querySelectorAll(".pp-chip").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const [sy, sm, ey, em] = presets[i][1]();
      state = { sy, sm, ey, em };
      setSelects();
      markChip(i);
      fire();
    });
  });
  ["pc-sy", "pc-sm", "pc-ey", "pc-em"].forEach((id) => {
    container.querySelector("#" + id).addEventListener("change", () => {
      state = {
        sy: Number(container.querySelector("#pc-sy").value),
        sm: Number(container.querySelector("#pc-sm").value),
        ey: Number(container.querySelector("#pc-ey").value),
        em: Number(container.querySelector("#pc-em").value),
      };
      markChip(-1);
      fire();
    });
  });

  // 기본값: 올해
  const [sy, sm, ey, em] = presets[0][1]();
  state = { sy, sm, ey, em };
  setSelects();
  markChip(0);

  return {
    get: () => ({ ...state }),
    setAsof: (text) => { container.querySelector("#pc-asof").textContent = text; },
    fire,
  };
}

// Supabase PostgREST caps a single response at 1000 rows by default.
// queryFn(from, to) must return a fresh query with .range(from, to) applied last.
async function fetchAllRows(queryFn, pageSize) {
  pageSize = pageSize || 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryFn(from, from + pageSize - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/* ───────────────── 자동완성 ───────────────── */
// input에 <datalist> 붙이기(순수 문자열 후보). 같은 input에 다시 호출하면 후보만 갱신.
function attachDatalist(inputEl, options) {
  const listId = inputEl.id + "-dl";
  let dl = document.getElementById(listId);
  if (!dl) {
    dl = document.createElement("datalist");
    dl.id = listId;
    document.body.appendChild(dl);
    inputEl.setAttribute("list", listId);
    inputEl.setAttribute("autocomplete", "off");
  }
  dl.innerHTML = options.map((o) => `<option value="${esc(o)}"></option>`).join("");
}

// 거래처명 입력 자동완성 + 선택 시 코드 매칭. customers: [{code,name}]
function setupCustomerPicker(inputEl, customers, onSelect) {
  attachDatalist(inputEl, customers.map((c) => c.name));
  inputEl.addEventListener("input", () => {
    const match = customers.find((c) => c.name === inputEl.value.trim());
    if (match) onSelect(match);
  });
}

async function fetchCustomerList() {
  const { data } = await sb.from("customers").select("code,name").order("name");
  return data || [];
}

async function fetchProductList() {
  const { data } = await sb.from("products").select("code,name,spec").order("name");
  return data || [];
}

function periodToDates(p) {
  const from = `${p.sy}-${String(p.sm).padStart(2, "0")}-01`;
  const endDate = new Date(p.ey, p.em, 0); // last day of end month
  const to = `${p.ey}-${String(p.em).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { from, to };
}
