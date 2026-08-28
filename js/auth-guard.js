// Shared nav + auth gate for all protected pages. Requires supabaseClient.js loaded first.
const NAV_ITEMS = [
  { key: "dashboard", href: "dashboard.html", label: "대시보드" },
  { key: "customers", href: "customers.html", label: "거래처" },
  { key: "inventory", href: "inventory.html", label: "재고" },
  { key: "sales", href: "sales.html", label: "판매일보" },
  { key: "profit", href: "profit.html", label: "매출이익" },
  { key: "upload", href: "upload.html", label: "데이터 업로드" },
];

function renderNav(activeKey, email) {
  const nav = document.createElement("div");
  nav.id = "app-nav";
  nav.innerHTML = `
    <div class="nav-left">
      <span class="brand">영업관리 CRM</span>
      <div class="nav-links">
        ${NAV_ITEMS.map(
          (i) => `<a href="${i.href}" class="${i.key === activeKey ? "active" : ""}">${i.label}</a>`
        ).join("")}
      </div>
    </div>
    <div class="nav-right">
      <span>${email || ""}</span>
      <button id="logout-btn">로그아웃</button>
    </div>
  `;
  document.body.prepend(nav);
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

function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return Number(n).toLocaleString("ko-KR");
}

function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return Number(n).toFixed(2) + "%";
}
