import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react(), tailwindcss(), viteCommonjs()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  optimizeDeps: { exclude: ['@cornerstonejs/dicom-image-loader'], include: ['dicom-parser'] },
  worker: { format: 'es' },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
