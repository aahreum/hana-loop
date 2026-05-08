import { describe, it, expect } from 'vitest';
import {
  ActivityTypeSchema,
  ScopeSchema,
  CreateActivitySchema,
} from './activity';

const validInput = {
  companyId: '11111111-1111-1111-1111-111111111111',
  date: '2026-05-08',
  type: 'electricity' as const,
  description: '본사 전기 사용',
  factorCategory: 'electricity_kepco',
  quantity: 1234.5,
  unit: 'kWh',
};

describe('ActivityTypeSchema', () => {
  it('허용된 3개 값(electricity/raw_material/transport)만 통과', () => {
    expect(ActivityTypeSchema.safeParse('electricity').success).toBe(true);
    expect(ActivityTypeSchema.safeParse('raw_material').success).toBe(true);
    expect(ActivityTypeSchema.safeParse('transport').success).toBe(true);
  });

  it('과거 enum(fuel/waste)은 거부 — Supabase 동기화 정합성', () => {
    expect(ActivityTypeSchema.safeParse('fuel').success).toBe(false);
    expect(ActivityTypeSchema.safeParse('waste').success).toBe(false);
  });
});

describe('ScopeSchema', () => {
  it('1, 2, 3만 통과', () => {
    expect(ScopeSchema.safeParse(1).success).toBe(true);
    expect(ScopeSchema.safeParse(2).success).toBe(true);
    expect(ScopeSchema.safeParse(3).success).toBe(true);
  });

  it('범위 밖 정수는 거부', () => {
    expect(ScopeSchema.safeParse(0).success).toBe(false);
    expect(ScopeSchema.safeParse(4).success).toBe(false);
  });

  it('문자열 "1"은 거부 (강제 변환 없음)', () => {
    expect(ScopeSchema.safeParse('1').success).toBe(false);
  });
});

describe('CreateActivitySchema — 정상 케이스', () => {
  it('전체 필드 유효 시 통과', () => {
    const result = CreateActivitySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('파싱 결과는 입력값과 동일', () => {
    const result = CreateActivitySchema.parse(validInput);
    expect(result).toEqual(validInput);
  });
});

describe('CreateActivitySchema — 음수/0 입력 거부 (과제 스펙: 음수 입력 방지)', () => {
  it('quantity 음수는 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      quantity: -10,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('0보다 큰 값을 입력하세요');
    }
  });

  it('quantity 0은 거부 (positive — 양수만 허용)', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('아주 작은 양수는 통과', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      quantity: 0.0001,
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateActivitySchema — 숫자 외 입력 거부 (과제 스펙: 숫자 외 입력 방지)', () => {
  it('quantity가 문자열이면 거부 (z.number 강제 변환 없음)', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      quantity: '100',
    });
    expect(result.success).toBe(false);
  });

  it('quantity가 NaN이면 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      quantity: NaN,
    });
    expect(result.success).toBe(false);
  });

  it('quantity가 null이면 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      quantity: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateActivitySchema — 필수값 누락 거부 (과제 스펙: 필수값 누락 처리)', () => {
  it('description 빈 문자열은 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      description: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('설명을 입력하세요');
    }
  });

  it('factorCategory 빈 문자열은 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      factorCategory: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('배출계수를 선택하세요');
    }
  });

  it('unit 빈 문자열은 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      unit: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('단위를 선택하세요');
    }
  });

  it('필드 자체가 누락된 경우 거부', () => {
    const withoutDescription = {
      companyId: validInput.companyId,
      date: validInput.date,
      type: validInput.type,
      factorCategory: validInput.factorCategory,
      quantity: validInput.quantity,
      unit: validInput.unit,
    };
    expect(CreateActivitySchema.safeParse(withoutDescription).success).toBe(
      false,
    );
  });
});

describe('CreateActivitySchema — 형식 검증', () => {
  it('companyId가 UUID 형식이 아니면 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      companyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('date가 YYYY-MM-DD 형식이 아니면 거부', () => {
    expect(
      CreateActivitySchema.safeParse({ ...validInput, date: '2026-5-8' })
        .success,
    ).toBe(false);
    expect(
      CreateActivitySchema.safeParse({ ...validInput, date: '2026/05/08' })
        .success,
    ).toBe(false);
    expect(
      CreateActivitySchema.safeParse({ ...validInput, date: '20260508' })
        .success,
    ).toBe(false);
  });

  it('date가 정확히 YYYY-MM-DD면 통과', () => {
    expect(
      CreateActivitySchema.safeParse({ ...validInput, date: '2026-12-31' })
        .success,
    ).toBe(true);
  });

  it('date 메시지는 한국어 친화적', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      date: '2026/05/08',
    });
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'YYYY-MM-DD 형식이어야 합니다',
      );
    }
  });

  it('type이 허용된 enum 값이 아니면 거부', () => {
    const result = CreateActivitySchema.safeParse({
      ...validInput,
      type: 'fuel',
    });
    expect(result.success).toBe(false);
  });
});
