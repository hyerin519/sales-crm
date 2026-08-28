# sales-crm

사료첨가제(아미노산 등) 유통업 영업관리 CRM. 순수 정적 HTML/CSS/JS + Supabase(Auth + Postgres), 빌드 스텝 없음. GitHub Pages로 배포.

## 코드 vs 데이터
데이터는 코드가 아니라 Supabase(`customers`, `products`, `sales`, `profit_daily`, `inventory_snapshots`)에 있다. 이 저장소를 고쳐도 데이터는 지워지지 않는다.

- **사이트 코드/UI/로직 변경** → 이 저장소의 html/js/css 파일을 직접 수정하고 `git push`. 브라우저 자동화 불필요.
- **실 데이터 변경**(거래처 정보 수정, 판매/재고/매출이익 데이터) → Supabase Auth로 로그인한 상태에서 사이트 자체(`customers.html`, `upload.html`)를 통해서만 가능. RLS가 인증된 세션을 요구하므로 anon key만으로는 쓰기 불가.

## 구조
- `login.html`, `index.html` — 인증 진입점 (회원가입 폼 없음, 계정은 Supabase 대시보드에서 추가)
- `dashboard.html`, `customers.html`, `inventory.html`, `sales.html`, `profit.html`, `upload.html` — 기능 페이지 (모두 `js/auth-guard.js`의 `requireAuth()`로 보호됨)
- `js/supabaseClient.js` — Supabase URL + anon(publishable) key (공개 키, RLS로 보호되므로 커밋해도 안전)
- `js/auth-guard.js` — 공용 네비게이션 렌더링 + 세션 체크 + 포맷 헬퍼(`fmtNum`, `fmtPct`)

## 업로드 자연키 (재업로드 시 upsert 기준)
- `sales`: `(doc_no, product_code)`
- `profit_daily`: `(profit_date, product_code)`
- `inventory_snapshots`: 자연키 없음 — 업로드 시 같은 `snapshot_date`의 기존 행을 삭제 후 재삽입(스냅샷 교체 방식)

## 계정 추가
공개 회원가입이 없으므로 새 팀원은 Supabase 대시보드 → Authentication → Users에서 직접 추가해야 함.
