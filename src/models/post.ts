import { z } from 'astro:content';

export const postSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string().url().optional(),
  status: z.enum(['unstarted', 'draft', 'published']).default('unstarted'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  publishedAt: z.coerce.date().optional(),
});

export type Post = z.infer<typeof postSchema>;

export type PublishedPost = Post & { status: 'published'; publishedAt: Date };
export type DraftPost = Post & { status: 'draft' };
export type UnstartedPost = Post & { status: 'unstarted' };

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

export const isPublishedPost = (post: Post): post is PublishedPost => {
  return post.status === 'published' && post.publishedAt !== undefined;
};

export const isDraftPost = (post: Post): post is DraftPost => {
  return post.status === 'draft';
};

export const isUnstartedPost = (post: Post): post is UnstartedPost => {
  return post.status === 'unstarted';
};
