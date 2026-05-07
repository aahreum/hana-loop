import { z } from 'zod';

export const CreatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  resourceUid: z.string().uuid(),
  dateTime: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM 형식이어야 합니다'),
  content: z.string(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const PostSchema = CreatePostSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type Post = z.infer<typeof PostSchema>;
