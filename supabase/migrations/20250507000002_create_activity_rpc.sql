-- ============================================================
-- RPC: create_activity_with_emission
-- activities + emission_results를 하나의 트랜잭션으로 저장.
-- scope는 emission_factors.scope에서 자동 결정 (클라이언트 입력 불필요).
-- ============================================================

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
  -- 1. 배출계수 조회 (현재 유효: valid_to IS NULL)
  SELECT * INTO v_factor
  FROM emission_factors
  WHERE category = p_factor_category AND valid_to IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACTOR_NOT_FOUND: %', p_factor_category;
  END IF;

  -- 2. activities 저장 (year_month는 trigger가 자동 설정)
  INSERT INTO activities (
    company_id, date, type, description,
    factor_category, quantity, unit, scope
  ) VALUES (
    p_company_id, p_date, p_type, p_description,
    p_factor_category, p_quantity, p_unit, v_factor.scope
  )
  RETURNING * INTO v_activity;

  -- 3. 배출량 계산 및 emission_results 저장
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
