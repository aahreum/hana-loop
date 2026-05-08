-- ============================================================
-- HanaLoop Carbon Dashboard — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum: 활동 유형 (과제 스펙 4개 카테고리 → 3개 type)
CREATE TYPE activity_type_enum AS ENUM (
  'electricity',
  'raw_material',
  'transport'
);

-- ────────────────────────────────────────────────────────────
-- 1. companies
-- ────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  country     char(2)     NOT NULL DEFAULT 'KR',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. emission_factors  (버전 이력 포함)
--    valid_to IS NULL  → 현재 유효 계수
--    valid_to NOT NULL → 과거 계수 (이력)
-- ────────────────────────────────────────────────────────────
CREATE TABLE emission_factors (
  id            uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text               NOT NULL,  -- 머신 키: 'electricity_kepco'
  name          text               NOT NULL,  -- 레이블: '전기 (한국전력 기본값)'
  activity_type activity_type_enum NOT NULL,
  factor        numeric(12, 6)     NOT NULL CHECK (factor > 0),
  unit          text               NOT NULL,  -- 'kgCO2e/kWh'
  scope         smallint           NOT NULL CHECK (scope IN (1, 2, 3)),
  valid_from    text               NOT NULL CHECK (valid_from ~ '^\d{4}-\d{2}$'),
  valid_to      text               CHECK (valid_to IS NULL OR valid_to ~ '^\d{4}-\d{2}$'),
  source        text               NOT NULL DEFAULT '',
  created_at    timestamptz        NOT NULL DEFAULT now(),
  CONSTRAINT no_date_inversion CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

-- 동일 category에서 active(valid_to IS NULL) 레코드는 1개만 허용
CREATE UNIQUE INDEX uq_factor_category_active
  ON emission_factors(category)
  WHERE valid_to IS NULL;

-- ────────────────────────────────────────────────────────────
-- 3. activities  (원본 활동 데이터 — 불변)
--    date        : Excel 원본 날짜 (YYYY-MM-DD)
--    year_month  : trigger로 자동 설정 (YYYY-MM) — 집계용
--    factor_category: emission_factors.category와 대응
-- ────────────────────────────────────────────────────────────
CREATE TABLE activities (
  id              uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid               NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  date            date               NOT NULL,
  year_month      text               NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  type            activity_type_enum NOT NULL,
  description     text               NOT NULL,
  factor_category text               NOT NULL,  -- → emission_factors.category
  quantity        numeric(14, 4)     NOT NULL CHECK (quantity > 0),
  unit            text               NOT NULL,
  scope           smallint           NOT NULL CHECK (scope IN (1, 2, 3)),
  created_at      timestamptz        NOT NULL DEFAULT now()
);

-- date → year_month 자동 설정 트리거
-- (GENERATED COLUMN은 to_char / date::text 모두 IMMUTABLE 불인정 문제로 trigger 사용)
CREATE OR REPLACE FUNCTION fn_set_year_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.year_month := to_char(NEW.date, 'YYYY-MM');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activities_year_month
BEFORE INSERT OR UPDATE OF date ON activities
FOR EACH ROW EXECUTE FUNCTION fn_set_year_month();

CREATE INDEX idx_activities_company_ym ON activities(company_id, year_month);
CREATE INDEX idx_activities_type       ON activities(type);
CREATE INDEX idx_activities_date       ON activities(date);

-- ────────────────────────────────────────────────────────────
-- 4. emission_results  (계산 결과 — 배출계수 변경 시 재계산 가능)
--    activity_id UNIQUE → 활동당 최신 계산값 1건 유지
-- ────────────────────────────────────────────────────────────
CREATE TABLE emission_results (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       uuid           NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  factor_id         uuid           NOT NULL REFERENCES emission_factors(id) ON DELETE RESTRICT,
  company_id        uuid           NOT NULL REFERENCES companies(id)  ON DELETE RESTRICT,
  year_month        text           NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  quantity          numeric(14, 4) NOT NULL,
  factor            numeric(12, 6) NOT NULL,
  emission_kg_co2e  numeric(16, 6) NOT NULL,
  scope             smallint       NOT NULL CHECK (scope IN (1, 2, 3)),
  calculated_at     timestamptz    NOT NULL DEFAULT now(),
  UNIQUE(activity_id)
);

CREATE INDEX idx_emission_results_company_ym ON emission_results(company_id, year_month);
CREATE INDEX idx_emission_results_scope      ON emission_results(scope);
