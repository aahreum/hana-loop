# 위키 동기화 규칙

Claude Code가 위키를 직접 편집할 때 반드시 따른다.
위키는 `/ship` 커맨드의 Step 5에서만 작성한다.

---

## 위키 레포 정보

| 항목       | 값                                                         |
| ---------- | ---------------------------------------------------------- |
| 원격 레포  | `aahreum/hana-loop.wiki`                                   |
| 로컬 경로  | `/tmp/hana-loop.wiki/`                                     |
| clone 명령 | `gh repo clone aahreum/hana-loop.wiki /tmp/hana-loop.wiki` |

---

## 위키 레포 준비

```bash
if [ -d /tmp/hana-loop.wiki ]; then
  git -C /tmp/hana-loop.wiki pull
else
  gh repo clone aahreum/hana-loop.wiki /tmp/hana-loop.wiki
fi
```

---

## 위키 파일 구조

```
/tmp/hana-loop.wiki/
├── Home.md              ← 전체 인덱스
├── 프로젝트-구조.md      ← FSD 레이어, 디렉토리 구조
├── 아키텍처.md           ← 상태 관리, 데이터 흐름, 렌더링 전략
├── API-설계.md           ← API Routes, Supabase 스키마, OpenAPI
├── 디자인-시스템.md      ← 디자인 토큰, 컬러, 컴포넌트 규칙
└── 탄소-도메인.md        ← Scope 1/2/3, 배출계수, 계산 공식
```

PR별 개별 페이지는 만들지 않는다.

---

## Home.md 구조

```markdown
# HanaLoop Carbon Dashboard Wiki

> 탄소 배출 관리 대시보드 프로젝트 문서

---

## 프로젝트 개요 문서

- [페이지명](./파일명) — 한 줄 설명
```

---

## 개요 문서 작성 규칙

1. **한 뭉탱이 금지** — 내용이 여러 영역에 걸치면 `###` 서브타이틀로 반드시 분리
2. **사실 기반** — 추측이나 제안 없이 실제 내용만 기술
3. **간결하게** — 각 섹션은 핵심만, 불필요한 수식어 금지
4. **한국어** — 전체 한국어 작성 (코드·파일명·기술 용어 제외)

---

## push 방법

```bash
cd /tmp/hana-loop.wiki
git config user.name "aahreum"
git config user.email "cocoding420@gmail.com"
git add -A
git commit -m "docs: 위키 업데이트"
TOKEN=$(gh auth token)
git push "https://${TOKEN}@github.com/aahreum/hana-loop.wiki.git" HEAD:master
```
