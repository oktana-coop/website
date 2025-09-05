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
          p: 'text-base/7 md:text-lg/9 text-left sm:text-justify mb-6',
          a: 'text-rose-600 hover:text-rose-800 wrap-anywhere',
          h1: 'text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6',
          h2: 'text-xl sm:text-2xl md:text-3xl font-serif font-bold mb-6',
          h3: 'text-lg md:text-[1.375rem] font-serif font-bold mb-4',
          h4: 'text-lg md:text-xl font-serif font-bold mb-2',
          h5: 'text-base md:text-lg font-serif font-bold mb-2',
          h6: 'text-sm md:text-base font-serif font-bold mb-2',
          ul: 'list-disc pl-6 mb-4',
          ol: 'list-decimal pl-6 mb-4',
          li: 'text-base/7 md:text-lg/9 text-left sm:text-justify',
          pre: 'p-4 font-mono bg-black/5 overflow-x-auto mb-6',
        },
      ],
    ],
    shikiConfig: {
      theme: 'catppuccin-macchiato',
    },
  },
});
