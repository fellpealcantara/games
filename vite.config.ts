import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/roms': {
          target: 'https://github.com/fellpealcantara/games/releases/download',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/roms/, ''),
          followRedirects: true,
        },
        '/api/filmbr': {
          target: 'https://filmbr.i2s1n.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/filmbr/, ''),
          secure: false,
          headers: {
            'User-Agent': 'okhttp/3.14.9',
            'app_id': 'filmbr',
            'package_name': 'com.starshort.minishort',
            'version': '40000',
            'sys_platform': '2',
            'channel_code': 'filmbr_1001',
            'is_vvv': '0',
            'is_language': 'pt',
            'is_display': 'GMT-03:00',
          },
        },
      },
    },
  };
});
