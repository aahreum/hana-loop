import { describe, it, expect } from 'vitest';
import {
  interpretChangeRate,
  interpretTopCategory,
  interpretPeakMonth,
  buildDonutSummary,
  buildDonutInsights,
  buildGradeExplanation,
  buildGradeInsights,
  buildTrendInsights,
  buildReductionSuggestions,
  type CategoryShare,
  type CategoryTrend,
} from './insights';

describe('interpretChangeRate', () => {
  it('|변화율| < 0.5 면 neutral 톤의 유지 메시지', () => {
    const result = interpretChangeRate(0.3);
    expect(result.tone).toBe('neutral');
    expect(result.message).toContain('비슷한 수준');
  });

  it('변화율 < 0 이면 good 톤의 감소 메시지에 절댓값 % 표기', () => {
    const result = interpretChangeRate(-12.34);
    expect(result.tone).toBe('good');
    expect(result.message).toContain('12.3% 감소');
  });

  it('변화율 > 0 이면 warn 톤의 증가 메시지', () => {
    const result = interpretChangeRate(7);
    expect(result.tone).toBe('warn');
    expect(result.message).toContain('7.0% 증가');
  });

  it('경계값 0.5 미만은 neutral, 0.5 이상은 증감 톤으로 분기', () => {
    expect(interpretChangeRate(0.49).tone).toBe('neutral');
    expect(interpretChangeRate(0.5).tone).toBe('warn');
    expect(interpretChangeRate(-0.5).tone).toBe('good');
  });
});

describe('interpretTopCategory', () => {
  const electricity: CategoryShare = {
    type: 'electricity',
    label: '전기',
    value: 100,
    share: 0.6,
  };

  it('top이 null이면 데이터 없음 + neutral', () => {
    const result = interpretTopCategory(null);
    expect(result.tone).toBe('neutral');
    expect(result.message).toBe('데이터 없음');
  });

  it('share >= 0.5 이면 warn 톤 + 라벨/퍼센트 포함', () => {
    const result = interpretTopCategory(electricity);
    expect(result.tone).toBe('warn');
    expect(result.message).toContain('전기');
    expect(result.message).toContain('60%');
  });

  it('share < 0.5 이면 neutral 톤', () => {
    const result = interpretTopCategory({ ...electricity, share: 0.3 });
    expect(result.tone).toBe('neutral');
    expect(result.message).toContain('30%');
  });
});

describe('interpretPeakMonth', () => {
  it('peakMonth가 null이면 데이터 없음 + neutral', () => {
    const result = interpretPeakMonth(null);
    expect(result.tone).toBe('neutral');
    expect(result.message).toBe('데이터 없음');
  });

  it('YYYY-MM 형식에서 월을 추출해 표기', () => {
    const result = interpretPeakMonth('2026-03');
    expect(result.message).toContain('3월');
    expect(result.tone).toBe('warn');
  });

  it('YYYY-12 같은 월도 정수로 파싱', () => {
    expect(interpretPeakMonth('2026-12').message).toContain('12월');
  });

  it('형식이 깨진 경우 데이터 없음', () => {
    expect(interpretPeakMonth('invalid').tone).toBe('neutral');
    expect(interpretPeakMonth('invalid').message).toBe('데이터 없음');
  });
});

describe('buildDonutSummary', () => {
  const make = (share: number): CategoryShare => ({
    type: 'electricity',
    label: '전기',
    value: 100,
    share,
  });

  it('top이 null이면 빈 문자열', () => {
    expect(buildDonutSummary(null)).toBe('');
  });

  it('share >= 0.5 이면 "대부분" 강조 문구', () => {
    expect(buildDonutSummary(make(0.7))).toContain('대부분');
  });

  it('0.35 <= share < 0.5 이면 "가장 큰 비중" 문구', () => {
    expect(buildDonutSummary(make(0.4))).toContain('가장 큰 비중');
  });

  it('share < 0.35 이면 "고르게 분포" 문구', () => {
    expect(buildDonutSummary(make(0.2))).toContain('고르게 분포');
  });
});

describe('buildDonutInsights', () => {
  const make = (share: number): CategoryShare => ({
    type: 'transport',
    label: '운송',
    value: 100,
    share,
  });

  it('top이 null이면 빈 배열', () => {
    expect(buildDonutInsights(null)).toEqual([]);
  });

  it('share >= 0.5 이면 warn 톤 한 건', () => {
    const insights = buildDonutInsights(make(0.55));
    expect(insights).toHaveLength(1);
    expect(insights[0].tone).toBe('warn');
    expect(insights[0].message).toContain('운송');
  });

  it('0.35 <= share < 0.5 면 warn 톤 한 건', () => {
    const insights = buildDonutInsights(make(0.4));
    expect(insights[0].tone).toBe('warn');
  });

  it('share < 0.35 면 neutral 톤 한 건', () => {
    const insights = buildDonutInsights(make(0.2));
    expect(insights[0].tone).toBe('neutral');
  });
});

describe('buildGradeExplanation', () => {
  const electricity: CategoryShare = {
    type: 'electricity',
    label: '전기',
    value: 100,
    share: 0.3,
  };

  it('totalChangeRate <= -5 면 reason은 good (감소 추세)', () => {
    const { reason } = buildGradeExplanation({
      score: 70,
      totalChangeRate: -10,
      topCategory: electricity,
    });
    expect(reason.tone).toBe('good');
  });

  it('totalChangeRate >= 5 면 reason은 warn (하락 추세)', () => {
    const { reason } = buildGradeExplanation({
      score: 50,
      totalChangeRate: 10,
      topCategory: electricity,
    });
    expect(reason.tone).toBe('warn');
  });

  it('|totalChangeRate| < 5 면 reason은 neutral (안정)', () => {
    const { reason } = buildGradeExplanation({
      score: 60,
      totalChangeRate: 0,
      topCategory: electricity,
    });
    expect(reason.tone).toBe('neutral');
  });

  it('topCategory가 null이면 comparison은 데이터 부족 + neutral', () => {
    const { comparison } = buildGradeExplanation({
      score: 80,
      totalChangeRate: 0,
      topCategory: null,
    });
    expect(comparison.tone).toBe('neutral');
    expect(comparison.message).toContain('비교 데이터 부족');
  });

  it('top.share >= 0.5 면 comparison은 warn', () => {
    const { comparison } = buildGradeExplanation({
      score: 80,
      totalChangeRate: 0,
      topCategory: { ...electricity, share: 0.6 },
    });
    expect(comparison.tone).toBe('warn');
  });

  it('share<0.5 + score>=70 이면 comparison은 good', () => {
    const { comparison } = buildGradeExplanation({
      score: 75,
      totalChangeRate: 0,
      topCategory: electricity,
    });
    expect(comparison.tone).toBe('good');
  });

  it('share<0.5 + 40<=score<70 이면 comparison은 neutral', () => {
    const { comparison } = buildGradeExplanation({
      score: 50,
      totalChangeRate: 0,
      topCategory: electricity,
    });
    expect(comparison.tone).toBe('neutral');
  });

  it('share<0.5 + score<40 이면 comparison은 warn', () => {
    const { comparison } = buildGradeExplanation({
      score: 30,
      totalChangeRate: 0,
      topCategory: electricity,
    });
    expect(comparison.tone).toBe('warn');
  });
});

describe('buildGradeInsights', () => {
  it('reason과 comparison 두 개의 인사이트를 반환', () => {
    const insights = buildGradeInsights({
      score: 75,
      totalChangeRate: -8,
      topCategory: {
        type: 'electricity',
        label: '전기',
        value: 100,
        share: 0.3,
      },
    });
    expect(insights).toHaveLength(2);
    expect(insights[0].tone).toBe('good');
    expect(insights[1].tone).toBe('good');
  });
});

describe('buildTrendInsights', () => {
  const trend = (
    type: string,
    label: string,
    recentTotal: number,
    previousTotal: number,
    changeRate: number,
  ): CategoryTrend => ({ type, label, recentTotal, previousTotal, changeRate });

  it('categoryTrends가 비어있으면 빈 배열', () => {
    const result = buildTrendInsights({
      categoryTrends: [],
      peakMonth: '2026-03',
      totalChangeRate: 5,
    });
    expect(result).toEqual([]);
  });

  it('biggestRise + totalChangeRate>0 + peakMonth 있으면 "X월 ○○ 사용량 증가" 메시지', () => {
    const result = buildTrendInsights({
      categoryTrends: [trend('electricity', '전기', 50, 40, 25)],
      peakMonth: '2026-03',
      totalChangeRate: 10,
    });
    expect(result[0].message).toContain('3월');
    expect(result[0].message).toContain('전기');
    expect(result[0].tone).toBe('warn');
  });

  it('biggestRise만 있고 peakMonth 없으면 percent 메시지로 폴백', () => {
    const result = buildTrendInsights({
      categoryTrends: [trend('transport', '운송', 30, 20, 50)],
      peakMonth: null,
      totalChangeRate: 0,
    });
    expect(result[0].message).toContain('운송');
    expect(result[0].message).toContain('50%');
    expect(result[0].tone).toBe('warn');
  });

  it('|changeRate|<5 인 활동은 "안정적으로 유지" 메시지', () => {
    const result = buildTrendInsights({
      categoryTrends: [trend('raw_material', '원소재', 80, 79, 1)],
      peakMonth: null,
      totalChangeRate: 0,
    });
    const stable = result.find((i) => i.message.includes('안정적'));
    expect(stable).toBeDefined();
    expect(stable?.tone).toBe('neutral');
  });

  it('changeRate<=-5 인 활동은 good 톤의 감소 추세 메시지', () => {
    const result = buildTrendInsights({
      categoryTrends: [trend('electricity', '전기', 60, 80, -25)],
      peakMonth: null,
      totalChangeRate: -10,
    });
    const decline = result.find((i) => i.message.includes('감소 추세'));
    expect(decline).toBeDefined();
    expect(decline?.tone).toBe('good');
    expect(decline?.message).toContain('25%');
  });

  it('최대 3개까지만 반환 (slice)', () => {
    const result = buildTrendInsights({
      categoryTrends: [
        trend('electricity', '전기', 100, 50, 100),
        trend('transport', '운송', 90, 90, 0),
        trend('raw_material', '원소재', 50, 100, -50),
      ],
      peakMonth: '2026-06',
      totalChangeRate: 10,
    });
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('recentTotal 0인 활동은 biggestRise/stable 후보에서 제외', () => {
    const result = buildTrendInsights({
      categoryTrends: [trend('electricity', '전기', 0, 0, 100)],
      peakMonth: '2026-03',
      totalChangeRate: 10,
    });
    expect(result).toEqual([]);
  });

  // .sort() 콜백 커버리지 보강 — 후보 2개 이상일 때 정렬 로직 호출
  it('biggestRise 후보 2개 이상이면 changeRate 내림차순으로 정렬 (가장 큰 증가 활동 선택)', () => {
    const result = buildTrendInsights({
      categoryTrends: [
        trend('electricity', '전기', 50, 40, 25),
        trend('transport', '운송', 50, 30, 67),
      ],
      peakMonth: '2026-03',
      totalChangeRate: 10,
    });
    expect(result[0].message).toContain('운송');
  });

  it('stable 후보 2개 이상이면 recentTotal 내림차순 (가장 큰 안정 활동 선택)', () => {
    const result = buildTrendInsights({
      categoryTrends: [
        trend('electricity', '전기', 50, 50, 0),
        trend('transport', '운송', 100, 99, 1),
      ],
      peakMonth: null,
      totalChangeRate: 0,
    });
    const stable = result.find((i) => i.message.includes('안정적'));
    expect(stable?.message).toContain('운송');
  });

  it('decline 후보 2개 이상이면 changeRate 오름차순 (가장 크게 감소한 활동 선택)', () => {
    const result = buildTrendInsights({
      categoryTrends: [
        trend('electricity', '전기', 60, 80, -25),
        trend('transport', '운송', 30, 80, -62.5),
      ],
      peakMonth: null,
      totalChangeRate: -20,
    });
    const decline = result.find((i) => i.message.includes('감소 추세'));
    expect(decline?.message).toContain('운송');
    expect(decline?.message).toContain('63%');
  });
});

describe('buildReductionSuggestions', () => {
  it('빈 입력은 빈 배열', () => {
    expect(buildReductionSuggestions({})).toEqual([]);
  });

  it('월 배출량 0 이하인 활동은 제외', () => {
    expect(buildReductionSuggestions({ electricity: 0 })).toEqual([]);
    expect(buildReductionSuggestions({ electricity: -5 })).toEqual([]);
  });

  it('electricity 10% × 12개월로 yearlySaving 계산', () => {
    const result = buildReductionSuggestions({ electricity: 100 });
    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.type).toBe('electricity');
    expect(item.label).toBe('전기');
    expect(item.reductionPct).toBe(0.1);
    expect(item.monthlySavingTon).toBeCloseTo(10);
    expect(item.yearlySavingTon).toBeCloseTo(120);
    expect(item.message).toContain('전기');
    expect(item.message).toContain('10%');
  });

  it('transport는 18% 감축률', () => {
    const result = buildReductionSuggestions({ transport: 100 });
    expect(result[0].reductionPct).toBe(0.18);
    expect(result[0].yearlySavingTon).toBeCloseTo(216);
  });

  it('raw_material은 8% 감축률', () => {
    const result = buildReductionSuggestions({ raw_material: 100 });
    expect(result[0].reductionPct).toBe(0.08);
    expect(result[0].yearlySavingTon).toBeCloseTo(96);
  });

  it('yearlySavingTon 내림차순 정렬', () => {
    const result = buildReductionSuggestions({
      electricity: 100, // yearly 120
      transport: 100, // yearly 216
      raw_material: 100, // yearly 96
    });
    expect(result.map((r) => r.type)).toEqual([
      'transport',
      'electricity',
      'raw_material',
    ]);
  });

  it('정의되지 않은 type은 무시', () => {
    const result = buildReductionSuggestions({
      electricity: 100,
      unknown_type: 999,
    });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('electricity');
  });
});
