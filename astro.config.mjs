// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import tailwindcss from '@tailwindcss/vite';
import rehypeClassNames from 'rehype-class-names';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    rehypePlugins: [
      [
        rehypeClassNames,
        {
          p: 'text-base/7 md:text-lg/9 text-justify mb-6',
          h1: 'text-3xl sm:text-4xl md:text-5xl text-center sm:text-left font-serif font-bold mb-6',
          h2: 'text-xl sm:text-2xl md:text-3xl text-center sm:text-left font-serif font-bold mb-6',
          h3: 'text-lg md:text-[1.375rem] text-center sm:text-left font-serif font-bold mb-4',
          h4: 'text-lg md:text-xl font-serif text-center sm:text-left font-bold mb-2',
          h5: 'text-base md:text-lg font-serif text-center sm:text-left font-bold mb-2',
          h6: 'text-sm md:text-base font-serif text-center sm:text-left font-bold mb-2',
          ul: 'list-disc pl-6 mb-4',
          ol: 'list-decimal pl-6 mb-4',
        },
      ],
    ],
  },
});
