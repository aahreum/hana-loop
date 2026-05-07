'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  CreateActivitySchema,
  type CreateActivityInput,
} from '@/shared/types/activity';
import type { EmissionFactor } from '@/shared/types/factor';
import { calculateEmission, kgToTon } from '@/shared/lib/calculations';
import { cn } from '@/shared/lib/utils';

const ACTIVITY_TYPES = [
  { value: 'electricity', label: '전기' },
  { value: 'fuel', label: '연료' },
  { value: 'raw_material', label: '원자재' },
  { value: 'transport', label: '운송' },
  { value: 'waste', label: '폐기물' },
] as const;

type ActivityFormProps = {
  companyId: string;
  factors: EmissionFactor[];
  isSubmitting: boolean;
  onSubmit: (data: CreateActivityInput) => void;
  onCancel: () => void;
};

export function ActivityForm({
  companyId,
  factors,
  isSubmitting,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(CreateActivitySchema),
    defaultValues: {
      companyId,
      date: new Date().toISOString().slice(0, 10),
      type: 'electricity',
      description: '',
      factorCategory: '',
      quantity: undefined,
      unit: '',
    },
  });

  const selectedType = watch('type');
  const selectedCategory = watch('factorCategory');
  const quantity = watch('quantity');

  const filteredFactors = factors.filter(
    (f) => f.activityType === selectedType,
  );
  const selectedFactor = filteredFactors.find(
    (f) => f.category === selectedCategory,
  );

  const previewEmission =
    selectedFactor && quantity > 0
      ? kgToTon(calculateEmission(quantity, selectedFactor.factor))
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('companyId')} />

      <div className="grid grid-cols-2 gap-4">
        {/* 날짜 */}
        <div className="space-y-1.5">
          <Label htmlFor="date">날짜 *</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            className={errors.date ? 'border-error' : ''}
          />
          {errors.date && (
            <p className="text-xs text-error">{errors.date.message}</p>
          )}
        </div>

        {/* 활동 유형 */}
        <div className="space-y-1.5">
          <Label htmlFor="type">활동 유형 *</Label>
          <Select
            value={selectedType}
            onValueChange={(v) => {
              setValue('type', v as CreateActivityInput['type'], {
                shouldValidate: true,
              });
              setValue('factorCategory', '');
              setValue('unit', '');
            }}
          >
            <SelectTrigger
              id="type"
              className={errors.type ? 'border-error' : ''}
            >
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-xs text-error">{errors.type.message}</p>
          )}
        </div>
      </div>

      {/* 설명 */}
      <div className="space-y-1.5">
        <Label htmlFor="description">설명 *</Label>
        <Input
          id="description"
          placeholder="활동에 대한 설명을 입력하세요"
          {...register('description')}
          className={errors.description ? 'border-error' : ''}
        />
        {errors.description && (
          <p className="text-xs text-error">{errors.description.message}</p>
        )}
      </div>

      {/* 배출계수 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="factorCategory">배출계수 *</Label>
        <Select
          value={selectedCategory}
          onValueChange={(v) => {
            setValue('factorCategory', v, { shouldValidate: true });
            const f = filteredFactors.find((f) => f.category === v);
            if (f) setValue('unit', f.unit);
          }}
        >
          <SelectTrigger
            id="factorCategory"
            className={errors.factorCategory ? 'border-error' : ''}
          >
            <SelectValue
              placeholder={
                filteredFactors.length === 0
                  ? '해당 유형 계수 없음'
                  : '배출계수 선택'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {filteredFactors.map((f) => (
              <SelectItem key={f.category} value={f.category}>
                {f.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({f.factor} {f.unit})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.factorCategory && (
          <p className="text-xs text-error">{errors.factorCategory.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 수량 */}
        <div className="space-y-1.5">
          <Label htmlFor="quantity">활동량 *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            {...register('quantity', { valueAsNumber: true })}
            className={errors.quantity ? 'border-error' : ''}
          />
          {errors.quantity && (
            <p className="text-xs text-error">{errors.quantity.message}</p>
          )}
        </div>

        {/* 단위 */}
        <div className="space-y-1.5">
          <Label htmlFor="unit">단위 *</Label>
          <Input
            id="unit"
            placeholder="kWh, L, kg 등"
            {...register('unit')}
            readOnly={!!selectedFactor}
            className={cn(
              errors.unit ? 'border-error' : '',
              selectedFactor ? 'bg-muted text-muted-foreground' : '',
            )}
          />
          {errors.unit && (
            <p className="text-xs text-error">{errors.unit.message}</p>
          )}
        </div>
      </div>

      {/* 배출량 미리보기 */}
      {previewEmission !== null && (
        <div className="rounded-lg bg-primary-bg border border-primary-border p-3">
          <p className="text-sm text-primary">
            예상 배출량:{' '}
            <span className="font-bold tabular-nums">
              {previewEmission.toFixed(4)} tCO₂e
            </span>
            <span className="ml-1 text-xs text-primary/70">
              ({(previewEmission * 1000).toFixed(2)} kgCO₂e)
            </span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
