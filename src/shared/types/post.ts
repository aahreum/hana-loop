import { z } from 'zod';
import { YearMonthSchema } from './common';

export const CreatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  resourceUid: z.string().uuid(),
  dateTime: YearMonthSchema,
  content: z.string(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const PostSchema = CreatePostSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type Post = z.infer<typeof PostSchema>;
