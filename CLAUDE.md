# sales-crm

사료첨가제(아미노산 등) 유통업 영업관리 CRM. 순수 정적 HTML/CSS/JS + Supabase(Auth + Postgres), 빌드 스텝 없음. GitHub Pages로 배포.

## 코드 vs 데이터
데이터는 코드가 아니라 Supabase(`customers`, `products`, `sales`, `profit_daily`, `inventory_snapshots`)에 있다. 이 저장소를 고쳐도 데이터는 지워지지 않는다.

- **사이트 코드/UI/로직 변경** → 이 저장소의 html/js/css 파일을 직접 수정하고 `git push`. 브라우저 자동화 불필요.
- **실 데이터 변경**(거래처 정보 수정, 판매/재고/매출이익 데이터) → Supabase Auth로 로그인한 상태에서 사이트 자체(`customers.html`, `upload.html`)를 통해서만 가능. RLS가 인증된 세션을 요구하므로 anon key만으로는 쓰기 불가.

## 구조
- `login.html`, `index.html` — 인증 진입점 (회원가입 폼 없음, 계정은 Supabase 대시보드에서 추가)
- `dashboard.html`, `customers.html`, `products.html`, `inventory.html`, `sales.html`, `profit.html`, `upload.html` — 기능 페이지 (모두 `js/auth-guard.js`의 `requireAuth()`로 보호됨)
- `js/supabaseClient.js` — Supabase URL + anon(publishable) key (공개 키, RLS로 보호되므로 커밋해도 안전)
- `js/auth-guard.js` — 공용 사이드바 네비게이션, 모달(`openModal`/`closeModal`), 조회기간 컨트롤(`createPeriodCtrl`/`periodToDates`), 포맷 헬퍼(`fmtNum`/`fmtPct`/`fmtWon`/`yoyBadge`/`esc`), 1000행 캡 우회용 `fetchAllRows()`

## 디자인/UX 패턴 (원텍 사내 사이트 wt-kor-sales·wontech 참고해서 이식)
- 좌측 사이드바 네비 + Noto Sans KR + Bootstrap Icons, navy(`--navy`)/blue(`--blue`)/yellow 포인트 컬러 — `wt-kor-sales`, `wontech`(원텍 한국영업 메인 사이트, `wt-management/wontech` 레포) 디자인 토큰과 동일 계열
- `createPeriodCtrl()` — 연/월 범위 셀렉터 + 프리셋 칩(올해/작년/최근 12개월/전체기간), dashboard/products/sales/profit 4개 페이지에서 공용 사용. wontech의 `_periodCtrl`/`_injectPeriodCtrl` 패턴을 이식
- 4칸 KPI 밴드(`.sb-grid`, 대시보드) — wontech의 당월/전월/누계 요약 카드(`ovsb-grid`) 패턴. 우리 데이터엔 회계반영/미반영 구분이 없어 매출액/매출총이익/이익률/거래거래처수로 대체
- 클릭 시 상세 모달 — KPI 셀, 월별 차트 막대, 랭킹 리스트, 거래처/품목/판매일보 행 전부 클릭하면 `openModal()`로 드릴다운. 거래처↔품목↔판매일보 서로 `?code=` 쿼리 파라미터로 링크되어 넘나들 수 있음(각 페이지 로드시 확인)
- 대시보드의 "이탈 위험 거래처 / 재고 소진 임박 / 마진 악화 품목" 액션 카드는 wontech에는 없는, 이 데이터셋 전용으로 추가한 분석(45일+ 무거래, 최근 30일 출고속도 대비 재고 14일 미만, 전월 대비 이익률 하락)

## 데이터 한계
`profit_daily`(매출이익현황)에는 거래처 정보가 없다 — 일자·품목 단위로만 집계돼 있어 거래처별 매출총이익/이익률은 계산할 수 없음. 거래처 랭킹·상세는 `sales.supply_amount`(공급가액, 부가세 제외) 합계를 매출 지표로 사용한다. 새 파일 구조가 바뀌지 않는 한 거래처별 마진은 만들어낼 수 없다는 점을 유지보수 시 유의.

## 업로드 자연키 (재업로드 시 upsert 기준)
- `sales`: `row_key` (doc_no+product_code+qty+unit_price+total_amount+customer_code+note 조합). 판매일보는 같은 문서번호+품목코드가 분할납품 등으로 여러 번 나올 수 있어 (doc_no, product_code)만으로는 자연키가 되지 못함 — `upload.html`의 `buildSalesRowKey()` 참고
- `profit_daily`: `(profit_date, product_code)`
- `inventory_snapshots`: 자연키 없음 — 업로드 시 같은 `snapshot_date`의 기존 행을 삭제 후 재삽입(스냅샷 교체 방식)

## 계정 추가
공개 회원가입이 없으므로 새 팀원은 Supabase 대시보드 → Authentication → Users에서 직접 추가해야 함.
