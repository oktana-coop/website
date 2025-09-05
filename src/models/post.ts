import { defineCollection, z } from 'astro:content';

export const postSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string().url().optional(),
  status: z.enum(['unstarted', 'draft', 'published']).default('unstarted'),
  createdAt: z.coerce.date(),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Post = z.infer<typeof postSchema>;

export const getDisplayDate = (post: Post) => {
  if (post.status === 'published' && post.publishedAt) {
    return `Published on ${post.publishedAt.toLocaleDateString()}`;
  }

  if (post.status === 'draft') {
    if (post.updatedAt) {
      return `Last updated on ${post.updatedAt.toLocaleDateString()}`;
    }

    return `Created on ${post.createdAt.toLocaleDateString()}`;
  }

  return 'Coming Soon';
};
