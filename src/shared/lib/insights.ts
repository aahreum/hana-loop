/**
 * 데이터 기반 자동 인사이트 문구 생성 라이브러리
 *
 * 대시보드의 각 카드/그래프에서 "현재 상태 → 원인 → 개선 포인트"를
 * 자연어로 풀어주는 함수 모음.
 */

import { ACTIVITY_TYPE_LABELS } from '@/shared/constants/activityLabels';

export type InsightTone = 'good' | 'warn' | 'neutral';

export type Insight = {
  message: string;
  tone: InsightTone;
};

export type CategoryShare = {
  type: string;
  label: string;
  value: number; // tCO2e
  share: number; // 0–1
};

export type CategoryTrend = {
  type: string;
  label: string;
  recentTotal: number;
  previousTotal: number;
  changeRate: number; // %
};

/**
 * 전월 대비 변화율을 해석 문구로 변환.
 * 감소(좋음) / 증가(주의) / 유지(중립) 톤 부여.
 */
export function interpretChangeRate(changeRate: number): Insight {
  const abs = Math.abs(changeRate);
  if (abs < 0.5) {
    return {
      message: '전월과 비슷한 수준으로 유지되고 있습니다',
      tone: 'neutral',
    };
  }
  if (changeRate < 0) {
    return {
      message: `지난달 대비 배출량 ${abs.toFixed(1)}% 감소`,
      tone: 'good',
    };
  }
  return {
    message: `지난달 대비 배출량 ${abs.toFixed(1)}% 증가`,
    tone: 'warn',
  };
}

/**
 * 최대 배출 활동 해석.
 * 비중이 높을수록 강조 톤 (warn) 부여.
 */
export function interpretTopCategory(top: CategoryShare | null): Insight {
  if (!top) return { message: '데이터 없음', tone: 'neutral' };
  const pct = (top.share * 100).toFixed(0);
  if (top.share >= 0.5) {
    return {
      message: `배출량의 ${pct}%가 ${top.label}에서 발생`,
      tone: 'warn',
    };
  }
  return {
    message: `${top.label}이(가) 전체 배출의 ${pct}%`,
    tone: 'neutral',
  };
}

/**
 * 연중 최대 배출 월 표기.
 */
export function interpretPeakMonth(peakMonth: string | null): Insight {
  if (!peakMonth) return { message: '데이터 없음', tone: 'neutral' };
  // yearMonth 'YYYY-MM' → 'M월'
  const month = parseInt(peakMonth.split('-')[1] ?? '0', 10);
  if (!month) return { message: '데이터 없음', tone: 'neutral' };
  return {
    message: `${month}월이 기간 내 최대 배출 시점`,
    tone: 'warn',
  };
}

/**
 * 도넛 차트 하단 강조 문구 (단일 라인 — 호환용).
 */
export function buildDonutSummary(top: CategoryShare | null): string {
  if (!top) return '';
  const pct = (top.share * 100).toFixed(0);
  if (top.share >= 0.5) {
    return `배출량의 대부분은 ${top.label} 사용에서 발생하고 있습니다 (${pct}%)`;
  }
  if (top.share >= 0.35) {
    return `${top.label}이(가) 전체 배출의 ${pct}%로 가장 큰 비중을 차지합니다`;
  }
  return `배출원이 비교적 고르게 분포되어 있으며, ${top.label}이(가) ${pct}%로 가장 높습니다`;
}

/**
 * 도넛 분석 인사이트 리스트 — 최대 배출 활동 비중.
 * (계산 공식 설명은 UI 툴팁(?)으로 분리되어 별도 노출)
 */
export function buildDonutInsights(top: CategoryShare | null): Insight[] {
  if (!top) return [];
  const pct = (top.share * 100).toFixed(0);

  const headline: Insight =
    top.share >= 0.5
      ? {
          message: `배출량의 ${pct}%가 ${top.label}에서 발생합니다`,
          tone: 'warn',
        }
      : top.share >= 0.35
        ? {
            message: `${top.label}이(가) 전체 배출의 ${pct}%로 가장 큰 비중을 차지합니다`,
            tone: 'warn',
          }
        : {
            message: `${top.label}이(가) ${pct}%로 가장 높지만 비교적 고르게 분포되어 있습니다`,
            tone: 'neutral',
          };

  return [headline];
}

/**
 * 등급 분석 인사이트 리스트 (이유 + 업계 비교).
 */
export function buildGradeInsights(args: {
  score: number;
  totalChangeRate: number;
  topCategory: CategoryShare | null;
}): Insight[] {
  const { reason, comparison } = buildGradeExplanation(args);
  return [reason, comparison];
}

/**
 * 트렌드 그래프 하단 인사이트 (최대 3개).
 *
 * 룰:
 *  - 최근 월에 가장 크게 증가한 활동 → "X월 ○○ 사용량 증가로 전체 배출량 상승"
 *  - 변화 거의 없는 활동 → "○○ 사용량은 안정적으로 유지"
 *  - 감소 추세 활동 → "○○ 활동은 최근 감소 추세"
 */
export function buildTrendInsights(args: {
  categoryTrends: CategoryTrend[];
  peakMonth: string | null;
  totalChangeRate: number;
}): Insight[] {
  const { categoryTrends, peakMonth, totalChangeRate } = args;
  const insights: Insight[] = [];

  if (categoryTrends.length === 0) return insights;

  const peakMonthLabel = peakMonth
    ? `${parseInt(peakMonth.split('-')[1] ?? '0', 10)}월`
    : null;

  // 1) 가장 큰 증가 폭 활동 — 최근 배출이 0보다 크고 변화율 +5% 이상
  const biggestRise = [...categoryTrends]
    .filter((c) => c.recentTotal > 0 && c.changeRate >= 5)
    .sort((a, b) => b.changeRate - a.changeRate)[0];

  if (biggestRise && totalChangeRate > 0 && peakMonthLabel) {
    insights.push({
      message: `${peakMonthLabel} ${biggestRise.label} 사용량 증가로 전체 배출량이 상승했습니다`,
      tone: 'warn',
    });
  } else if (biggestRise) {
    insights.push({
      message: `${biggestRise.label} 사용량이 ${biggestRise.changeRate.toFixed(0)}% 증가했습니다`,
      tone: 'warn',
    });
  }

  // 2) 안정 유지 활동 — recentTotal > 0 이고 |changeRate| < 5
  const stable = categoryTrends
    .filter((c) => c.recentTotal > 0 && Math.abs(c.changeRate) < 5)
    .sort((a, b) => b.recentTotal - a.recentTotal)[0];
  if (stable) {
    insights.push({
      message: `${stable.label} 사용량은 안정적으로 유지되고 있습니다`,
      tone: 'neutral',
    });
  }

  // 3) 감소 추세 활동 — 변화율 -5% 이하
  const decline = [...categoryTrends]
    .filter((c) => c.previousTotal > 0 && c.changeRate <= -5)
    .sort((a, b) => a.changeRate - b.changeRate)[0];
  if (decline) {
    insights.push({
      message: `${decline.label} 활동은 최근 감소 추세입니다 (${Math.abs(decline.changeRate).toFixed(0)}%↓)`,
      tone: 'good',
    });
  }

  return insights.slice(0, 3);
}

/**
 * 탄소 등급 이유 + 업계 평균 비교.
 * 점수와 최대 활동 비중을 기반으로 휴리스틱 메시지를 만든다.
 */
export function buildGradeExplanation(args: {
  score: number;
  totalChangeRate: number;
  topCategory: CategoryShare | null;
}): { reason: Insight; comparison: Insight } {
  const { score, totalChangeRate, topCategory } = args;

  // 등급 이유
  let reason: Insight;
  if (totalChangeRate <= -5) {
    reason = {
      message: '최근 배출량 감소 추세로 등급이 개선되었습니다',
      tone: 'good',
    };
  } else if (totalChangeRate >= 5) {
    reason = {
      message: '최근 배출량 증가로 등급이 하락 추세입니다',
      tone: 'warn',
    };
  } else {
    reason = {
      message: '배출량이 안정적으로 유지되고 있어 등급이 유지됩니다',
      tone: 'neutral',
    };
  }

  // 업계 평균 비교 (topCategory.share를 기반으로 한 휴리스틱)
  let comparison: Insight;
  if (!topCategory) {
    comparison = { message: '비교 데이터 부족', tone: 'neutral' };
  } else if (topCategory.share >= 0.5) {
    comparison = {
      message: `업계 평균 대비 ${topCategory.label} 배출 비중이 높은 편입니다`,
      tone: 'warn',
    };
  } else if (score >= 70) {
    comparison = {
      message: '업계 평균 대비 양호한 수준입니다',
      tone: 'good',
    };
  } else if (score >= 40) {
    comparison = {
      message: '업계 평균 수준으로 추가 개선 여지가 있습니다',
      tone: 'neutral',
    };
  } else {
    comparison = {
      message: '업계 평균 대비 개선이 필요한 수준입니다',
      tone: 'warn',
    };
  }

  return { reason, comparison };
}

/**
 * 감축 제안 — 활동별 절감 시뮬레이션.
 * 각 활동의 최근 월 배출량 × 절감률 → 연간 절감 예상치(tCO2e).
 */
export type ReductionSuggestion = {
  type: string;
  label: string;
  reductionPct: number; // 0–1
  monthlySavingTon: number;
  yearlySavingTon: number;
  message: string;
};

const REDUCTION_RULES: Array<{
  type: string;
  pct: number;
  template: (label: string, pct: number, yearly: number) => string;
}> = [
  {
    type: 'electricity',
    pct: 0.1,
    template: (label, pct, yearly) =>
      `${label} 사용량 ${(pct * 100).toFixed(0)}% 절감 시 연간 ${yearly.toFixed(2)}tCO₂e 감소 가능`,
  },
  {
    type: 'transport',
    pct: 0.18,
    template: (label, pct, yearly) =>
      `${label} 거리 최적화 시 연간 약 ${yearly.toFixed(2)}tCO₂e 감소 가능`,
  },
  {
    type: 'raw_material',
    pct: 0.08,
    template: (label, pct, yearly) =>
      `${label} 사용 효율화 시 연간 약 ${yearly.toFixed(2)}tCO₂e 감소 가능`,
  },
  {
    type: 'fuel',
    pct: 0.12,
    template: (label, pct, yearly) =>
      `${label} 사용량 ${(pct * 100).toFixed(0)}% 절감 시 연간 ${yearly.toFixed(2)}tCO₂e 감소 가능`,
  },
  {
    type: 'waste',
    pct: 0.15,
    template: (label, pct, yearly) =>
      `${label} 재활용 비율 향상 시 연간 약 ${yearly.toFixed(2)}tCO₂e 감소 가능`,
  },
];

export function buildReductionSuggestions(
  recentMonthByType: Record<string, number>,
): ReductionSuggestion[] {
  const out: ReductionSuggestion[] = [];
  for (const rule of REDUCTION_RULES) {
    const monthly = recentMonthByType[rule.type] ?? 0;
    if (monthly <= 0) continue;
    const monthlySaving = monthly * rule.pct;
    const yearlySaving = monthlySaving * 12;
    const label = ACTIVITY_TYPE_LABELS[rule.type] ?? rule.type;
    out.push({
      type: rule.type,
      label,
      reductionPct: rule.pct,
      monthlySavingTon: monthlySaving,
      yearlySavingTon: yearlySaving,
      message: rule.template(label, rule.pct, yearlySaving),
    });
  }
  return out.sort((a, b) => b.yearlySavingTon - a.yearlySavingTon).slice(0, 3);
}
