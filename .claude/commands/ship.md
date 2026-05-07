PR을 생성하는 전체 파이프라인을 실행한다.
선택 인자 `$ARGUMENTS`가 있으면 이슈/PR 설명에 힌트로 활용한다.

반드시 아래 5단계를 순서대로 완전히 이행한다. 어느 단계도 생략하지 않는다.

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
   - `feat` → `feat`
   - `fix` → `bug`
   - `chore` → `chore`
   - `docs` → `documentation`
   - `design` 또는 `style` → `design`
   - `test` → `test`
   - `refactor` → `refactor`
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

```bash
# 현재 브랜치 확인
git branch --show-current

# main이면 브랜치 생성 후 이동
git checkout -b type/#이슈번호-short-description
```

브랜치 형식: `type/#이슈번호-short-description` (CLAUDE.md 규칙 준수)
예시: `feat/#1-setup-dashboard`, `fix/#5-fix-emission-calc`

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
- PR 번호를 기억한다. Step 5에서 사용한다.

---

## Step 5 — CI 모니터링

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
