import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema } from './models/post';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog/' }),
  schema: postSchema,
});

export const collections = { blog };
