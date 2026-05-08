-- ============================================================
-- HanaLoop — activity_type_enum: fuel/waste 제거
-- 과제 스펙(전기/원소재/운송 3개 활동 유형)에 맞춰 enum 축소
-- 원격 Supabase 적용용 — initial_schema.sql 은 이미 3개로 갱신됨
--
-- 주의: create_activity_with_emission(...) RPC 가 enum 을 시그니처에
--       쓰고 있어서 DROP TYPE 전에 함수 시그니처를 먼저 제거해야 한다.
-- ============================================================

BEGIN;

-- 1. fuel/waste 활동/배출계수 row 정리
--    emission_results 는 activity_id ON DELETE CASCADE 라 자동 삭제됨
DELETE FROM activities         WHERE type::text         IN ('fuel', 'waste');
DELETE FROM emission_factors   WHERE activity_type::text IN ('fuel', 'waste');

-- 2. enum 의존 함수 시그니처 제거 (CASCADE 없이 명시적으로)
DROP FUNCTION IF EXISTS create_activity_with_emission(
  uuid, date, activity_type_enum, text, text, numeric, text
);

-- 3. 새 enum 타입 생성
CREATE TYPE activity_type_enum_new AS ENUM (
  'electricity',
  'raw_material',
  'transport'
);

-- 4. 컬럼 타입 교체 (text 경유 캐스팅으로 안전 변환)
ALTER TABLE activities
  ALTER COLUMN type TYPE activity_type_enum_new
  USING type::text::activity_type_enum_new;

ALTER TABLE emission_factors
  ALTER COLUMN activity_type TYPE activity_type_enum_new
  USING activity_type::text::activity_type_enum_new;

-- 5. 기존 enum drop 후 신규 enum 의 이름을 원래 이름으로 rename
DROP TYPE activity_type_enum;
ALTER TYPE activity_type_enum_new RENAME TO activity_type_enum;

-- 6. RPC 재생성 (20250507000002_create_activity_rpc.sql 과 동일 정의)
CREATE OR REPLACE FUNCTION create_activity_with_emission(
  p_company_id      uuid,
  p_date            date,
  p_type            activity_type_enum,
  p_description     text,
  p_factor_category text,
  p_quantity        numeric,
  p_unit            text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_factor           emission_factors%ROWTYPE;
  v_activity         activities%ROWTYPE;
  v_emission_kg_co2e numeric;
BEGIN
  SELECT * INTO v_factor
  FROM emission_factors
  WHERE category = p_factor_category AND valid_to IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACTOR_NOT_FOUND: %', p_factor_category;
  END IF;

  INSERT INTO activities (
    company_id, date, type, description,
    factor_category, quantity, unit, scope
  ) VALUES (
    p_company_id, p_date, p_type, p_description,
    p_factor_category, p_quantity, p_unit, v_factor.scope
  )
  RETURNING * INTO v_activity;

  v_emission_kg_co2e := p_quantity * v_factor.factor;

  INSERT INTO emission_results (
    activity_id, factor_id, company_id,
    year_month, quantity, factor, emission_kg_co2e, scope
  ) VALUES (
    v_activity.id, v_factor.id, p_company_id,
    v_activity.year_month, p_quantity, v_factor.factor,
    v_emission_kg_co2e, v_factor.scope
  );

  RETURN row_to_json(v_activity);
END;
$$;

COMMIT;
