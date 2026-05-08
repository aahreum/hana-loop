'use client';

import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';

type UnitTooltipProps = {
  /** 라벨 텍스트 (예: "tCO₂e"). 생략 시 트리거는 아이콘만 표시. */
  label?: string;
  /** 툴팁 본문에 표시할 설명 텍스트 또는 노드. */
  description: React.ReactNode;
  /** 추가 비교 문구 (예: "승용차 약 4,400km 주행 수준"). */
  comparison?: React.ReactNode;
  className?: string;
};

/**
 * 단위·전문 용어 옆에 도움말 아이콘을 표시하고 툴팁으로 의미·실생활 비교를 제공한다.
 *
 * @example
 * <UnitTooltip
 *   label="tCO₂e"
 *   description="이산화탄소 환산톤"
 *   comparison="1tCO₂e ≈ 승용차 약 4,400km 주행 수준"
 * />
 */
export function UnitTooltip({
  label,
  description,
  comparison,
  className,
}: UnitTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label ? `${label} 단위 설명` : '단위 설명'}
          className={cn(
            'inline-flex items-center gap-1 text-gray-500 hover:text-text cursor-pointer',
            className,
          )}
        >
          {label && <span>{label}</span>}
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="w-max space-y-1 whitespace-nowrap border border-border bg-surface px-4 py-3 text-xs leading-relaxed shadow-xl"
      >
        <div className="font-semibold text-text">{description}</div>
        {comparison && (
          <div className="text-muted-foreground">{comparison}</div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
