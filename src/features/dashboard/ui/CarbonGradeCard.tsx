'use client';

import { CarbonGauge } from './CarbonGauge';
import { InsightList } from './InsightList';
import type { Insight } from '@/shared/lib/insights';

type CarbonGradeCardProps = {
  score: number;
  insights: Insight[];
};

export function CarbonGradeCard({ score, insights }: CarbonGradeCardProps) {
  return (
    <div className="space-y-4">
      <CarbonGauge score={score} />

      {insights.length > 0 && (
        <div className="border-t border-border pt-4">
          <InsightList insights={insights} />
        </div>
      )}
    </div>
  );
}
