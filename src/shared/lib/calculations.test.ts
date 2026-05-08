import { describe, it, expect } from 'vitest';
import {
  calculateEmission,
  kgToTon,
  formatTon,
  calcChangeRate,
} from './calculations';

describe('calculateEmission', () => {
  it('활동량 × 배출계수를 반환한다', () => {
    expect(calculateEmission(110, 0.4567)).toBeCloseTo(50.237);
  });

  it('활동량이 0이면 0을 반환한다', () => {
    expect(calculateEmission(0, 0.4567)).toBe(0);
  });

  it('배출계수가 0이면 0을 반환한다', () => {
    expect(calculateEmission(110, 0)).toBe(0);
  });

  it('소수 곱셈도 정확히 계산한다', () => {
    expect(calculateEmission(2.5, 1.2)).toBeCloseTo(3.0);
  });
});

describe('kgToTon', () => {
  it('kg을 톤으로 변환한다 (÷1000)', () => {
    expect(kgToTon(1500)).toBe(1.5);
  });

  it('0은 0으로 변환된다', () => {
    expect(kgToTon(0)).toBe(0);
  });

  it('1000 미만 값은 1 미만 소수로 변환된다', () => {
    expect(kgToTon(250)).toBe(0.25);
  });
});

describe('formatTon', () => {
  it('기본 소수점 2자리로 포맷한다', () => {
    expect(formatTon(1500)).toBe('1.50');
  });

  it('decimals 인자를 적용한다', () => {
    expect(formatTon(1234, 3)).toBe('1.234');
    expect(formatTon(1234, 0)).toBe('1');
  });

  it('반올림 규칙이 toFixed와 동일하다', () => {
    expect(formatTon(1505, 1)).toBe('1.5');
    expect(formatTon(1555, 1)).toBe('1.6');
  });
});

describe('calcChangeRate', () => {
  it('current > previous면 양의 변화율을 반환한다', () => {
    expect(calcChangeRate(120, 100)).toBe(20);
  });

  it('current < previous면 음의 변화율을 반환한다', () => {
    expect(calcChangeRate(80, 100)).toBe(-20);
  });

  it('변화 없을 때 0을 반환한다', () => {
    expect(calcChangeRate(100, 100)).toBe(0);
  });

  it('previous가 0이면 0으로 폴백 (Infinity 방지)', () => {
    expect(calcChangeRate(50, 0)).toBe(0);
  });

  it('소수 결과도 정확히 계산한다', () => {
    expect(calcChangeRate(105, 100)).toBeCloseTo(5);
    expect(calcChangeRate(33, 30)).toBeCloseTo(10);
  });
});
