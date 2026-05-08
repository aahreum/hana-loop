PR을 생성하고 작업 내용을 위키에 기록하는 전체 파이프라인을 실행한다.
선택 인자 `$ARGUMENTS`가 있으면 이슈/PR 설명에 힌트로 활용한다.

반드시 아래 7단계를 순서대로 완전히 이행한다. 어느 단계도 생략하지 않는다.

---

## Step 0 — 과제 스펙 & 프로젝트 규칙 준수 체크

PR을 올리기 전, 변경된 코드가 아래 두 문서의 규칙을 위반하지 않는지 확인한다.

### 체크 대상 문서

1. **`docs/00-assignment.md`** — 과제 원본 스펙 (기술 제약, 금지 라이브러리 등)
2. **`CLAUDE.md`** — 프로젝트 기술 규칙 (FSD 레이어, 타입 시스템, 상태 관리 등)
3. **`docs/`** 내 관련 문서 — 아키텍처, 데이터 모델 등

### 체크 항목

```
과제 스펙 (docs/00-assignment.md):
  [ ] MUI / Ant Design 같은 무거운 UI 라이브러리를 import하지 않는가?
  [ ] Next.js App Router 구조를 따르는가?
  [ ] TypeScript를 사용하는가?

CLAUDE.md 규칙:
  [ ] FSD 레이어 의존성 방향을 위반하지 않는가?
      (features/A → features/B import 금지, shared → 다른 레이어 import 금지)
  [ ] Zod 스키마에서 타입을 파생하는가? (별도 interface/type 선언 금지)
  [ ] 색상 하드코딩이 없는가? (CSS 변수 사용)
  [ ] Query Key가 QUERY_KEYS 상수를 사용하는가? (인라인 string 금지)
  [ ] ui/ 컴포넌트에서 훅을 직접 사용하지 않는가?
  [ ] supabaseAdmin을 클라이언트 컴포넌트에서 import하지 않는가?
  [ ] Named export를 사용하는가? (page.tsx, layout.tsx, route.ts 제외)
  [ ] console.log가 없는가? (console.warn/error만 허용)

  추가 규칙 (React 19 / TanStack Query v5):
  [ ] TanStack Query 로딩 상태에 isLoading 대신 isPending을 사용하는가?
  [ ] forwardRef를 사용하지 않는가? (React 19 — ref를 props로 직접 전달)
  [ ] page 컴포넌트(app/**/page.tsx)에 'use client'가 없는가?
      클라이언트 로직이 필요하면 features/{slice}/container/ Container 컴포넌트로 분리
  [ ] JSX return 내 중첩 삼항연산자가 없는가? (early return 또는 컴포넌트 분리 사용)
  [ ] container/ 가 과도하게 생성되지 않았는가?
      (비즈니스 로직 연결 시에만 — 단순 레이아웃 조합은 container 불필요)
  [ ] 조합형 UI 블록(Header, Sidebar 등)이 features/가 아닌 widgets/에 위치하는가?
  [ ] features/에서 widgets/를 import하지 않는가? (의존성 방향 위반)
```

위반 항목이 있으면 수정 후 Step 1로 이동한다. 없으면 즉시 Step 1로 이동한다.

---

## Step 1 — 로컬 CI 검증

```bash
pnpm type-check
pnpm lint
pnpm build
```

- 셋 중 하나라도 실패하면 **즉시 오류를 수정**하고 해당 명령을 재실행한다.
- 세 가지 모두 통과한 후에만 Step 2로 이동한다.

---

## Step 2 — 이슈 생성

1. `git log --oneline main..HEAD` 와 `git diff main..HEAD --stat` 로 작업 내용을 파악한다.
2. 커밋 타입에 따라 라벨을 자동 매핑한다:
   - `feat` → `생성 (feat)`
   - `fix` → `fix`
   - `chore` → `chore`
   - `docs` → `docs`
   - `design` 또는 `style` → `design`
3. 파악한 내용을 바탕으로 이슈를 생성한다:

```bash
gh issue create \
  --title "[TYPE] 작업 내용 요약" \
  --body "## 작업 내용\n(무엇을 했는지)\n\n## 변경 이유\n(왜 필요했는지)" \
  --label "라벨명"
```

4. 생성된 이슈 번호를 기억한다. 이후 모든 단계에서 사용한다.

---

## Step 3 — 브랜치 생성 및 커밋

### 3-1. 브랜치 생성 (절대 생략 불가)

현재 브랜치가 `main`이면 **반드시** 작업 브랜치를 먼저 만든다.
이 단계를 건너뛰면 PR 생성이 불가능하므로 절대 생략하지 않는다.

```bash
# 현재 브랜치 확인
git branch --show-current

# main이면 브랜치 생성 후 이동
git checkout -b type/#이슈번호-short-description
```

브랜치 형식: `type/#이슈번호-short-description` (CLAUDE.md 규칙 준수)
예시: `chore/#26-fix-eslint`, `feat/#30-dashboard-charts`, `fix/#28-emission-calc`

### 3-2. 커밋

- `git status`로 미커밋 변경사항이 있는지 확인한다.
- 커밋되지 않은 변경사항이 있으면:
  ```bash
  git add -A
  git commit -m "type: subject #이슈번호"
  ```
- 이미 모두 커밋된 경우 이 단계를 스킵한다.
- 커밋 형식: `type: subject #이슈번호` (CLAUDE.md 규칙 준수)

---

## Step 4 — PR 생성

```bash
gh pr create \
  --base main \
  --title "type: subject #이슈번호" \
  --body "$(cat <<'EOF'
## 개요
(이 PR에서 무엇을 했는지 1~2줄)

## 주요 변경 사항
- 항목 1
- 항목 2

## 스크린샷
(UI 변경 시 첨부, 없으면 생략)

Closes #이슈번호
EOF
)"
```

- `Closes #이슈번호`가 body에 반드시 포함되어야 한다.
- PR 번호를 기억한다. Step 5, 6에서 사용한다.

---

## Step 5 — 위키 작성

작업 내용을 위키에 기록한다. PR 메타데이터 페이지(PR #번호: 제목)가 아니라,
**이번 작업으로 새로 생기거나 바뀐 내용**을 위키 문서에 직접 반영한다.

### 5-1. 위키 레포 준비

```bash
if [ -d /tmp/hana-loop.wiki ]; then
  git -C /tmp/hana-loop.wiki pull
else
  gh repo clone aahreum/hana-loop.wiki /tmp/hana-loop.wiki
fi
```

### 5-2. 작업 내용 파악 후 위키 결정

`git diff main..HEAD`와 변경된 파일 목록을 분석해 어떤 위키 페이지를 써야 하는지 판단한다.

**판단 기준:**

- 기존 위키 페이지와 관련 있으면 → 해당 페이지의 관련 섹션을 업데이트한다
- 기존 페이지에 없는 새로운 기능/구조면 → 새 위키 페이지를 만든다 (파일명: `{주제}.md`)
- 작업 범위가 여러 페이지에 걸치면 → 각 페이지를 모두 업데이트한다

**절대 하지 않는 것:**

- `PR-{번호}-{제목}.md` 형식의 PR 전용 페이지 생성 금지
- Home.md에 PR 이력 항목 추가 금지

### 5-3. 위키 내용 작성

`.claude/rules/wiki-sync.md`의 섹션 규칙을 따라 내용을 작성한다.
Edit 툴(기존 페이지 수정) 또는 Write 툴(신규 페이지 생성)을 사용한다.

새 페이지를 만들었다면 `Home.md`의 "프로젝트 개요 문서" 목록에 항목을 추가한다.

### 5-4. 위키 push

```bash
cd /tmp/hana-loop.wiki
git config user.name "aahreum"
git config user.email "cocoding420@gmail.com"
git add -A
git commit -m "docs: {작업 내용 한 줄 요약} 위키 반영"
TOKEN=$(gh auth token)
git push "https://${TOKEN}@github.com/aahreum/hana-loop.wiki.git" HEAD:master
```

---

## Step 6 — CI 모니터링

```bash
gh pr checks {PR번호} --watch
```

- CI가 통과하면 PR URL을 보고하며 완료 선언한다.
- CI가 실패하면:
  1. 실패한 job의 로그를 확인한다: `gh run view --log-failed`
  2. 오류 원인을 분석하고 수정한다.
  3. 수정사항을 커밋·푸시한다.
  4. 다시 `gh pr checks {PR번호} --watch` 로 확인한다.
  5. 통과할 때까지 반복한다.

---

## 완료 보고

모든 단계가 완료되면 다음을 보고한다:

- 생성된 이슈 번호 및 URL
- 생성된 PR 번호 및 URL
- CI 통과 여부
