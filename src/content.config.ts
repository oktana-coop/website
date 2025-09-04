import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog/posts/' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string().url().optional(),
    status: z.enum(['unstarted', 'draft', 'published']).default('unstarted'),
    createdAt: z.coerce.date(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = { blog };
