import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: './src/index.tsx' },
    alias: { '@': './src' },
  },
  html: { title: 'Offline Messenger' },
  server: { port: 5173 },
});
