import { describe, it, expect } from 'vitest';
import { CreatePostSchema } from './post';

const validInput = {
  title: '본사 5월 배출량 메모',
  resourceUid: '11111111-1111-1111-1111-111111111111',
  dateTime: '2026-05',
  content: '5월 배출량은 전월 대비 12% 감소.',
};

describe('CreatePostSchema', () => {
  it('전체 필드 유효 시 통과', () => {
    expect(CreatePostSchema.safeParse(validInput).success).toBe(true);
  });

  it('title 빈 문자열은 거부 + 한국어 메시지', () => {
    const result = CreatePostSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('제목을 입력하세요');
    }
  });

  it('content 빈 문자열은 통과 (선택 가능 — min 제약 없음)', () => {
    expect(
      CreatePostSchema.safeParse({ ...validInput, content: '' }).success,
    ).toBe(true);
  });

  it('resourceUid가 UUID 형식이 아니면 거부', () => {
    expect(
      CreatePostSchema.safeParse({ ...validInput, resourceUid: 'company-1' })
        .success,
    ).toBe(false);
  });

  it('dateTime이 YYYY-MM 형식이 아니면 거부 + 한국어 메시지', () => {
    const result = CreatePostSchema.safeParse({
      ...validInput,
      dateTime: '2026-05-08',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('YYYY-MM 형식이어야 합니다');
    }
  });
});
